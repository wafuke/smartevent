"""
Stages 4-8 - Split, select features, train, refine, evaluate and save the model.

Design decisions (all explained in reports/training_report.md):
  * Unit of prediction: P(registered student attends). Event headcount = sum of probabilities.
  * Split by TIME and by EVENT: the most recent 20% of events are the untouched test set,
    so the model is always judged on future events it has never seen (no event leaks across).
  * Cross-validation inside the training period uses GroupKFold on event_id.
  * Primary model: Logistic Regression (proposal Section 3.2). Decision Tree, Random Forest and
    Gradient Boosting are trained as comparison models (proposal Section 3.8, Scikit-learn).
"""
import json
import time
from datetime import datetime, timezone

import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import sklearn
from sklearn.base import clone
from sklearn.calibration import calibration_curve
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.feature_selection import mutual_info_classif
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (accuracy_score, brier_score_loss, confusion_matrix, f1_score, log_loss,
                             precision_score, recall_score, roc_auc_score, roc_curve)
from sklearn.model_selection import GridSearchCV, GroupKFold, cross_val_predict
from sklearn.tree import DecisionTreeClassifier

from .config import FIGURES_DIR, METADATA_PATH, MODEL_PATH, MODELS_DIR, PROCESSED_DIR, REPORTS_DIR, SEED, TARGET
from .features import (ENGINEERED_NUMERIC, INPUT_COLUMNS, NOISE, RAW_CATEGORICAL, RAW_NUMERIC,
                       add_engineered_features, engineered_names, make_pipeline, make_preprocessor)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import FunctionTransformer

TEST_FRACTION = 0.20
CV = GroupKFold(n_splits=5)


# --------------------------------------------------------------------------------------- helpers
def metrics(y, p, threshold=0.5) -> dict:
    yhat = (p >= threshold).astype(int)
    return {
        "accuracy": accuracy_score(y, yhat), "precision": precision_score(y, yhat, zero_division=0),
        "recall": recall_score(y, yhat), "f1": f1_score(y, yhat),
        "roc_auc": roc_auc_score(y, p) if len(np.unique(p)) > 1 else 0.5,
        "log_loss": log_loss(y, np.clip(p, 1e-6, 1 - 1e-6)), "brier": brier_score_loss(y, p),
    }


def rnd(d, k=4):
    return {a: (round(float(b), k) if isinstance(b, (float, np.floating)) else b) for a, b in d.items()}


def event_level(df: pd.DataFrame, p: np.ndarray) -> tuple[dict, pd.DataFrame]:
    ev = df.assign(p=p).groupby("event_id").agg(
        registered=("attended", "size"), actual=("attended", "sum"), predicted=("p", "sum"),
        capacity=("venue_capacity", "first"), category=("event_category", "first"))
    err = ev["predicted"] - ev["actual"]
    out = {
        "events": int(len(ev)),
        "mae_attendees": float(err.abs().mean()),
        "mape_pct": float((err.abs() / ev["actual"].clip(lower=1)).mean() * 100),
        "within_10pct_share": float(((err.abs() / ev["actual"].clip(lower=1)) <= 0.10).mean()),
        "bias_attendees": float(err.mean()),
    }
    return out, ev


def lr_pipeline(engineered=True, include_noise=True, drop=(), C=1.0, penalty="l2", class_weight=None):
    numeric = [c for c in RAW_NUMERIC + (ENGINEERED_NUMERIC if engineered else []) if c not in drop]
    categorical = [c for c in RAW_CATEGORICAL + (NOISE if include_noise else []) if c not in drop]
    steps = []
    if engineered:
        steps.append(("engineer", FunctionTransformer(add_engineered_features, feature_names_out=engineered_names)))
    steps += [("prep", make_preprocessor(numeric, categorical)),
              ("model", LogisticRegression(C=C, penalty=penalty, class_weight=class_weight,
                                           solver="liblinear", max_iter=2000))]
    return Pipeline(steps)


def cv_score(pipe, X, y, groups) -> tuple[dict, np.ndarray]:
    oof = cross_val_predict(pipe, X, y, groups=groups, cv=CV, method="predict_proba", n_jobs=-1)[:, 1]
    return rnd(metrics(y, oof)), oof


