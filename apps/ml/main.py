import os
from fastapi import FastAPI
from pydantic import BaseModel, HttpUrl, field_validator
from infer import predict_image, predict_video, load_model

app = FastAPI(title="Deepfake ML Service", version="0.0.1")

class PredictIn(BaseModel):
    url: HttpUrl
    type: str  # "image" | "video"

    @field_validator("type")
    @classmethod
    def _val_type(cls, v: str):
        v = v.lower()
        if v not in {"image", "video"}:
            raise ValueError("type must be 'image' or 'video'")
        return v

class PredictOut(BaseModel):
    score: float
    modelVersion: str
    runtimeMs: float
    framesUsed: int | None = None

@app.get("/health")
def health():
    dev = "cuda" if os.getenv("CUDA_VISIBLE_DEVICES") else "cpu"
    return {"ok": True, "device": dev}

@app.post("/predict", response_model=PredictOut)
def predict(body: PredictIn):
    # warm model on first call
    load_model()

    if body.type == "image":
        score, version, ms = predict_image(str(body.url))
        return PredictOut(score=score, modelVersion=version, runtimeMs=ms)
    else:
        score, version, ms, frames = predict_video(str(body.url))
        return PredictOut(score=score, modelVersion=version, runtimeMs=ms, framesUsed=frames)
