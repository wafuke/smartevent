"""
SmartEvent End-to-End Machine Learning Training Entrypoint
==========================================================
Follows the complete data-science methodology defined in Section 3.2 & 3.8 of the
SmartEvent Project Proposal (Elvis Wanyama Wafuke, 154210 - Strathmore University):

  Stage 1: Kaggle Dataset Audit & Leakage Removal (`smartevent_ml.kaggle_prep`)
  Stage 2: Synthetic Strathmore Event Registration Generation (`smartevent_ml.synthetic`)
  Stage 3: Deterministic Data Cleaning & Imputation Prep (`smartevent_ml.clean`)
  Stage 4: Chronological Event Split (560 Train Events / 140 Future Test Events)
  Stage 5: Feature Engineering & Selection (Mutual Information + L1 Logistic Regression)
  Stage 6: 5-Fold GroupKFold Model Comparison (Dummy, Logistic Regression, Decision Tree,
           Random Forest, Gradient Boosting)
  Stage 7: 5-Stage Iterative Refinement of Logistic Regression
  Stage 8: Untouched Future Test Set Evaluation & Artifact Export (`models/attendance_model.joblib`)
"""
import argparse
from smartevent_ml import kaggle_prep, synthetic, clean, train


def run_full_pipeline(skip_data_gen: bool = False):
    print("=================================================================")
    print("🎓 SMARTEVENT ML PIPELINE — STRATHMORE UNIVERSITY (154210)")
    print("=================================================================")
    if not skip_data_gen:
        kaggle_prep.run()
        synthetic.run()
        clean.run()
    results = train.run()
    print("=================================================================")
    print("✅ END-TO-END PIPELINE COMPLETE")
    print(f"   Student-Level Test ROC-AUC : {results['test_default']['roc_auc']:.4f}")
    print(f"   Student-Level Test F1 Score: {results['test_default']['f1']:.4f}")
    print(f"   Event Headcount Test MAE   : {results['event_metrics']['mae_attendees']:.2f} attendees")
    print("=================================================================")
    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run the SmartEvent ML training pipeline.")
    parser.add_argument(
        "--skip-data-gen",
        action="store_true",
        help="Skip Stages 1-3 if data/processed/clean_registrations.csv already exists."
    )
    args = parser.parse_args()
    run_full_pipeline(skip_data_gen=args.skip_data_gen)
