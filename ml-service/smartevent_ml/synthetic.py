"""
Stage 2 - Synthetic Strathmore University event-registration data.

One row = one student's registration for one past event, with the outcome `attended` (0/1).
This is the unit the proposal's Logistic Regression predicts; the event headcount forecast
is the sum of the per-registrant probabilities.

How the Kaggle data is used (the "combined dataset" in Section 3.2):
  * Student profiles (year, hostel, travel time, gender, parent education, engagement)
    are sampled from the cleaned Kaggle rows.
  * Effects for weather, travel time, year of study and engagement are the log-odds
    learned from Kaggle in Stage 1.
Event-specific effects that the Kaggle file cannot provide (category, time slot, SMS
reminders, exams, over-booking, registration lead time) are explicit assumptions listed in
ASSUMPTIONS below, so they can be challenged and changed.

The generator also injects realistic data-quality problems (double submissions, missing
values, inconsistent spellings, impossible values, unrecorded outcomes) so that the
cleaning stage has real work to do. Everything is seeded, so runs are reproducible.
"""
import json

import numpy as np
import pandas as pd

from .config import CATEGORIES, PROCESSED_DIR, SEED, WEATHER

N_STUDENTS = 2500
N_EVENTS = 700
START, END = "2024-01-08", "2026-06-30"

VENUES = {  # Strathmore-style venues and seat counts
    "Auditorium A": 350, "Student Centre Hall": 200, "MSB Lecture Theatre": 150,
    "SCES Lab 3": 80, "Seminar Room 2": 60, "Amphitheatre": 250, "Sports Complex": 500,
}
CATEGORY_VENUES = {
    "Academic": ["Auditorium A", "MSB Lecture Theatre", "Student Centre Hall"],
    "Workshop": ["SCES Lab 3", "Seminar Room 2", "MSB Lecture Theatre"],
    "Seminar": ["Seminar Room 2", "MSB Lecture Theatre", "Auditorium A"],
    "Sports": ["Sports Complex", "Amphitheatre"],
    "Career Fair": ["Student Centre Hall", "Auditorium A"],
    "Social & Cultural": ["Amphitheatre", "Student Centre Hall", "Auditorium A"],
}
CATEGORY_SLOTS = {  # probability of Morning / Afternoon / Evening
    "Academic": [0.5, 0.4, 0.1], "Workshop": [0.3, 0.6, 0.1], "Seminar": [0.4, 0.5, 0.1],
    "Sports": [0.5, 0.4, 0.1], "Career Fair": [0.6, 0.4, 0.0], "Social & Cultural": [0.05, 0.25, 0.7],
}

# Assumed log-odds effects (not learnable from the Kaggle file). Documented on purpose.
ASSUMPTIONS = {
    "intercept": 0.55,
    "category": {"Academic": 0.0, "Workshop": 0.35, "Seminar": -0.15, "Sports": 0.25,
                 "Career Fair": 0.30, "Social & Cultural": 0.10},
    "time_slot": {"Morning": 0.0, "Afternoon": 0.10, "Evening": -0.35},
    "weekend": -0.40,
    "exam_period": -0.60,
    "sms_priority": {"none": 0.0, "low": 0.10, "medium": 0.25, "high": 0.45},
    "lead_days_per_day": -0.02,
    "overbooking_per_unit_excess": -1.20,
    "evening_travel_multiplier": 1.6,
    "evening_hostel_bonus": 0.30,
    "personal_propensity_sd": 0.6,
    "category_affinity_sd": 0.4,
}


def _rainy_prob(month: int) -> float:
    """Nairobi: long rains Mar-May, short rains Oct-Dec."""
    return 0.35 if month in (3, 4, 5, 10, 11, 12) else 0.10


def _sigmoid(x):
    return 1.0 / (1.0 + np.exp(-x))


