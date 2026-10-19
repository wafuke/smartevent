"""
Stage 3 - Clean the raw registration export.

Only *deterministic* row-level fixes happen here (they do not learn anything from the data,
so they cannot leak test information):
  - remove double submissions, standardise spellings, convert impossible values to missing,
  - drop rows whose outcome was never recorded.
Imputation and normalisation are statistics learned from data, so they live inside the
sklearn Pipeline and are fitted on the training split only (see train.py).
"""
import json
import re

import numpy as np
import pandas as pd

from .config import CATEGORIES, PROCESSED_DIR, TARGET

CATEGORY_ALIASES = {
    "academic": "Academic", "workshop": "Workshop", "work shop": "Workshop", "seminar": "Seminar",
    "sports": "Sports", "sport": "Sports", "career fair": "Career Fair", "careers fair": "Career Fair",
    "social & cultural": "Social & Cultural", "social and cultural": "Social & Cultural", "cultural": "Social & Cultural",
}
SLOT_ALIASES = {"morning": "Morning", "am": "Morning", "afternoon": "Afternoon", "pm": "Afternoon",
                "evening": "Evening", "eve": "Evening"}
SMS_ALIASES = {"none": "none", "0": "none", "": "none", "nan": "none", "low": "low", "1": "low",
               "medium": "medium", "med": "medium", "2": "medium", "high": "high", "3": "high"}
RANGES = {"travel_time_minutes": (0, 240), "venue_capacity": (1, 5000), "lead_days": (0, 365),
          "year_of_study": (1, 6), "day_of_week": (0, 6)}


def _norm(s: pd.Series) -> pd.Series:
    return s.astype(str).str.strip().str.lower().map(lambda x: re.sub(r"\s+", " ", x))


def clean(df: pd.DataFrame) -> tuple[pd.DataFrame, list[dict]]:
    log = []

    def record(step, before, after, detail):
        log.append({"step": step, "rows_before": int(before), "rows_after": int(after), "detail": detail})

    n = len(df)
    df = df.drop_duplicates(subset=["registration_id"], keep="first").copy()
    record("remove double submissions", n, len(df), "duplicate registration_id (same student, same event)")

    fixes = {}
    before = df["event_category"].copy()
    df["event_category"] = _norm(df["event_category"]).map(CATEGORY_ALIASES)
    fixes["event_category"] = int((before != df["event_category"]).sum())
    before = df["time_slot"].copy()
    df["time_slot"] = _norm(df["time_slot"]).map(SLOT_ALIASES)
    fixes["time_slot"] = int((before != df["time_slot"]).sum())
    before = df["sms_priority"].copy()
    df["sms_priority"] = _norm(df["sms_priority"].fillna("")).map(SMS_ALIASES)
    fixes["sms_priority"] = int((before != df["sms_priority"]).sum())
    df["weather"] = _norm(df["weather"]).replace({"nan": np.nan})
    record("standardise spellings", len(df), len(df), f"values rewritten to canonical form: {fixes}")

    n = len(df)
    unknown = df["event_category"].isna() | df["time_slot"].isna() | ~df["event_category"].isin(CATEGORIES)
    df = df[~unknown]
    record("drop unmappable categories", n, len(df), "category/time slot not recognisable after standardising")

    invalid = {}
    for col, (lo, hi) in RANGES.items():
        bad = df[col].notna() & ~df[col].between(lo, hi)
        invalid[col] = int(bad.sum())
        df.loc[bad, col] = np.nan
    record("impossible values -> missing", len(df), len(df), f"out-of-range values set to NaN for imputation: {invalid}")

    # venue_capacity is an event attribute: recover it from other rows of the same event when possible.
    missing_cap = int(df["venue_capacity"].isna().sum())
    df["venue_capacity"] = df.groupby("event_id")["venue_capacity"].transform(lambda s: s.fillna(s.median()))
    record("recover venue capacity", len(df), len(df),
           f"{missing_cap} missing capacities filled from the same event's other registrations")

    n = len(df)
    df = df[df[TARGET].notna()]
    df[TARGET] = df[TARGET].astype(int)
    record("drop unrecorded outcomes", n, len(df), "a row without the label cannot be used for supervised training")

    df["event_date"] = pd.to_datetime(df["event_date"])
    df = df.sort_values(["event_date", "event_id", "registration_id"]).reset_index(drop=True)
    return df, log


def missing_summary(df: pd.DataFrame) -> dict:
    m = df.isna().sum()
    return {k: int(v) for k, v in m[m > 0].items()}


def run(verbose: bool = True) -> pd.DataFrame:
    raw_path = PROCESSED_DIR.parent / "synthetic" / "raw_registrations.csv"
    raw = pd.read_csv(raw_path, keep_default_na=True)
    cleaned, log = clean(raw)
    remaining = missing_summary(cleaned)
    cleaned.to_csv(PROCESSED_DIR / "clean_registrations.csv", index=False)
    (PROCESSED_DIR / "cleaning_report.json").write_text(json.dumps({
        "raw_rows": int(len(raw)), "clean_rows": int(len(cleaned)), "log": log,
        "missing_left_for_pipeline_imputation": remaining,
        "note": "past_attendance_rate is missing by design for a student's first event (no history yet).",
    }, indent=2))
    if verbose:
        print(f"[stage 3] Cleaning: {len(raw):,} raw rows -> {len(cleaned):,} clean rows")
        for s in log:
            print(f"          - {s['step']}: {s['rows_before']:,} -> {s['rows_after']:,}  ({s['detail']})")
        print(f"[stage 3] Missing values left for in-pipeline imputation: {remaining}")
    return cleaned


if __name__ == "__main__":
    run()
