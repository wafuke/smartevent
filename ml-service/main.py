"""
SmartEvent ML Prediction Service
Loads the trained Logistic Regression attendance-prediction pipeline
(trained via smartevent_ml on Kaggle + Strathmore University synthetic event registrations)
and exposes it over HTTP for the Node.js backend and frontend dashboards.
"""
import json
import os
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent

app = FastAPI(
    title="SmartEvent ML Attendance Prediction API",
    description="Predicts student event turnout probabilities and headcount for Strathmore University events using a calibrated Logistic Regression pipeline.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CANDIDATE_MODEL_PATHS = [
    os.getenv("MODEL_PATH", ""),
    str(BASE_DIR / "models" / "attendance_model.joblib"),
    "./models/attendance_model.joblib",
    "/content/drive/MyDrive/SmartEvent_ML/models/attendance_model.joblib",
    "../notebooks/attendance_model.joblib"
]

METADATA_FILE = BASE_DIR / "models" / "model_metadata.json"
KAGGLE_SUMMARY_FILE = BASE_DIR / "data" / "processed" / "kaggle_summary.json"
CLEANING_REPORT_FILE = BASE_DIR / "data" / "processed" / "cleaning_report.json"

model = None
loaded_path = None
metadata = {}

CATEGORY_MAP = {
    "academic": "Academic",
    "workshop": "Workshop",
    "seminar": "Seminar",
    "club activity": "Club Activity",
    "club": "Club Activity",
    "sports": "Sports",
    "career fair": "Career Fair",
    "career": "Career Fair",
    "cultural": "Club Activity",
    "cultural night": "Club Activity",
    "guest lecture": "Seminar",
}

SMS_MAP = {
    0: "none",
    1: "low",
    2: "medium",
    3: "high"
}


def load_artifacts():
    global model, loaded_path, metadata
    for path in CANDIDATE_MODEL_PATHS:
        if path and os.path.exists(path):
            try:
                model = joblib.load(path)
                loaded_path = path
                print(f"[SmartEvent ML] Successfully loaded model from: {path}")
                break
            except Exception as e:
                print(f"[SmartEvent ML] Failed to load model from {path}: {e}")

    if METADATA_FILE.exists():
        try:
            metadata = json.loads(METADATA_FILE.read_text(encoding="utf-8"))
        except Exception as e:
            print(f"[SmartEvent ML] Could not parse model_metadata.json: {e}")

    if model is None:
        print("[SmartEvent ML] WARNING: No trained .joblib model found. Falling back to heuristic calculation.")


@app.on_event("startup")
def on_startup():
    load_artifacts()


class PredictionRequest(BaseModel):
    eventType: str = Field(..., example="Academic")
    dayOfWeek: int = Field(..., ge=0, le=6, example=2)
    timeSlot: str = Field(..., example="Afternoon")
    venueCapacity: int = Field(..., ge=10, example=150)
    registrationCount: int = Field(..., ge=0, example=110)
    pastAttendanceRate: float = Field(default=0.75, ge=0.0, le=1.0, example=0.78)
    smsPriority: int = Field(default=2, ge=0, le=3, example=3)
    weather: Optional[str] = Field(default="sunny", example="sunny")
    examPeriod: Optional[int] = Field(default=0, ge=0, le=1, example=0)
    leadDays: Optional[int] = Field(default=5, ge=0, le=60, example=5)


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
    algorithm: Optional[str] = None
    modelMetrics: Optional[dict] = None