def generate(seed: int = SEED, verbose: bool = True) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    kaggle = json.loads((PROCESSED_DIR / "kaggle_summary.json").read_text())["effects"]["log_odds_per_unit"]
    pool = pd.read_csv(PROCESSED_DIR / "student_pool.csv")

    # ---- students: real Kaggle profiles + an unobserved personal propensity -------------
    students = pool.sample(N_STUDENTS, random_state=seed).reset_index(drop=True)
    students["student_id"] = [f"STU{100000 + i}" for i in range(N_STUDENTS)]
    students["propensity"] = students["engagement"] + rng.normal(0, ASSUMPTIONS["personal_propensity_sd"], N_STUDENTS)
    affinity = rng.normal(0, ASSUMPTIONS["category_affinity_sd"], (N_STUDENTS, len(CATEGORIES)))
    hist_reg = np.zeros(N_STUDENTS)
    hist_att = np.zeros(N_STUDENTS)
    mean_travel = pool["travel_time_minutes"].mean()

    # ---- events --------------------------------------------------------------------------
    days = pd.date_range(START, END, freq="D")
    dates = np.sort(rng.choice(days, N_EVENTS))
    rows = []
    for e_idx, date in enumerate(pd.to_datetime(dates)):
        cat = rng.choice(CATEGORIES)
        c_idx = CATEGORIES.index(cat)
        slot = rng.choice(["Morning", "Afternoon", "Evening"], p=CATEGORY_SLOTS[cat])
        venue = rng.choice(CATEGORY_VENUES[cat])
        capacity = VENUES[venue]
        dow = int(date.dayofweek)
        exam = int(date.month in (4, 11) and date.day >= 15)
        p_rain = _rainy_prob(date.month)
        others = (1 - p_rain) / 4
        weather = rng.choice(WEATHER, p=[others if w != "rainy" else p_rain for w in WEATHER])
        sms = rng.choice(["none", "low", "medium", "high"], p=[0.25, 0.25, 0.30, 0.20])
        fill = float(np.clip(rng.beta(6, 2) * 1.2, 0.15, 1.20))
        n_reg = int(max(10, min(round(capacity * fill), N_STUDENTS)))

        w = np.exp(0.5 * students["propensity"].values + affinity[:, c_idx])
        idx = rng.choice(N_STUDENTS, size=n_reg, replace=False, p=w / w.sum())
        s = students.iloc[idx]
        lead = np.clip(np.round(rng.exponential(6, n_reg)), 0, 45).astype(int)

        past_rate = np.where(hist_reg[idx] > 0, hist_att[idx] / np.maximum(hist_reg[idx], 1), np.nan)
        evening = slot == "Evening"
        travel_coef = kaggle["travel_time_minutes"] * (ASSUMPTIONS["evening_travel_multiplier"] if evening else 1.0)

        logit = (
            ASSUMPTIONS["intercept"]
            + ASSUMPTIONS["category"][cat]
            + ASSUMPTIONS["time_slot"][slot]
            + (ASSUMPTIONS["weekend"] if dow >= 5 else 0.0)
            + (ASSUMPTIONS["exam_period"] if exam else 0.0)
            + (kaggle.get(f"weather_{weather}", 0.0))                       # learned from Kaggle
            + travel_coef * (s["travel_time_minutes"].values - mean_travel)  # learned from Kaggle
            + kaggle["year_of_study"] * (s["year_of_study"].values - 2.5)    # learned from Kaggle
            + kaggle["hostel_resident"] * s["hostel_resident"].values        # learned from Kaggle
            + (ASSUMPTIONS["evening_hostel_bonus"] * s["hostel_resident"].values if evening else 0.0)
            + ASSUMPTIONS["sms_priority"][sms]
            + ASSUMPTIONS["lead_days_per_day"] * lead
            + ASSUMPTIONS["overbooking_per_unit_excess"] * max(0.0, n_reg / capacity - 1.0)
            + s["propensity"].values                                          # engagement from Kaggle + personal
            + affinity[idx, c_idx]
        )
        attended = (rng.random(n_reg) < _sigmoid(logit)).astype(int)

        hist_reg[idx] += 1
        hist_att[idx] += attended

        for j in range(n_reg):
            rows.append({
                "registration_id": f"REG{e_idx:04d}{j:04d}",
                "event_id": f"EVT{e_idx:04d}",
                "event_date": date.date().isoformat(),
                "event_category": cat,
                "day_of_week": dow,
                "time_slot": slot,
                "venue": venue,
                "venue_capacity": capacity,
                "registered_count": n_reg,
                "weather": weather,
                "exam_period": exam,
                "sms_priority": sms,
                "student_id": s["student_id"].iat[j],
                "year_of_study": int(s["year_of_study"].iat[j]),
                "hostel_resident": int(s["hostel_resident"].iat[j]),
                "travel_time_minutes": float(s["travel_time_minutes"].iat[j]),
                "gender": s["gender"].iat[j],
                "parent_education": s["parent_education"].iat[j],
                "lead_days": int(lead[j]),
                "past_attendance_rate": None if np.isnan(past_rate[j]) else round(float(past_rate[j]), 4),
                "past_events_count": int(hist_reg[idx[j]] - 1),
                "attended": int(attended[j]),
            })

    df = pd.DataFrame(rows)
    clean_copy_stats = {"rows": len(df), "events": df.event_id.nunique(), "attendance_rate": round(df.attended.mean(), 4)}
    dirty, dirt_log = inject_quality_issues(df, rng)

    out_dir = PROCESSED_DIR.parent / "synthetic"
    out_dir.mkdir(parents=True, exist_ok=True)
    dirty.to_csv(out_dir / "raw_registrations.csv", index=False)
    (out_dir / "generation_report.json").write_text(json.dumps({
        "seed": seed, "n_students": N_STUDENTS, "n_events": N_EVENTS, "date_range": [START, END],
        "true_data": clean_copy_stats, "injected_issues": dirt_log,
        "assumptions": ASSUMPTIONS, "kaggle_effects_used": kaggle,
    }, indent=2, default=str))

    if verbose:
        print(f"[stage 2] Generated {clean_copy_stats['rows']:,} registrations for {clean_copy_stats['events']} events "
              f"(true turnout {clean_copy_stats['attendance_rate']:.1%})")
        print(f"[stage 2] Injected issues: " + ", ".join(f"{k}={v}" for k, v in dirt_log.items()))
    return dirty