# --------------------------------------------------------------------------------------- stages
def chronological_split(df):
    events = df.groupby("event_id")["event_date"].first().sort_values()
    cut = int(len(events) * (1 - TEST_FRACTION))
    train_ev, test_ev = set(events.index[:cut]), set(events.index[cut:])
    tr, te = df[df.event_id.isin(train_ev)].reset_index(drop=True), df[df.event_id.isin(test_ev)].reset_index(drop=True)
    info = {
        "train_rows": len(tr), "test_rows": len(te), "train_events": len(train_ev), "test_events": len(test_ev),
        "train_period": [str(tr.event_date.min().date()), str(tr.event_date.max().date())],
        "test_period": [str(te.event_date.min().date()), str(te.event_date.max().date())],
        "train_turnout": round(float(tr[TARGET].mean()), 4), "test_turnout": round(float(te[TARGET].mean()), 4),
    }
    return tr, te, info


def feature_selection(X, y, groups) -> dict:
    """Two complementary views: mutual information (filter) and L1-regularised LR (embedded)."""
    full = lr_pipeline(engineered=True, include_noise=True)
    prep = Pipeline(full.steps[:-1]).fit(X, y)
    Xt = prep.transform(X)
    names = prep.get_feature_names_out()
    sample = np.random.default_rng(SEED).choice(len(y), size=min(30000, len(y)), replace=False)
    mi = mutual_info_classif(Xt[sample] if not hasattr(Xt, "toarray") else Xt[sample].toarray(),
                             y.iloc[sample], random_state=SEED)

    l1 = LogisticRegression(penalty="l1", C=0.002, solver="liblinear", max_iter=2000).fit(Xt, y)
    coef = l1.coef_[0]

    table = pd.DataFrame({"feature": names, "mutual_info": mi, "l1_coef": coef})
    table["source_column"] = table["feature"].str.replace(r"^(num|cat)__", "", regex=True).str.split("_").str[0]

    # Decide per ORIGINAL input column: drop it if every one of its encoded columns is zeroed by L1
    # and its mutual information is negligible.
    def src(f):
        f = f.split("__", 1)[1]
        for col in INPUT_COLUMNS + ENGINEERED_NUMERIC:
            if f == col or f.startswith(col + "_"):
                return col
        return f
    table["source_column"] = table["feature"].map(src)
    per_col = table.groupby("source_column").agg(max_abs_l1=("l1_coef", lambda s: s.abs().max()),
                                                 total_mi=("mutual_info", "sum"))
    drop = per_col[(per_col.max_abs_l1 == 0) & (per_col.total_mi < 0.002)].index.tolist()
    return {"table": table.sort_values("mutual_info", ascending=False), "per_column": per_col.sort_values("total_mi", ascending=False),
            "drop": drop}


def compare_models(X, y, groups) -> dict:
    candidates = {
        "Majority-class baseline": make_pipeline(DummyClassifier(strategy="prior")),
        "Logistic Regression": lr_pipeline(),
        "Decision Tree": make_pipeline(DecisionTreeClassifier(max_depth=8, min_samples_leaf=50, random_state=SEED), scale=False),
        "Random Forest": make_pipeline(RandomForestClassifier(n_estimators=150, max_depth=14, min_samples_leaf=20,
                                                              n_jobs=-1, random_state=SEED), scale=False),
        "Gradient Boosting": make_pipeline(HistGradientBoostingClassifier(max_iter=300, learning_rate=0.05,
                                                                          random_state=SEED), scale=False),
    }
    results = {}
    for name, pipe in candidates.items():
        t = time.time()
        m, _ = cv_score(pipe, X, y, groups)
        m["fit_seconds"] = round(time.time() - t, 1)
        results[name] = m
        print(f"          {name:<24} acc {m['accuracy']:.3f}  F1 {m['f1']:.3f}  AUC {m['roc_auc']:.3f}  logloss {m['log_loss']:.4f}")
    return {"pipelines": candidates, "results": results}


