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

# ===================== TORCH HARD LIMITS (IMPORTANT) =====================
torch.set_num_threads(1)
torch.backends.mkldnn.enabled = False

# ===================== ENV CONFIG =====================
DEFAULT_BACKBONE = os.getenv("BACKBONE", "efficientnet_b0")
MODEL_PATH = os.getenv("MODEL_PATH", "./models/deepfake.pt")
IMAGE_SIZE_ENV = int(os.getenv("IMAGE_SIZE", "224"))
FRAME_SAMPLE_COUNT = int(os.getenv("FRAME_SAMPLE_COUNT", "5"))  # 🔴 reduced

SCORE_MEANING = os.getenv("SCORE_MEANING", "fake").lower()
FAKE_CLASS_INDEX = int(os.getenv("FAKE_CLASS_INDEX", "1"))

_device = torch.device("cpu")  # 🔴 FORCE CPU (Render-safe)
_model: Optional[nn.Module] = None
_tfms = None

_meta = {
    "backbone": DEFAULT_BACKBONE,
    "image_size": IMAGE_SIZE_ENV,
    "num_logits": 1,
    "version": "unloaded",
    "weights_loaded": False,
}

# ===================== MODEL LOADING =====================

def _build_model(backbone: str, num_logits: int) -> nn.Module:
    # 🔴 pretrained=False saves ~300MB RAM
    return timm.create_model(
        backbone,
        pretrained=False,
        num_classes=num_logits
    )

def _build_transforms(model: nn.Module, image_size: int):
    cfg = timm.data.resolve_model_data_config(model)
    cfg["input_size"] = (3, image_size, image_size)
    return timm.data.create_transform(**cfg, is_training=False)

def load_model() -> Tuple[nn.Module, str]:
    global _model, _tfms, _meta
    if _model is not None:
        return _model, _meta["version"]

    backbone = DEFAULT_BACKBONE
    image_size = IMAGE_SIZE_ENV
    num_logits = 1
    ckpt_state = None

    if os.path.exists(MODEL_PATH):
        ckpt = torch.load(MODEL_PATH, map_location="cpu")
        if isinstance(ckpt, dict) and "state_dict" in ckpt:
            ckpt_state = ckpt["state_dict"]
            backbone = ckpt.get("backbone", backbone)
            image_size = ckpt.get("image_size", image_size)
            num_logits = ckpt.get("num_logits", num_logits)
        else:
            ckpt_state = ckpt

    model = _build_model(backbone, num_logits)
    model.load_state_dict(ckpt_state, strict=False)
    model.eval()

    _tfms = _build_transforms(model, image_size)

    _model = model
    _meta.update({
        "backbone": backbone,
        "image_size": image_size,
        "num_logits": num_logits,
        "version": f"{backbone}-custom",
        "weights_loaded": True,
    })

    return _model, _meta["version"]

# ===================== UTILITIES =====================

def _fetch_bytes(url: str, max_mb: int = 20) -> bytes:
    with requests.get(url, stream=True, timeout=15) as r:
        r.raise_for_status()
        buf = io.BytesIO()
        total = 0
        for chunk in r.iter_content(1024 * 128):
            if not chunk:
                continue
            buf.write(chunk)
            total += len(chunk)
            if total > max_mb * 1024 * 1024:
                raise RuntimeError("file-too-large")
        return buf.getvalue()

def _open_image_bytes(raw: bytes) -> np.ndarray:
    img = Image.open(io.BytesIO(raw)).convert("RGB")
    img.thumbnail((IMAGE_SIZE_ENV, IMAGE_SIZE_ENV))  # 🔴 HARD RESIZE
    return np.array(img)

def _prep_image(arr: np.ndarray) -> torch.Tensor:
    x = _tfms(Image.fromarray(arr))
    return x.unsqueeze(0)

def _score_from_logits(out: torch.Tensor) -> float:
    out = out.detach().cpu()

    if out.shape[-1] == 1:
        s = torch.sigmoid(out.squeeze()).item()
        if SCORE_MEANING == "real":
            s = 1.0 - s
    else:
        s = torch.softmax(out, dim=-1)[0, FAKE_CLASS_INDEX].item()

    return float(max(0.0, min(1.0, s)))

# ===================== IMAGE PREDICTION =====================

@torch.inference_mode()
def predict_image(url: str) -> Tuple[float, str, float]:
    model, version = load_model()
    t0 = time.perf_counter()

    raw = _fetch_bytes(url)
    arr = _open_image_bytes(raw)
    x = _prep_image(arr)
    out = model(x)

    score = _score_from_logits(out)

    # 🔴 CLEANUP
    del raw, arr, x, out
    torch.cuda.empty_cache()

    ms = (time.perf_counter() - t0) * 1000.0
    return score, version, ms

# ===================== VIDEO HELPERS =====================

def _sample_video_frames(path: str, n: int) -> List[np.ndarray]:
    cap = cv2.VideoCapture(path)
    frames = []

    while len(frames) < n:
        ok, frame = cap.read()
        if not ok:
            break
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        frame = cv2.resize(frame, (IMAGE_SIZE_ENV, IMAGE_SIZE_ENV))
        frames.append(frame)

    cap.release()
    return frames

# ===================== VIDEO PREDICTION =====================

@torch.inference_mode()
def predict_video(url: str) -> Tuple[float, str, float, int]:
    model, version = load_model()
    t0 = time.perf_counter()

    with tempfile.NamedTemporaryFile(suffix=".mp4") as tmp:
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
            del x, out

        score = float(np.mean(scores))

    # 🔴 CLEANUP
    del frames, raw
    torch.cuda.empty_cache()

    ms = (time.perf_counter() - t0) * 1000.0
    return score, version, ms, len(scores)

# ===================== INFO =====================

def model_info():
    load_model()
    return {
        **_meta,
        "device": str(_device),
        "model_path": os.path.abspath(MODEL_PATH),
        "score_meaning": SCORE_MEANING,
        "fake_class_index": FAKE_CLASS_INDEX,
    }
