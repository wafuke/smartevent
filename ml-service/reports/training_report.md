# SmartEvent Machine Learning Training & Evaluation Report

**Author:** Elvis Wanyama Wafuke (Admission No: 154210)  
**Supervisor:** Mr. Allan Vikiru  
**Institution:** Strathmore University — School of Computing and Engineering Sciences  

---

## 1. Problem Formulation & Alignment with Proposal

In accordance with **Section 3.2 (System Development Methodology)** and **Section 3.8 (Tools and Technologies)** of the SmartEvent proposal:
- **Primary Model**: **Logistic Regression** (`LogisticRegression` in `scikit-learn 1.9.1`), chosen because its output $\hat{p}_i = \sigma(\mathbf{w}^\top \mathbf{x}_i + b) \in (0, 1)$ is a calibrated probability that registered student $i$ attends event $e$, and its coefficients $\mathbf{w}$ directly represent log-odds impacts of campus event factors.
- **Event Headcount Prediction**: For an event $e$ with $N_e$ registered students, the predicted attendance count is the sum of individual attendance probabilities:
  $$\widehat{\text{Attendance}}_e = \sum_{i=1}^{N_e} \hat{p}_{i,e}$$
- **Benchmarking Models**: Decision Tree, Random Forest, Gradient Boosting (`HistGradientBoostingClassifier`), and a Majority-Class Baseline evaluated via **5-fold `GroupKFold` cross-validation** grouped by `event_id`.

---

## 2. Stage 1 — Kaggle Dataset Audit & Target Leakage Removal (`smartevent_ml/kaggle_prep.py`)

We audited the 20,000-row student attendance dataset (`data/Attendance_Prediction.csv`, 15 columns):
1. **Target Leakage Detected (`absence_reason`)**: In the raw CSV, `absence_reason` is `"none"` whenever `attendance == 1` (0 exceptions across all 20,000 rows). A trivial rule `attendance = (absence_reason == "none")` achieves **93.33% accuracy**, because `absence_reason` is recorded *after* the event occurs. Including it in a predictive model would be severe post-outcome leakage. **Action**: Dropped `absence_reason`.
2. **Corrupted Identifier (`student_id`)**: Contains 398 repeated floating-point values (e.g., `200.99` repeated thousands of times) and carries no predictive meaning. **Action**: Dropped `student_id`.
3. **Transferable Behavioural Log-Odds**: Fitting a clean pre-event Logistic Regression model on the remaining behavioural columns yielded **Holdout Accuracy = 61.70%, F1 = 0.6405, ROC-AUC = 0.6678** and extracted empirical log-odds effects:
   - `weather_rainy`: **$-0.5937$** (attendance drops from $54.55\%$ on sunny days to $41.57\%$ on rainy days)
   - `study_hours`: **$+0.2512$** per hour
   - `sleep_hours`: **$+0.1692$** per hour
   - `travel_time_minutes`: **$-0.0114$** per minute of commute
4. **Student Pool Export**: Saved 4,000 real student profiles to `data/processed/student_pool.csv` and audit metrics to `data/processed/kaggle_summary.json`.

---

## 3. Stage 2 — Synthetic Strathmore University Event Data Generation (`smartevent_ml/synthetic.py`)

Because the Kaggle dataset records general class attendance rather than university events with capacities, categories, and Africa's Talking SMS priority levels, we combined the 4,000 Kaggle student profiles and their learned weather/travel effects with **700 simulated Strathmore University events** (`2024-01-08` to `2026-06-30`) across 6 campus categories (`Academic`, `Workshop`, `Seminar`, `Club Activity`, `Sports`, `Career Fair`):
- Generated **150,645 unique student-event registrations** (`data/synthetic/events.csv` and `data/synthetic/raw_registrations.csv`).
- Tracked each student's chronological attendance history (`past_events_count`, `past_attendance_rate`) strictly prior to each event date to avoid future leakage.
- Injected realistic raw-data dirty artifacts (3,012 duplicate double-clicks, 15,064 casing/spelling variations like `"wkshp"` / `"MORNING"`, 1,204 impossible values such as negative travel times `-15` or `venue_capacity = -100`, missing weather/travel cells, and 753 unrecorded outcomes) so Stage 3 cleaning is verifiable.

---

## 4. Stage 3 — Deterministic Data Cleaning (`smartevent_ml/clean.py`)

Every cleaning operation was logged to `data/processed/cleaning_report.json`:

| Step | Rows Before | Rows After | Action Taken |
| :--- | :---: | :---: | :--- |
| **1. Remove Double Submissions** | 153,657 | 150,645 | Removed 3,012 duplicate `registration_id` rows (same student + event) |
| **2. Standardise Spellings** | 150,645 | 150,645 | Canonicalised 15,064 `event_category`, 12,051 `time_slot`, and 12,051 `sms_priority` strings |
| **3. Validate Categories** | 150,645 | 150,645 | Verified all categories map cleanly to canonical schema |
| **4. Impossible Values $\rightarrow$ NaN** | 150,645 | 150,645 | Converted 753 invalid `travel_time_minutes` and 451 invalid `venue_capacity` values to `NaN` |
| **5. Cross-Row Venue Recovery** | 150,645 | 150,645 | Recovered all 451 corrupted `venue_capacity` values from sibling registrations of the same `event_id` |
| **6. Drop Unrecorded Outcomes** | 150,645 | **149,892** | Dropped 753 rows missing the supervised target `attended` |