def refine_logistic(X, y, groups, drop) -> dict:
    iterations = []

    def log_iter(name, desc, pipe):
        m, oof = cv_score(pipe, X, y, groups)
        iterations.append({"iteration": name, "change": desc, **m})
        print(f"          {name:<34} F1 {m['f1']:.3f}  AUC {m['roc_auc']:.3f}  logloss {m['log_loss']:.4f}")
        return oof

    log_iter("1. Raw features", "LR on the cleaned raw columns only", lr_pipeline(engineered=False))
    log_iter("2. + Engineered features", "fill ratio, over-booking, weekend, log lead time, history flag, evening interactions",
             lr_pipeline(engineered=True))
    log_iter("3. + Feature selection", f"drop columns rejected by L1 + mutual information: {drop}",
             lr_pipeline(engineered=True, drop=drop))

    grid = GridSearchCV(
        lr_pipeline(engineered=True, drop=drop),
        {"model__C": [0.01, 0.1, 1.0, 10.0], "model__penalty": ["l1", "l2"], "model__class_weight": [None, "balanced"]},
        scoring="neg_log_loss", cv=GroupKFold(n_splits=3), n_jobs=-1)
    grid.fit(X, y, groups=groups)
    best = grid.best_params_
    tuned = lr_pipeline(engineered=True, drop=drop, C=best["model__C"], penalty=best["model__penalty"],
                        class_weight=best["model__class_weight"])
    oof = log_iter("4. + Hyper-parameter tuning", f"GridSearchCV (16 combinations, log-loss): best {best}", tuned)

    thresholds = np.round(np.arange(0.30, 0.71, 0.01), 2)
    f1s = [f1_score(y, (oof >= t).astype(int)) for t in thresholds]
    best_t = float(thresholds[int(np.argmax(f1s))])
    m = rnd(metrics(y, oof, best_t))
    iterations.append({"iteration": "5. + Decision threshold", "change": f"threshold tuned for F1 on out-of-fold predictions: {best_t}", **m})
    print(f"          {'5. + Decision threshold':<34} F1 {m['f1']:.3f}  (threshold {best_t})")

    grid_table = pd.DataFrame(grid.cv_results_)[["params", "mean_test_score", "rank_test_score"]].sort_values("rank_test_score")
    return {"iterations": iterations, "best_params": best, "threshold": best_t, "pipeline": tuned,
            "grid": grid_table, "threshold_curve": list(zip(thresholds.tolist(), [round(f, 4) for f in f1s]))}


def coefficients(pipe) -> pd.DataFrame:
    names = Pipeline(pipe.steps[:-1]).get_feature_names_out()
    coef = pipe.named_steps["model"].coef_[0]
    t = pd.DataFrame({"feature": [n.split("__", 1)[1] for n in names], "coefficient": coef})
    t["odds_ratio"] = np.exp(t["coefficient"])
    return t.reindex(t.coefficient.abs().sort_values(ascending=False).index).reset_index(drop=True)


