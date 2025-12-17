import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, HttpUrl, field_validator
from infer import predict_image, predict_video, load_model

app = FastAPI(title="Deepfake ML Service", version="1.0.0")

# ===================== MODELS =====================

class PredictIn(BaseModel):
    url: HttpUrl
    type: str  # "image" | "video"

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str):
        v = v.lower()
        if v not in {"image", "video"}:
            raise ValueError("type must be 'image' or 'video'")
        return v

class PredictOut(BaseModel):
    score: float
    modelVersion: str
    runtimeMs: float
    framesUsed: int | None = None

# ===================== STARTUP =====================

@app.on_event("startup")
def warmup_model():
    """
    Load model once when service starts.
    Prevents cold-start crashes.
    """
    load_model()

# ===================== HEALTH =====================

@app.get("/health")
def health():
    return {
        "ok": True,
        "device": "cpu",   # 🔴 forced CPU (truthful)
        "model_loaded": True
    }

# ===================== PREDICT =====================

@app.post("/predict", response_model=PredictOut)
def predict(body: PredictIn):
    try:
        if body.type == "image":
            score, version, ms = predict_image(str(body.url))
            return PredictOut(
                score=score,
                modelVersion=version,
                runtimeMs=ms
            )

        score, version, ms, frames = predict_video(str(body.url))
        return PredictOut(
            score=score,
            modelVersion=version,
            runtimeMs=ms,
            framesUsed=frames
        )

    except Exception as e:
        # 🔴 Prevent frontend from breaking
        raise HTTPException(
            status_code=503,
            detail=f"Model unavailable: {str(e)}"
        )