def _build_cohort_dataframe(payload: PredictionRequest, sms_override: Optional[str] = None) -> pd.DataFrame:
    """
    Constructs a representative cohort of Strathmore student registrants for the event
    so the student-level Logistic Regression pipeline (`predict_proba`) can marginalize
    over realistic student travel times, residency, and years of study.
    """
    defaults = metadata.get("default_registrant_profile", {})
    cat = CATEGORY_MAP.get(payload.eventType.strip().lower(), "Academic")
    slot = payload.timeSlot.strip().title()
    if slot not in ("Morning", "Afternoon", "Evening"):
        slot = "Afternoon"

    sms_label = sms_override if sms_override is not None else SMS_MAP.get(payload.smsPriority, "medium")
    weather = (payload.weather or defaults.get("weather", "sunny")).lower()

    # Build a 9-student representative quadrature cohort spanning commuter vs hostel & study years
    profiles = [
        {"year_of_study": 1, "hostel_resident": 1, "travel_time_minutes": 12.0, "past_events_count": 3},
        {"year_of_study": 1, "hostel_resident": 0, "travel_time_minutes": 35.0, "past_events_count": 2},
        {"year_of_study": 2, "hostel_resident": 1, "travel_time_minutes": 15.0, "past_events_count": 6},
        {"year_of_study": 2, "hostel_resident": 0, "travel_time_minutes": 45.0, "past_events_count": 5},
        {"year_of_study": 3, "hostel_resident": 0, "travel_time_minutes": 30.0, "past_events_count": 8},
        {"year_of_study": 3, "hostel_resident": 0, "travel_time_minutes": 60.0, "past_events_count": 7},
        {"year_of_study": 4, "hostel_resident": 0, "travel_time_minutes": 40.0, "past_events_count": 10},
        {"year_of_study": 4, "hostel_resident": 0, "travel_time_minutes": 75.0, "past_events_count": 9},
        {"year_of_study": 2, "hostel_resident": 0, "travel_time_minutes": 25.0, "past_events_count": 0},
    ]

    eff_registered = payload.registrationCount if payload.registrationCount > 0 else int(payload.venueCapacity * 0.75)
    rows = []
    for prof in profiles:
        rows.append({
            "event_category": cat,
            "time_slot": slot,
            "weather": weather,
            "sms_priority": sms_label,
            "day_of_week": int(payload.dayOfWeek),
            "venue_capacity": int(payload.venueCapacity),
            "registered_count": int(eff_registered),
            "lead_days": int(payload.leadDays if payload.leadDays is not None else defaults.get("lead_days", 4)),
            "exam_period": int(payload.examPeriod if payload.examPeriod is not None else 0),
            "year_of_study": prof["year_of_study"],
            "hostel_resident": prof["hostel_resident"],
            "travel_time_minutes": prof["travel_time_minutes"],
            "past_attendance_rate": float(payload.pastAttendanceRate) if prof["past_events_count"] > 0 else np.nan,
            "past_events_count": prof["past_events_count"],
            "gender": defaults.get("gender", "other"),
            "parent_education": defaults.get("parent_education", "graduate"),
        })
    return pd.DataFrame(rows)


@app.get("/health")
def health():
    if model is None:
        load_artifacts()
    return {
        "status": "ok",
        "service": "SmartEvent ML Prediction Engine",
        "model_loaded": model is not None,
        "loaded_model_path": loaded_path or "None (Fallback Mode)",
        "algorithm": metadata.get("algorithm", "LogisticRegression"),
        "version": metadata.get("version"),
        "test_metrics": metadata.get("test_metrics", {}),
        "google_colab_ready": True
    }


@app.get("/model-info")
def get_model_info():
    """Returns full pipeline metadata, Kaggle audit, cleaning report, and evaluation metrics."""
    if model is None:
        load_artifacts()
    kaggle_info = {}
    cleaning_info = {}
    if KAGGLE_SUMMARY_FILE.exists():
        kaggle_info = json.loads(KAGGLE_SUMMARY_FILE.read_text(encoding="utf-8"))
    if CLEANING_REPORT_FILE.exists():
        cleaning_info = json.loads(CLEANING_REPORT_FILE.read_text(encoding="utf-8"))
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "metadata": metadata,
        "kaggle_audit": kaggle_info,
        "cleaning_report": cleaning_info
    }