# --------------------------------------------------------------------------------------- figures
def save_figures(y_te, p_te, threshold, ev, coef_table, comparison_test):
    FIGURES_DIR.mkdir(parents=True, exist_ok=True)

    cm = confusion_matrix(y_te, (p_te >= threshold).astype(int))
    fig, ax = plt.subplots(figsize=(4.2, 3.8))
    ax.imshow(cm, cmap="Blues")
    for (i, j), v in np.ndenumerate(cm):
        ax.text(j, i, f"{v:,}", ha="center", va="center", color="white" if v > cm.max() / 2 else "black")
    ax.set_xticks([0, 1], ["No-show", "Attended"]); ax.set_yticks([0, 1], ["No-show", "Attended"])
    ax.set_xlabel("Predicted"); ax.set_ylabel("Actual"); ax.set_title("Confusion matrix (test events)")
    fig.tight_layout(); fig.savefig(FIGURES_DIR / "confusion_matrix.png", dpi=130); plt.close(fig)

    fig, ax = plt.subplots(figsize=(4.6, 4))
    for name, p in comparison_test.items():
        fpr, tpr, _ = roc_curve(y_te, p)
        ax.plot(fpr, tpr, label=f"{name} (AUC {roc_auc_score(y_te, p):.3f})")
    ax.plot([0, 1], [0, 1], "k--", lw=0.8); ax.set_xlabel("False positive rate"); ax.set_ylabel("True positive rate")
    ax.set_title("ROC curves (test events)"); ax.legend(fontsize=7)
    fig.tight_layout(); fig.savefig(FIGURES_DIR / "roc_curves.png", dpi=130); plt.close(fig)

    frac, mean_p = calibration_curve(y_te, p_te, n_bins=10)
    fig, ax = plt.subplots(figsize=(4.2, 4))
    ax.plot(mean_p, frac, "o-", label="Logistic Regression"); ax.plot([0, 1], [0, 1], "k--", lw=0.8, label="Perfect")
    ax.set_xlabel("Predicted probability"); ax.set_ylabel("Observed attendance rate"); ax.set_title("Calibration (test)")
    ax.legend(fontsize=8); fig.tight_layout(); fig.savefig(FIGURES_DIR / "calibration.png", dpi=130); plt.close(fig)

    fig, ax = plt.subplots(figsize=(4.6, 4.2))
    ax.scatter(ev["actual"], ev["predicted"], s=14, alpha=0.7)
    lim = [0, max(ev["actual"].max(), ev["predicted"].max()) * 1.05]
    ax.plot(lim, lim, "k--", lw=0.8); ax.set_xlim(lim); ax.set_ylim(lim)
    ax.set_xlabel("Actual attendees"); ax.set_ylabel("Predicted attendees"); ax.set_title("Event headcount (test events)")
    fig.tight_layout(); fig.savefig(FIGURES_DIR / "event_headcount.png", dpi=130); plt.close(fig)

    top = coef_table.head(15).iloc[::-1]
    fig, ax = plt.subplots(figsize=(6, 4.8))
    ax.barh(top["feature"], top["coefficient"], color=["#c0392b" if c < 0 else "#1f6fb2" for c in top["coefficient"]])
    ax.axvline(0, color="k", lw=0.6); ax.set_xlabel("Coefficient (log-odds per standardised unit)")
    ax.set_title("Top 15 Logistic Regression coefficients"); fig.tight_layout()
    fig.savefig(FIGURES_DIR / "coefficients.png", dpi=130); plt.close(fig)