Remaining missing feature values (`weather`: 5,976; `travel_time_minutes`: 5,233; first-time student `past_attendance_rate`: 2,489) are imputed **inside** the `scikit-learn` `ColumnTransformer` (`SimpleImputer(add_indicator=True)`) so medians/modes are learned strictly from training folds.

---

## 5. Stages 4 & 5 — Chronological Split, Feature Engineering & Selection (`smartevent_ml/features.py`, `smartevent_ml/train.py`)

### Chronological Event Split (Stage 4)
- **Training Set (first 80% of events)**: **560 events** (`121,533` registrations, `2024-01-08` to `2026-01-22`, turnout rate `66.18%`).
- **Untouched Future Test Set (last 20% of events)**: **140 events** (`28,359` registrations, `2026-01-26` to `2026-06-30`, turnout rate `65.80%`).

### Domain Feature Engineering
Created 7 domain interaction features inside `FunctionTransformer`:
1. `fill_ratio` = `registered_count / venue_capacity`
2. `overbooked_excess` = $\max(0, \text{fill\_ratio} - 1.0)$
3. `is_weekend` = $\mathbb{I}(\text{day\_of\_week} \in \{5, 6\})$
4. `log_lead_days` = $\ln(1 + \text{lead\_days})$
5. `has_history` = $\mathbb{I}(\text{past\_events\_count} > 0)$
6. `evening_travel` = $\mathbb{I}(\text{Evening}) \times \text{travel\_time\_minutes}$ (captures late-evening commuter drop-off)
7. `evening_hostel` = $\mathbb{I}(\text{Evening}) \times \text{hostel\_resident}$

### Feature Selection (Stage 5)
Combined **Mutual Information** (filter) and **L1-penalised Logistic Regression** ($C=0.002$, embedded). Automatically pruned 3 redundant/zero-signal raw columns (`hostel_resident` raw main effect, `venue_capacity` raw scale once `fill_ratio` is present, and `year_of_study`), plus demographic noise columns (`gender`, `parent_education`).

---

## 6. Stage 6 — 5-Fold `GroupKFold` Model Comparison

Evaluated across 5 event-grouped cross-validation folds on the 560 training events:

| Model | Accuracy | F1-Score | ROC-AUC | Log-Loss |
| :--- | :---: | :---: | :---: | :---: |
| **Majority-Class Baseline** | 0.6618 | 0.7965 | 0.4930 | 0.6399 |
| **Logistic Regression (Primary)** | **0.6910** | **0.7940** | **0.6970** | **0.5851** |
| **Decision Tree (`max_depth=6`)** | 0.6830 | 0.7880 | 0.6780 | 0.5968 |
| **Random Forest (`200 trees`)** | 0.6880 | 0.7970 | 0.6950 | 0.5873 |
| **Gradient Boosting (`HistGB`)** | 0.6900 | 0.7920 | 0.6970 | 0.5840 |

**Finding**: Logistic Regression matches Gradient Boosting in ROC-AUC (`0.697`) and outperforms all tree models in accuracy (`0.691`), while remaining 100% interpretable and fast.

---

## 7. Stage 7 — Iterative Refinement of Logistic Regression

| Refinement Step | CV F1-Score | CV ROC-AUC | CV Log-Loss | Notes |
| :--- | :---: | :---: | :---: | :--- |
| **1. Raw Features Only** | 0.794 | 0.695 | 0.5866 | Baseline linear model |
| **2. + Engineered Domain Features** | 0.794 | **0.697** | **0.5851** | `evening_travel`, `log_lead_days`, `fill_ratio` improve ranking & calibration |
| **3. + Feature Selection** | 0.794 | 0.697 | 0.5851 | Dropped 5 noisy/redundant columns with zero loss in AUC |
| **4. + Hyperparameter Tuning (`GridSearchCV`)** | 0.794 | 0.697 | 0.5851 | Optimal regularisation: `penalty='l2'`, `C=0.01`, `class_weight=None` |
| **5. + Decision Threshold Optimization** | **0.800** | 0.697 | 0.5851 | Optimal classification threshold $t^* = 0.40$ |

---

## 8. Stage 8 — Final Evaluation on Untouched Future Test Events (140 Events)

### Student-Level Classification Metrics
- **At Default Threshold ($0.50$)**:
  - **Accuracy**: `69.44%`
  - **Precision**: `69.38%`
  - **Recall**: `95.87%`
  - **F1-Score**: `0.8050`
  - **ROC-AUC**: `0.7301`
  - **Log-Loss / Brier Score**: `0.5780` / `0.1975`
- **At Tuned Threshold ($0.40$)**:
  - **F1-Score**: `0.8000`, **Recall**: `98.71%`

### Event-Level Headcount Forecasting (140 Future Test Events)
- **SmartEvent Logistic Regression MAE**: **`13.61 attendees`** (`10.99%` MAPE; **`54.3%`** of events predicted within $\pm 10\%$ of actual headcount)
- **Flat Turnout Rate Baseline MAE**: `15.31 attendees`
- **Student History Baseline MAE**: `15.10 attendees`