@app.post("/predict", response_model=PredictionResponse)
def predict_attendance(payload: PredictionRequest):
    if model is None:
        load_artifacts()

    is_model_based = False
    sms_boost = {0: 0.0, 1: 2.5, 2: 6.5, 3: 13.5}.get(payload.smsPriority, 6.5)
    eff_reg = payload.registrationCount if payload.registrationCount > 0 else int(round(payload.venueCapacity * 0.75))

    if model is not None:
        try:
            if hasattr(model, "predict_proba"):
                cohort_df = _build_cohort_dataframe(payload)
                probs = model.predict_proba(cohort_df)[:, 1]
                mean_prob = float(np.mean(probs))

                # Counterfactual SMS lift directly from the trained Logistic Regression pipeline
                cohort_no_sms = _build_cohort_dataframe(payload, sms_override="none")
                prob_no_sms = float(np.mean(model.predict_proba(cohort_no_sms)[:, 1]))
                sms_boost = round(max(0.0, (mean_prob - prob_no_sms) * 100.0), 1)

                raw_expected = eff_reg * mean_prob
                predicted_count = int(np.clip(round(raw_expected), 0, payload.venueCapacity))
                turnout_rate = round(mean_prob, 3)
                is_model_based = True
            else:
                # Legacy regressor pipeline fallback
                legacy_df = pd.DataFrame([{
                    "eventType": payload.eventType,
                    "dayOfWeek": payload.dayOfWeek,
                    "timeSlot": payload.timeSlot,
                    "venueCapacity": payload.venueCapacity,
                    "registrationCount": eff_reg,
                    "pastAttendanceRate": payload.pastAttendanceRate,
                    "smsPriority": payload.smsPriority
                }])
                raw_pred = model.predict(legacy_df)[0]
                predicted_count = int(np.clip(round(raw_pred), 0, payload.venueCapacity))
                turnout_rate = round(predicted_count / max(eff_reg, 1), 3)
                is_model_based = True
        except Exception as e:
            print(f"[SmartEvent ML] Model inference error: {e}, falling back to heuristic calculation.")
            predicted_count = _fallback_predict(payload, eff_reg)
            turnout_rate = round(predicted_count / max(eff_reg, 1), 3)
    else:
        predicted_count = _fallback_predict(payload, eff_reg)
        turnout_rate = round(predicted_count / max(eff_reg, 1), 3)

    capacity_util = round((predicted_count / payload.venueCapacity) * 100, 1)

    if capacity_util > 95:
        risk = "HIGH_OVERCROWDING_RISK"
        rec = (
            f"Predicted attendance ({predicted_count} students, {round(turnout_rate * 100, 1)}% turnout) "
            f"is near max venue capacity ({payload.venueCapacity}). Consider moving to a larger lecture hall or enabling overflow seating."
        )
    elif capacity_util < 40:
        risk = "LOW_TURNOUT_RISK"
        rec = (
            f"Predicted attendance ({predicted_count} students, {capacity_util}% of venue capacity) is below 40%. "
            f"Dispatch a High-Priority SMS reminder via Africa's Talking (+{max(sms_boost, 11.5)}% expected turnout lift)."
        )
    else:
        risk = "OPTIMAL_ATTENDANCE"
        rec = (
            f"Expected attendance is optimal ({predicted_count} students, {capacity_util}% venue utilization, "
            f"{round(turnout_rate * 100, 1)}% turnout rate). Standard logistics setup recommended."
        )

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
        "loadedModelPath": loaded_path or "Rule-based Engine",
        "algorithm": metadata.get("algorithm", "LogisticRegression"),
        "modelMetrics": metadata.get("test_metrics", {}).get("threshold_0_5")
    }


def _fallback_predict(payload: PredictionRequest, eff_reg: int) -> int:
    base = eff_reg * payload.pastAttendanceRate
    if payload.smsPriority == 3:
        base *= 1.12
    elif payload.smsPriority == 2:
        base *= 1.05
    return int(np.clip(round(base), 0, payload.venueCapacity))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