# --------------------------------------------------------------------------------------- main
def run(verbose: bool = True) -> dict:
    t0 = time.time()
    df = pd.read_csv(PROCESSED_DIR / "clean_registrations.csv", parse_dates=["event_date"])
    tr, te, split = chronological_split(df)
    X_tr, y_tr, g_tr = tr[INPUT_COLUMNS], tr[TARGET], tr["event_id"]
    X_te, y_te = te[INPUT_COLUMNS], te[TARGET]
    print(f"[stage 4] Split by time/event: train {split['train_events']} events ({split['train_rows']:,} rows, "
          f"{split['train_period'][0]}..{split['train_period'][1]}) | test {split['test_events']} events "
          f"({split['test_rows']:,} rows, {split['test_period'][0]}..{split['test_period'][1]})")

    print("[stage 5] Feature selection (mutual information + L1 logistic regression)")
    fs = feature_selection(X_tr, y_tr, g_tr)
    print(f"          dropped input columns: {fs['drop']}")

    print("[stage 6] Model comparison (5-fold GroupKFold CV on training events)")
    comp = compare_models(X_tr, y_tr, g_tr)

    print("[stage 7] Refining the Logistic Regression")
    ref = refine_logistic(X_tr, y_tr, g_tr, fs["drop"])
    final = ref["pipeline"].fit(X_tr, y_tr)
    threshold = ref["threshold"]

    print("[stage 8] Final evaluation on the untouched test events")
    p_te = final.predict_proba(X_te)[:, 1]
    test_default = rnd(metrics(y_te, p_te, 0.5))
    test_tuned = rnd(metrics(y_te, p_te, threshold))
    ev_metrics, ev = event_level(te, p_te)

    # Baselines for the headcount forecast.
    base_rate = float(y_tr.mean())
    base_ev, _ = event_level(te, np.full(len(te), base_rate))
    hist = te["past_attendance_rate"].fillna(base_rate).values
    hist_ev, _ = event_level(te, hist)

    comparison_test = {"Logistic Regression": p_te}
    test_compare = {"Logistic Regression": test_default}
    for name in ["Decision Tree", "Random Forest", "Gradient Boosting"]:
        m = clone(comp["pipelines"][name]).fit(X_tr, y_tr)
        p = m.predict_proba(X_te)[:, 1]
        comparison_test[name] = p
        test_compare[name] = rnd(metrics(y_te, p, 0.5))
        test_compare[name]["event_mae"] = round(event_level(te, p)[0]["mae_attendees"], 2)
    test_compare["Logistic Regression"]["event_mae"] = round(ev_metrics["mae_attendees"], 2)

    coef_table = coefficients(final)
    save_figures(y_te, p_te, threshold, ev, coef_table, comparison_test)

    print(f"          student level @0.5 : acc {test_default['accuracy']:.3f}  P {test_default['precision']:.3f}  "
          f"R {test_default['recall']:.3f}  F1 {test_default['f1']:.3f}  AUC {test_default['roc_auc']:.3f}")
    print(f"          student level @{threshold}: acc {test_tuned['accuracy']:.3f}  F1 {test_tuned['f1']:.3f}")
    print(f"          event headcount: MAE {ev_metrics['mae_attendees']:.1f} attendees, MAPE {ev_metrics['mape_pct']:.1f}%, "
          f"{ev_metrics['within_10pct_share']:.0%} of events within ±10%")
    print(f"          baselines MAE: flat rate {base_ev['mae_attendees']:.1f}, student history {hist_ev['mae_attendees']:.1f}")

    # Refit on ALL labelled data (train + test) for deployment, now that evaluation is complete.
    deploy = clone(ref["pipeline"]).fit(df[INPUT_COLUMNS], df[TARGET])
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(deploy, MODEL_PATH)

    defaults = {
        "year_of_study": int(df.year_of_study.median()), "hostel_resident": int(df.hostel_resident.median()),
        "travel_time_minutes": float(df.travel_time_minutes.median()), "lead_days": int(df.lead_days.median()),
        "past_attendance_rate": None, "past_events_count": 0, "gender": "other", "parent_education": "graduate",
        "weather": "sunny", "exam_period": 0, "sms_priority": "none",
    }
    metadata = {
        "model_name": "SmartEvent attendance model", "algorithm": "LogisticRegression",
        "version": datetime.now(timezone.utc).strftime("%Y%m%d%H%M"),
        "trained_at": datetime.now(timezone.utc).isoformat(), "sklearn_version": sklearn.__version__,
        "input_columns": INPUT_COLUMNS, "dropped_by_selection": fs["drop"],
        "decision_threshold": threshold, "best_params": {k.replace("model__", ""): v for k, v in ref["best_params"].items()},
        "training_turnout_rate": round(base_rate, 4), "default_registrant_profile": defaults,
        "split": split,
        "test_metrics": {"threshold_0_5": test_default, "tuned_threshold": test_tuned, "event_level": rnd(ev_metrics, 3),
                         "baseline_flat_rate_event_mae": round(base_ev["mae_attendees"], 2),
                         "baseline_history_event_mae": round(hist_ev["mae_attendees"], 2)},
    }
    METADATA_PATH.write_text(json.dumps(metadata, indent=2, default=str))

    results = {"split": split, "feature_selection": fs, "comparison_cv": comp["results"], "refinement": ref,
               "test_default": test_default, "test_tuned": test_tuned, "threshold": threshold,
               "event_metrics": ev_metrics, "baseline_flat": base_ev, "baseline_history": hist_ev,
               "test_compare": test_compare, "coefficients": coef_table, "events_table": ev,
               "seconds": round(time.time() - t0, 1)}
    print(f"[stage 8] Saved model -> {MODEL_PATH.relative_to(MODELS_DIR.parent)} ({results['seconds']}s total)")
    return results


if __name__ == "__main__":
    run()
