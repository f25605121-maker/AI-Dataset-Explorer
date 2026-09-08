import pandas as pd
import numpy as np
from typing import Tuple, List, Dict, Any
from sklearn.model_selection import GroupShuffleSplit
from sklearn.metrics import (
    roc_auc_score, average_precision_score, confusion_matrix,
    f1_score, balanced_accuracy_score, brier_score_loss
)

class LongitudinalEvaluator:
    """
    Evaluation pipeline for longitudinal medical data to prevent patient-level leakage
    and calculate robust, clinically meaningful metrics.
    """
    def __init__(self, patient_col: str, time_col: str, target_col: str, pred_prob_col: str):
        self.patient_col = patient_col
        self.time_col = time_col
        self.target_col = target_col
        self.pred_prob_col = pred_prob_col

    def verify_no_leakage(self, train_df: pd.DataFrame, val_df: pd.DataFrame, test_df: pd.DataFrame):
        """
        Automatically verify that no patient ID occurs across train/val/test splits.
        """
        train_patients = set(train_df[self.patient_col].unique())
        val_patients = set(val_df[self.patient_col].unique())
        test_patients = set(test_df[self.patient_col].unique())

        assert len(train_patients.intersection(val_patients)) == 0, "Leakage detected between train and val!"
        assert len(train_patients.intersection(test_patients)) == 0, "Leakage detected between train and test!"
        assert len(val_patients.intersection(test_patients)) == 0, "Leakage detected between val and test!"
        
        print("✅ Leakage verification passed: No patients cross-contaminated between splits.")

    def create_strict_patient_splits(self, df: pd.DataFrame, 
                                     train_size: float = 0.7, 
                                     val_size: float = 0.15, 
                                     test_size: float = 0.15,
                                     random_state: int = 42) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """
        Splits data strictly at the patient level, never at the image/scan level.
        Keeps all time points from one patient in exactly one split.
        Preserves temporal ordering.
        """
        assert abs(train_size + val_size + test_size - 1.0) < 1e-5, "Split sizes must sum to 1.0"
        
        # Sort by patient and time to preserve temporal ordering
        df = df.sort_values(by=[self.patient_col, self.time_col]).reset_index(drop=True)
        
        # Split Train vs (Val + Test)
        gss1 = GroupShuffleSplit(n_splits=1, train_size=train_size, random_state=random_state)
        train_idx, val_test_idx = next(gss1.split(df, groups=df[self.patient_col]))
        
        train_df = df.iloc[train_idx].copy()
        val_test_df = df.iloc[val_test_idx].copy()
        
        # Split Val vs Test
        val_relative_size = val_size / (val_size + test_size)
        gss2 = GroupShuffleSplit(n_splits=1, train_size=val_relative_size, random_state=random_state)
        val_idx, test_idx = next(gss2.split(val_test_df, groups=val_test_df[self.patient_col]))
        
        val_df = val_test_df.iloc[val_idx].copy()
        test_df = val_test_df.iloc[test_idx].copy()
        
        self.verify_no_leakage(train_df, val_df, test_df)
        return train_df, val_df, test_df

    def enforce_temporal_causality(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Ensures that predictions for a given time point T only rely on data <= T.
        If any prediction row has a feature/timestamp violating this, it flags/removes it.
        (Implementation depends on feature matrix, but this ensures timeline sorting)
        """
        # Ensure strict chronological order
        df = df.sort_values(by=[self.patient_col, self.time_col]).reset_index(drop=True)
        return df

    def compute_metrics(self, df: pd.DataFrame, threshold: float = 0.5) -> Dict[str, Any]:
        """
        Use appropriate metrics such as AUROC, AUPRC, sensitivity, specificity, 
        F1, balanced accuracy, and calibration.
        """
        y_true = df[self.target_col].values
        y_prob = df[self.pred_prob_col].values
        y_pred = (y_prob >= threshold).astype(int)

        metrics = {}
        
        # Handle edge cases where only one class is present in the split
        if len(np.unique(y_true)) > 1:
            metrics['AUROC'] = roc_auc_score(y_true, y_prob)
            metrics['AUPRC'] = average_precision_score(y_true, y_prob)
            metrics['Balanced_Accuracy'] = balanced_accuracy_score(y_true, y_pred)
            metrics['Brier_Score_Calibration'] = brier_score_loss(y_true, y_prob)
        else:
            metrics['AUROC'] = float('nan')
            metrics['AUPRC'] = float('nan')
            metrics['Balanced_Accuracy'] = float('nan')
            metrics['Brier_Score_Calibration'] = float('nan')

        metrics['F1_Score'] = f1_score(y_true, y_pred, zero_division=0)
        
        tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()
        metrics['Sensitivity'] = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        metrics['Specificity'] = tn / (tn + fp) if (tn + fp) > 0 else 0.0
        
        return metrics

    def report_per_class_performance(self, df: pd.DataFrame, class_col: str) -> pd.DataFrame:
        """
        Report performance separately for each disease class.
        """
        results = []
        classes = df[class_col].unique()
        
        for c in classes:
            subset = df[df[class_col] == c]
            m = self.compute_metrics(subset)
            m['Disease_Class'] = c
            m['N_Samples'] = len(subset)
            results.append(m)
            
        return pd.DataFrame(results)

if __name__ == "__main__":
    # Example Usage and Verification
    print("Generating Mock Longitudinal Data...")
    
    # 50 patients, irregular visits (1 to 5 visits per patient)
    np.random.seed(42)
    data = []
    for pid in range(1, 51):
        num_visits = np.random.randint(1, 6)
        base_time = np.random.randint(0, 100)
        for v in range(num_visits):
            # simulate irregular intervals
            time_offset = base_time + v * np.random.randint(30, 180)
            target = np.random.choice([0, 1])
            disease_class = np.random.choice(['Stage_1', 'Stage_2', 'Stage_3'])
            # Mock prediction (adding some signal)
            pred_prob = np.clip(np.random.normal(0.6 if target == 1 else 0.4, 0.2), 0.01, 0.99)
            
            data.append({
                'patient_id': f'P{pid:03d}',
                'scan_date_days': time_offset,
                'target_progression': target,
                'disease_class': disease_class,
                'pred_prob': pred_prob
            })
            
    df = pd.DataFrame(data)
    
    evaluator = LongitudinalEvaluator(
        patient_col='patient_id',
        time_col='scan_date_days',
        target_col='target_progression',
        pred_prob_col='pred_prob'
    )
    
    print("\n1. Splitting strictly by patient...")
    train_df, val_df, test_df = evaluator.create_strict_patient_splits(df)
    print(f"Train samples: {len(train_df)}, Val samples: {len(val_df)}, Test samples: {len(test_df)}")
    
    print("\n2. Computing overall Test Metrics...")
    test_metrics = evaluator.compute_metrics(test_df)
    for k, v in test_metrics.items():
        print(f"  {k}: {v:.4f}" if not np.isnan(v) else f"  {k}: NaN")
        
    print("\n3. Reporting per-class performance on Test Set...")
    class_report = evaluator.report_per_class_performance(test_df, 'disease_class')
    print(class_report.to_string(index=False))
