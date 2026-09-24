"""
SmartEvent ML Prediction Service
Loads the trained attendance-prediction model (exported from Google Colab / Google Drive)
and exposes it over HTTP for the Node.js backend to call.
"""
import os
import joblib
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="SmartEvent ML Attendance Prediction API",
    description="Predicts student event turnout and generates resource recommendations for Strathmore University events.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Candidate paths to locate the trained model artifact (Local workspace or Google Drive)
CANDIDATE_MODEL_PATHS = [
    os.getenv("MODEL_PATH", ""),
    "/content/drive/MyDrive/SmartEvent_ML/models/attendance_model.joblib",
    "./models/attendance_model.joblib",
    "../notebooks/attendance_model.joblib"
]

model = None
loaded_path = None

@app.on_event("startup")
def load_model():
    global model, loaded_path
    for path in CANDIDATE_MODEL_PATHS:
        if path and os.path.exists(path):
            try:
                model = joblib.load(path)
                loaded_path = path
                print(f"[SmartEvent ML] Successfully loaded model from: {path}")
                break
            except Exception as e:
                print(f"[SmartEvent ML] Failed to load model from {path}: {e}")
                
    if model is None:
        print("[SmartEvent ML] WARNING: No trained .joblib model found on Google Drive or local models/ folder.")
        print("[SmartEvent ML] Open notebooks/SmartEvent_ML_Attendance_Prediction.ipynb in Colab to train & export your model.")

class PredictionRequest(BaseModel):
    eventType: str = Field(..., example="Academic") # Academic, Workshop, Seminar, Club Activity, Sports, Career Fair
    dayOfWeek: int = Field(..., ge=0, le=6, example=2) # 0=Monday, 6=Sunday
    timeSlot: str = Field(..., example="Afternoon") # Morning, Afternoon, Evening
    venueCapacity: int = Field(..., ge=10, example=150)
    registrationCount: int = Field(..., ge=0, example=110)
    pastAttendanceRate: float = Field(default=0.75, ge=0.0, le=1.0, example=0.78)
    smsPriority: int = Field(default=2, ge=1, le=3, example=3) # 1: Low, 2: Medium, 3: High

class PredictionResponse(BaseModel):
    predictedAttendance: int
    predictedTurnoutRate: float
    venueCapacity: int
    registrationCount: int
    capacityUtilization: float
    riskLevel: str
    smsImpactBoostPct: float
    recommendation: str
    isModelBased: bool
    loadedModelPath: str

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "SmartEvent ML Prediction Engine",
        "model_loaded": model is not None,
        "loaded_model_path": loaded_path or "None (Fallback Mode)",
        "google_colab_ready": True
    }

@app.post("/predict", response_model=PredictionResponse)
def predict_attendance(payload: PredictionRequest):
    input_data = pd.DataFrame([{
        'eventType': payload.eventType,
        'dayOfWeek': payload.dayOfWeek,
        'timeSlot': payload.timeSlot,
        'venueCapacity': payload.venueCapacity,
        'registrationCount': payload.registrationCount,
        'pastAttendanceRate': payload.pastAttendanceRate,
        'smsPriority': payload.smsPriority
    }])
    
    is_model_based = False
    if model is not None:
        try:
            raw_pred = model.predict(input_data)[0]
            predicted_count = int(np.clip(round(raw_pred), 0, payload.venueCapacity))
            is_model_based = True
        except Exception as e:
            print(f"Model inference error: {e}, falling back to heuristic calculation.")
            predicted_count = _fallback_predict(payload)
    else:
        predicted_count = _fallback_predict(payload)
        
    turnout_rate = round(predicted_count / max(payload.registrationCount, 1), 3)
    if payload.registrationCount == 0:
        turnout_rate = round(payload.pastAttendanceRate, 3)
        predicted_count = int(round(payload.venueCapacity * turnout_rate))
        
    capacity_util = round((predicted_count / payload.venueCapacity) * 100, 1)
    sms_boost = {1: 0.0, 2: 5.0, 3: 12.5}.get(payload.smsPriority, 5.0)
    
    if capacity_util > 95:
        risk = "HIGH_OVERCROWDING_RISK"
        rec = f"Predicted attendance ({predicted_count}) is near max venue capacity ({payload.venueCapacity}). Consider moving to a larger lecture hall."
    elif capacity_util < 40:
        risk = "LOW_TURNOUT_RISK"
        rec = f"Predicted attendance ({predicted_count}) is under 40% of venue capacity ({payload.venueCapacity}). Send a High-Priority SMS reminder to boost turnout."
    else:
        risk = "OPTIMAL_ATTENDANCE"
        rec = f"Expected attendance is optimal ({predicted_count} students, {capacity_util}% capacity). Standard logistics setup recommended."

    return {
        "predictedAttendance": predicted_count,
        "predictedTurnoutRate": turnout_rate,
        "venueCapacity": payload.venueCapacity,
        "registrationCount": payload.registrationCount,
        "capacityUtilization": capacity_util,
        "riskLevel": risk,
        "smsImpactBoostPct": sms_boost,
        "recommendation": rec,
        "isModelBased": is_model_based,
        "loadedModelPath": loaded_path or "Rule-based Engine"
    }

def _fallback_predict(payload: PredictionRequest) -> int:
    base = payload.registrationCount * payload.pastAttendanceRate
    if payload.smsPriority == 3:
        base *= 1.12
    elif payload.smsPriority == 2:
        base *= 1.05
    return int(np.clip(round(base), 0, payload.venueCapacity))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
