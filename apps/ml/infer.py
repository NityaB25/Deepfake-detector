import io
import os
import time
import tempfile
from typing import List, Tuple, Optional

import cv2
import numpy as np
import requests
import torch
import torch.nn as nn
from PIL import Image
import timm

# ---------------------- Env-configurable defaults ----------------------
DEFAULT_BACKBONE     = os.getenv("BACKBONE", "efficientnet_b0")
MODEL_PATH           = os.getenv("MODEL_PATH", "./models/deepfake.pt")
IMAGE_SIZE_ENV       = int(os.getenv("IMAGE_SIZE", "224"))
FRAME_SAMPLE_COUNT   = int(os.getenv("FRAME_SAMPLE_COUNT", "12"))

# How to interpret a **1-logit** model's output:
#   - "fake" (default): sigmoid(logit) = P(fake)
#   - "real": sigmoid(logit) = P(real)  -> we will flip to 1 - P(real) so API gets P(fake)
SCORE_MEANING        = os.getenv("SCORE_MEANING", "fake").lower()

# For **2-logit** models (softmax), which class index corresponds to "fake"?
# Typically 1 = fake when classes are [real, fake]; change if your training used [fake, real].
FAKE_CLASS_INDEX     = int(os.getenv("FAKE_CLASS_INDEX", "1"))

_device: torch.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
_model: Optional[nn.Module] = None
_tfms = None
_meta = {
    "backbone": DEFAULT_BACKBONE,
    "image_size": IMAGE_SIZE_ENV,
    "num_logits": 1,
    "version": f"{DEFAULT_BACKBONE}-pretrained",
    "weights_loaded": False,
}

# --------------------------- Model loading -----------------------------

def _build_model(backbone: str, num_logits: int) -> nn.Module:
    # timm will construct classifier with num_logits outputs
    return timm.create_model(backbone, pretrained=True, num_classes=num_logits)

def _build_transforms(model: nn.Module, image_size: int):
    cfg = timm.data.resolve_model_data_config(model)
    if image_size:
        cfg["input_size"] = (3, image_size, image_size)
    return timm.data.create_transform(**cfg, is_training=False)

def load_model() -> Tuple[nn.Module, str]:
    """
    Loads:
      - pretrained backbone by default, OR
      - your checkpoint at MODEL_PATH.
    Checkpoint formats supported:
      A) {"state_dict": ..., "backbone": str?, "image_size": int?, "num_logits": int?}
      B) raw state_dict (dict of tensor buffers)
    """
    global _model, _tfms, _meta
    if _model is not None:
        return _model, _meta["version"]

    backbone   = DEFAULT_BACKBONE
    image_size = IMAGE_SIZE_ENV
    num_logits = 1
    ckpt_state = None

    if os.path.exists(MODEL_PATH):
        try:
            ckpt = torch.load(MODEL_PATH, map_location=_device)
            if isinstance(ckpt, dict) and "state_dict" in ckpt:
                ckpt_state = ckpt["state_dict"]
                backbone   = str(ckpt.get("backbone", backbone))
                image_size = int(ckpt.get("image_size", image_size))
                num_logits = int(ckpt.get("num_logits", num_logits))
            elif isinstance(ckpt, dict):
                ckpt_state = ckpt  # assume pure state_dict
            else:
                ckpt_state = ckpt
        except Exception as e:
            print(f"[infer] Failed to read {MODEL_PATH}: {e}")

    model = _build_model(backbone, num_logits).to(_device).eval()
    _tfms = _build_transforms(model, image_size)

    version = f"{backbone}-pretrained"
    if ckpt_state is not None:
        try:
            missing, unexpected = model.load_state_dict(ckpt_state, strict=False)
            print(f"[infer] Loaded weights from {MODEL_PATH}. Missing:{len(missing)} Unexpected:{len(unexpected)}")
            if missing:   print(f"[infer]   Missing keys (first 10): {missing[:10]}")
            if unexpected:print(f"[infer]   Unexpected keys (first 10): {unexpected[:10]}")
            version = f"{backbone}-custom"
            _meta["weights_loaded"] = True
        except Exception as e:
            print(f"[infer] Could not load weights from {MODEL_PATH}: {e}")

    _model = model
    _meta.update({
        "backbone": backbone,
        "image_size": image_size,
        "num_logits": num_logits,
        "version": version,
    })
    return _model, version

# --------------------------- Utilities -----------------------------

