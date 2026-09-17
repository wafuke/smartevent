"""
SmartEvent ML Prediction Service
Loads the trained attendance-prediction model (exported from Colab as .joblib)
and exposes it over HTTP for the Node.js backend to call.
"""
import os
import joblib
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="SmartEvent ML Prediction Service")

MODEL_PATH = os.getenv("MODEL_PATH", "./models/attendance_model.joblib")
model = None


@app.on_event("startup")
def load_model():
    global model
    if os.path.exists(MODEL_PATH):
        model = joblib.load(MODEL_PATH)
        print(f"Loaded model from {MODEL_PATH}")
    else:
        print(f"WARNING: no model found at {MODEL_PATH}. "
              f"Copy the trained model from Google Drive into ml-service/models/ first.")


class PredictionRequest(BaseModel):
    # TODO: replace these placeholder fields with your final engineered features
    # once 5.3/5.4 (dataset + training) are finalised.
    eventType: str
    dayOfWeek: int
    timeSlot: str
    pastAttendanceRate: float
    registrationCount: int
    smsSent: int


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/predict")
def predict(payload: PredictionRequest):
    if model is None:
        return {"error": "Model not loaded. Place attendance_model.joblib in ml-service/models/."}

    # Placeholder feature framing - align this with however you encode
    # features during training in the Colab notebook.
    df = pd.DataFrame([payload.dict()])
    prediction = model.predict(df)[0]
    return {"prediction": str(prediction)}
