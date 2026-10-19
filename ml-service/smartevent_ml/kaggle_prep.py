"""
Stage 1 - Kaggle dataset: audit, clean, and learn real behavioural effects.

The Kaggle file records whether a student attended a *class* on a given day. It is
not event data, so we do NOT train the event model on it directly. Instead we use it for:
  1. a pool of realistic student profiles (year, hostel, travel time, ...), and
  2. effect sizes (log-odds) for behaviours that also apply to events
     (bad weather, long commutes, living on campus, engagement).
Both feed the synthetic university-event generator in Stage 2.
"""
import json

import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

from .config import PROCESSED_DIR, RAW_KAGGLE_CSV, SEED

YEAR_MAP = {"1st year": 1, "2nd year": 2, "3rd year": 3, "4th year": 4}
VALID_RANGES = {
    "age": (16, 40),
    "study_hours": (0, 16),
    "sleep_hours": (2, 14),
    "travel_time_minutes": (0, 240),
}


def audit(df: pd.DataFrame) -> dict:
    return {
        "rows": int(len(df)),
        "columns": int(df.shape[1]),
        "missing_cells": int(df.isna().sum().sum()),
        "exact_duplicate_rows": int(df.duplicated().sum()),
        "attendance_rate": round(float(df["attendance"].mean()), 4),
    }


def leakage_check(df: pd.DataFrame) -> dict:
    """Show why absence_reason must be dropped: it is recorded *after* the outcome."""
    ct = pd.crosstab(df["absence_reason"], df["attendance"])
    rule_pred = (df["absence_reason"] == "none").astype(int)
    return {
        "rows_with_reason_and_attended": int(ct.drop(index="none", errors="ignore").get(1, pd.Series(dtype=int)).sum()),
        "accuracy_of_rule_reason_is_none": round(float(accuracy_score(df["attendance"], rule_pred)), 4),
    }


def clean(df: pd.DataFrame) -> tuple[pd.DataFrame, list[dict]]:
    log = []

    def step(name, before, after, detail=""):
        log.append({"step": name, "rows_before": before, "rows_after": after, "detail": detail})

    n = len(df)
    # student_id is corrupted in the export (e.g. thousands of rows share 200.99) and is an identifier anyway.
    dup_ids = int(df["student_id"].duplicated().sum())
    df = df.drop(columns=["student_id"])
    step("drop student_id", n, len(df), f"corrupted identifier ({dup_ids} repeated values); never a predictor")

    df = df.drop(columns=["absence_reason"])
    step("drop absence_reason", len(df), len(df), "target leakage: only filled in after the student was absent")

    for c in df.select_dtypes("object").columns:
        df[c] = df[c].astype(str).str.strip().str.lower()
    step("normalise text", len(df), len(df), "trim whitespace, lower-case all categorical values")

    n = len(df)
    df = df.drop_duplicates()
    step("remove duplicates", n, len(df), "exact duplicate rows after dropping the identifier")

    n = len(df)
    mask = pd.Series(True, index=df.index)
    for col, (lo, hi) in VALID_RANGES.items():
        mask &= df[col].between(lo, hi)
    mask &= df["year"].isin(YEAR_MAP)
    df = df[mask]
    step("range validation", n, len(df), f"drop rows outside plausible ranges {VALID_RANGES}")

    n = len(df)
    df = df.dropna()
    step("missing values", n, len(df), "rows with any missing value (none expected in this file)")

    df = df.reset_index(drop=True)
    df["year_of_study"] = df["year"].map(YEAR_MAP)
    df["hostel_resident"] = (df["hostel_resident"] == "yes").astype(int)
    df["internet_access"] = (df["internet_access"] == "yes").astype(int)
    df["is_online"] = (df["class_type"] == "online").astype(int)
    return df, log


def learn_effects(df: pd.DataFrame) -> dict:
    """Fit a standardised logistic regression on behaviours that transfer to campus events."""
    X = pd.DataFrame({
        "travel_time_minutes": df["travel_time_minutes"],
        "hostel_resident": df["hostel_resident"],
        "year_of_study": df["year_of_study"],
        "study_hours": df["study_hours"],
        "sleep_hours": df["sleep_hours"],
        "is_online": df["is_online"],
    })
    for w in ["rainy", "hot", "cold", "cloudy"]:  # sunny is the reference level
        X[f"weather_{w}"] = (df["weather"] == w).astype(int)
    y = df["attendance"]

    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=SEED, stratify=y)
    scaler = StandardScaler().fit(X_tr)
    lr = LogisticRegression(max_iter=2000).fit(scaler.transform(X_tr), y_tr)
    p = lr.predict_proba(scaler.transform(X_te))[:, 1]

    # Convert standardised coefficients back to "log-odds per raw unit".
    per_unit = dict(zip(X.columns, (lr.coef_[0] / scaler.scale_).round(5)))
    return {
        "holdout_accuracy": round(float(accuracy_score(y_te, (p >= 0.5).astype(int))), 4),
        "holdout_f1": round(float(f1_score(y_te, (p >= 0.5).astype(int))), 4),
        "holdout_roc_auc": round(float(roc_auc_score(y_te, p)), 4),
        "log_odds_per_unit": {k: float(v) for k, v in per_unit.items()},
        "attendance_rate_by_weather": df.groupby("weather")["attendance"].mean().round(4).to_dict(),
    }


def build_student_pool(df: pd.DataFrame, effects: dict) -> pd.DataFrame:
    """Real Kaggle student profiles + an 'engagement' score derived from study/sleep habits."""
    coef = effects["log_odds_per_unit"]
    engagement = coef["study_hours"] * (df["study_hours"] - df["study_hours"].mean()) + \
                 coef["sleep_hours"] * (df["sleep_hours"] - df["sleep_hours"].mean())
    pool = df[["year_of_study", "hostel_resident", "travel_time_minutes", "gender", "parent_education"]].copy()
    pool["engagement"] = engagement.round(4)
    return pool


def run(verbose: bool = True) -> dict:
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    raw = pd.read_csv(RAW_KAGGLE_CSV)
    summary = {"source": RAW_KAGGLE_CSV.name, "raw_audit": audit(raw), "leakage": leakage_check(raw)}

    cleaned, log = clean(raw.copy())
    summary["cleaning_log"] = log
    summary["clean_rows"] = int(len(cleaned))

    effects = learn_effects(cleaned)
    summary["effects"] = effects

    pool = build_student_pool(cleaned, effects)
    pool.to_csv(PROCESSED_DIR / "student_pool.csv", index=False)
    (PROCESSED_DIR / "kaggle_summary.json").write_text(json.dumps(summary, indent=2))

    if verbose:
        print(f"[stage 1] Kaggle rows: {summary['raw_audit']['rows']} -> {summary['clean_rows']} after cleaning")
        print(f"[stage 1] Leakage: 'absence_reason == none' alone scores "
              f"{summary['leakage']['accuracy_of_rule_reason_is_none']:.1%} accuracy -> column dropped")
        print(f"[stage 1] Behavioural model (no leakage): accuracy {effects['holdout_accuracy']:.3f}, "
              f"ROC-AUC {effects['holdout_roc_auc']:.3f}")
    return summary


if __name__ == "__main__":
    run()