def _fetch_bytes(url: str, max_mb: int = 100) -> bytes:
    with requests.get(url, stream=True, timeout=30) as r:
        r.raise_for_status()
        buf = io.BytesIO()
        total = 0
        for chunk in r.iter_content(1024 * 256):
            if not chunk:
                continue
            buf.write(chunk)
            total += len(chunk)
            if total > max_mb * 1024 * 1024:
                raise ValueError("file-too-large")
        return buf.getvalue()

def _open_image_bytes(raw: bytes) -> np.ndarray:
    # Try Pillow first, fallback to OpenCV (covers WEBP and odd encodings)
    try:
        img = Image.open(io.BytesIO(raw)).convert("RGB")
        return np.array(img)
    except Exception as e:
        arr = np.frombuffer(raw, dtype=np.uint8)
        mat = cv2.imdecode(arr, cv2.IMREAD_COLOR)  # BGR
        if mat is None:
            raise RuntimeError(f"decode-failed: {e}")
        return cv2.cvtColor(mat, cv2.COLOR_BGR2RGB)

def _prep_image(arr: np.ndarray) -> torch.Tensor:
    x = _tfms(Image.fromarray(arr))  # CHW float tensor
    return x.unsqueeze(0).to(_device)

def _score_from_logits(out: torch.Tensor) -> float:
    """
    Convert raw model outputs to P(fake) \in [0,1].
    - For 1-logit heads (BCE), apply sigmoid; if SCORE_MEANING=="real", invert to get P(fake).
    - For 2-logit heads (softmax), take softmax(...) at FAKE_CLASS_INDEX.
    """
    out = out.detach().to("cpu")
    if out.ndim == 1:
        out = out.unsqueeze(0)

    if out.shape[-1] == 1:
        # 1-logit model
        s = torch.sigmoid(out.squeeze()).item()
        if SCORE_MEANING == "real":
            s = 1.0 - s  # flip P(real) -> P(fake)
    else:
        # 2-logit model: choose the configured class index for "fake"
        s = torch.softmax(out, dim=-1)[0, FAKE_CLASS_INDEX].item()

    # clamp to [0,1] to be safe
    s = max(0.0, min(1.0, float(s)))
    return s

# --------------------------- Predictors -----------------------------

@torch.inference_mode()
def predict_image(url: str) -> Tuple[float, str, float]:
    model, version = load_model()
    t0 = time.perf_counter()
    raw = _fetch_bytes(url)
    arr = _open_image_bytes(raw)
    x = _prep_image(arr)
    out = model(x)
    score = _score_from_logits(out)
    ms = (time.perf_counter() - t0) * 1000.0
    return score, version, ms

def _sample_video_frames(path: str, n: int) -> List[np.ndarray]:
    cap = cv2.VideoCapture(path)
    if not cap.isOpened():
        raise RuntimeError("cannot-open-video")
    length = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 0

    frames: List[np.ndarray] = []
    if length <= 0:
        # naive fallback: first n frames
        while len(frames) < n:
            ok, frame = cap.read()
            if not ok: break
            frames.append(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        cap.release()
        return frames

    idxs = np.linspace(0, max(0, length - 1), num=n, dtype=int)
    want = set(int(i) for i in idxs)
    i = 0
    while True:
        ok, frame = cap.read()
        if not ok: break
        if i in want:
            frames.append(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            if len(frames) >= n: break
        i += 1
    cap.release()
    return frames

@torch.inference_mode()
def predict_video(url: str) -> Tuple[float, str, float, int]:
    model, version = load_model()
    t0 = time.perf_counter()

    # Download to temp (VideoCapture prefers files on Windows)
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=True) as tmp:
        raw = _fetch_bytes(url)
        tmp.write(raw)
        tmp.flush()

        frames = _sample_video_frames(tmp.name, FRAME_SAMPLE_COUNT)
        if not frames:
            raise RuntimeError("no-frames")

        scores = []
        for f in frames:
            x = _prep_image(f)
            out = model(x)
            scores.append(_score_from_logits(out))

        score = float(np.mean(scores))
        ms = (time.perf_counter() - t0) * 1000.0
        return score, version, ms, len(frames)

# --------------------------- Info helper -----------------------------

def model_info():
    load_model()
    return {
        **_meta,
        "device": str(_device),
        "model_path": os.path.abspath(MODEL_PATH),
        "score_meaning": SCORE_MEANING,
        "fake_class_index": FAKE_CLASS_INDEX,
    }
