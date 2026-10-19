"""
Feature engineering + preprocessing pipeline (imputation, normalisation, encoding).

Everything here is wrapped in sklearn objects so that the exact same transformations run
during training, during evaluation and inside the FastAPI service.
"""
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer, OneHotEncoder, StandardScaler

RAW_CATEGORICAL = ["event_category", "time_slot", "weather", "sms_priority"]
RAW_NUMERIC = ["day_of_week", "venue_capacity", "registered_count", "lead_days", "exam_period",
               "year_of_study", "hostel_resident", "travel_time_minutes",
               "past_attendance_rate", "past_events_count"]
NOISE = ["gender", "parent_education"]          # no true effect; feature selection should drop them

ENGINEERED_NUMERIC = ["fill_ratio", "overbooked_excess", "is_weekend", "log_lead_days",
                      "has_history", "evening_travel", "evening_hostel"]

# Columns the API must supply (the engineered ones are derived automatically).
INPUT_COLUMNS = RAW_CATEGORICAL + RAW_NUMERIC + NOISE


def add_engineered_features(X: pd.DataFrame) -> pd.DataFrame:
    X = X.copy()
    cap = X["venue_capacity"].replace(0, np.nan)
    X["fill_ratio"] = X["registered_count"] / cap
    X["overbooked_excess"] = (X["fill_ratio"] - 1).clip(lower=0)
    X["is_weekend"] = (X["day_of_week"] >= 5).astype(float)
    X["log_lead_days"] = np.log1p(X["lead_days"].clip(lower=0))
    X["has_history"] = (X["past_events_count"].fillna(0) > 0).astype(float)
    evening = (X["time_slot"] == "Evening").astype(float)
    X["evening_travel"] = evening * X["travel_time_minutes"]
    X["evening_hostel"] = evening * X["hostel_resident"]
    return X


def engineered_names(_transformer, input_features):
    return list(input_features) + ENGINEERED_NUMERIC


def make_preprocessor(numeric, categorical, scale: bool = True) -> ColumnTransformer:
    num_steps = [("impute", SimpleImputer(strategy="median"))]
    if scale:
        num_steps.append(("scale", StandardScaler()))
    cat_steps = [("impute", SimpleImputer(strategy="most_frequent")),
                 ("onehot", OneHotEncoder(handle_unknown="ignore"))]
    return ColumnTransformer([
        ("num", Pipeline(num_steps), list(numeric)),
        ("cat", Pipeline(cat_steps), list(categorical)),
    ], verbose_feature_names_out=True)


def make_pipeline(model, engineered: bool = True, include_noise: bool = True, scale: bool = True,
                  selector=None) -> Pipeline:
    numeric = RAW_NUMERIC + (ENGINEERED_NUMERIC if engineered else [])
    categorical = RAW_CATEGORICAL + (NOISE if include_noise else [])
    steps = []
    if engineered:
        steps.append(("engineer", FunctionTransformer(add_engineered_features, feature_names_out=engineered_names)))
    steps.append(("prep", make_preprocessor(numeric, categorical, scale=scale)))
    if selector is not None:
        steps.append(("select", selector))
    steps.append(("model", model))
    return Pipeline(steps)