def inject_quality_issues(df: pd.DataFrame, rng) -> tuple[pd.DataFrame, dict]:
    """Simulate problems typical of a registration-system export."""
    df = df.copy()
    n = len(df)
    log = {}

    def pick(frac):
        return rng.choice(df.index, size=int(n * frac), replace=False)

    i = pick(0.04); df.loc[i, "weather"] = np.nan; log["missing_weather"] = len(i)
    i = pick(0.03); df.loc[i, "travel_time_minutes"] = np.nan; log["missing_travel_time"] = len(i)

    i = pick(0.10)
    variants = {"Academic": ["academic", "ACADEMIC ", " Academic"], "Workshop": ["workshop", "Work shop", "WORKSHOP"],
                "Seminar": ["seminar ", "SEMINAR"], "Sports": ["sports", "Sport"],
                "Career Fair": ["Careers Fair", "career fair", "Career fair"],
                "Social & Cultural": ["Social and Cultural", "social & cultural", "Cultural"]}
    df.loc[i, "event_category"] = [rng.choice(variants[c]) for c in df.loc[i, "event_category"]]
    log["inconsistent_category_spelling"] = len(i)

    i = pick(0.08)
    slot_v = {"Morning": ["morning", "AM", "Morning "], "Afternoon": ["afternoon", "PM"], "Evening": ["evening", "Eve"]}
    df.loc[i, "time_slot"] = [rng.choice(slot_v[s]) for s in df.loc[i, "time_slot"]]
    log["inconsistent_time_slot"] = len(i)

    i = pick(0.08)
    sms_v = {"none": ["None", "0", ""], "low": ["LOW", "1", "Low"], "medium": ["MEDIUM", "2", "Med"], "high": ["HIGH", "3", "High"]}
    df.loc[i, "sms_priority"] = [rng.choice(sms_v[s]) for s in df.loc[i, "sms_priority"]]
    log["inconsistent_sms_priority"] = len(i)

    i = pick(0.005); df.loc[i, "travel_time_minutes"] = rng.choice([-5.0, 999.0], len(i)); log["impossible_travel_time"] = len(i)
    i = pick(0.003); df.loc[i, "venue_capacity"] = 0; log["zero_venue_capacity"] = len(i)
    i = pick(0.005); df.loc[i, "attended"] = np.nan; log["outcome_not_recorded"] = len(i)

    dups = df.loc[pick(0.02)]
    log["double_submissions"] = len(dups)
    df = pd.concat([df, dups]).sample(frac=1, random_state=SEED).reset_index(drop=True)
    return df, log


run = generate

if __name__ == "__main__":
    generate()
