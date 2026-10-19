"""Central configuration for the SmartEvent attendance-prediction pipeline."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
RAW_KAGGLE_CSV = DATA_DIR / "Attendance_Prediction.csv"
PROCESSED_DIR = DATA_DIR / "processed"
MODELS_DIR = ROOT / "models"
REPORTS_DIR = ROOT / "reports"
FIGURES_DIR = REPORTS_DIR / "figures"

MODEL_PATH = MODELS_DIR / "attendance_model.joblib"
METADATA_PATH = MODELS_DIR / "model_metadata.json"

SEED = 42

# Vocabularies shared by the generator, the cleaner, the API and the web/mobile apps.
CATEGORIES = ["Academic", "Workshop", "Seminar", "Sports", "Career Fair", "Social & Cultural"]
TIME_SLOTS = ["Morning", "Afternoon", "Evening"]
WEATHER = ["sunny", "cloudy", "rainy", "hot", "cold"]
SMS_PRIORITIES = ["none", "low", "medium", "high"]
DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

TARGET = "attended"
ID_COLUMNS = ["registration_id", "event_id", "student_id", "event_date"]

# Raw candidate predictors available at prediction time.
CATEGORICAL_FEATURES = ["event_category", "time_slot", "weather", "sms_priority"]
NUMERIC_FEATURES = [
    "day_of_week", "venue_capacity", "registered_count", "lead_days", "exam_period",
    "year_of_study", "hostel_resident", "travel_time_minutes",
    "past_attendance_rate", "past_events_count",
]
# Columns carried over from the Kaggle student profiles that have no real effect.
# They are deliberately kept as candidates so feature selection has to prove they are useless.
NOISE_CANDIDATES = ["gender", "parent_education"]

# Features created inside the sklearn pipeline (see features.add_engineered_features).
ENGINEERED_FEATURES = ["fill_ratio", "overbooked_excess", "is_weekend", "log_lead_days", "has_history"]
