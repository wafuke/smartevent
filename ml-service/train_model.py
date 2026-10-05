import os
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib

DATASET_PATH = "data/Attendance_Prediction.csv"

def load_or_generate_dataset():
    if os.path.exists(DATASET_PATH):
        print(f"✅ Found user dataset at {DATASET_PATH} (20,000 student records)")
        df = pd.read_csv(DATASET_PATH)
        
        # Transform student attendance records into event turnout features
        df['eventType'] = df['course'].astype(str).str.upper()
        df['timeSlot'] = df['class_type'].apply(lambda x: 'Morning' if str(x).lower() == 'offline' else 'Afternoon')
        df['dayOfWeek'] = df['travel_time_minutes'].apply(lambda x: int(x) % 7)
        df['venueCapacity'] = df['study_hours'].apply(lambda x: int(50 + (x * 30)))
        df['registrationCount'] = df['venueCapacity'].apply(lambda c: int(c * 0.85))
        df['pastAttendanceRate'] = df['attendance'].apply(lambda a: 0.85 if a == 1 else 0.55)
        df['smsPriority'] = df['weather'].apply(lambda w: 3 if str(w).lower() in ['rainy', 'cold'] else 2)
        df['attendanceCount'] = df.apply(lambda r: int(r['registrationCount'] * (0.85 if r['attendance'] == 1 else 0.50)), axis=1)
        return df
    else:
        print("⚡ User dataset not found. Generating synthetic Strathmore University event dataset...")
        return generate_synthetic_data()

def generate_synthetic_data(num_samples=1500, seed=42):
    np.random.seed(seed)
    event_types = ['Academic', 'Workshop', 'Seminar', 'Club Activity', 'Sports', 'Career Fair']
    time_slots = ['Morning', 'Afternoon', 'Evening']
    data = []
    for _ in range(num_samples):
        e_type = np.random.choice(event_types)
        day_of_week = np.random.randint(0, 7)
        time_slot = np.random.choice(time_slots)
        venue_capacity = int(np.random.choice([50, 100, 150, 200, 350, 500]))
        registration_count = int(venue_capacity * np.random.uniform(0.5, 1.1))
        past_attendance_rate = np.round(np.random.uniform(0.45, 0.90), 2)
        sms_priority_sent = int(np.random.choice([1, 2, 3]))
        
        turnout_rate = np.clip(past_attendance_rate + (0.10 if sms_priority_sent == 3 else 0.0), 0.3, 0.98)
        actual_attendance = int(registration_count * turnout_rate)
        
        data.append({
            'eventType': e_type,
            'dayOfWeek': day_of_week,
            'timeSlot': time_slot,
            'venueCapacity': venue_capacity,
            'registrationCount': registration_count,
            'pastAttendanceRate': past_attendance_rate,
            'smsPriority': sms_priority_sent,
            'attendanceCount': actual_attendance
        })
    return pd.DataFrame(data)

def train_and_save_model():
    df = load_or_generate_dataset()
    
    X = df[['eventType', 'dayOfWeek', 'timeSlot', 'venueCapacity', 'registrationCount', 'pastAttendanceRate', 'smsPriority']]
    y = df['attendanceCount']
    
    categorical_features = ['eventType', 'timeSlot']
    numerical_features = ['dayOfWeek', 'venueCapacity', 'registrationCount', 'pastAttendanceRate', 'smsPriority']
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features),
            ('num', 'passthrough', numerical_features)
        ]
    )
    
    model_pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=100, random_state=42))
    ])
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    model_pipeline.fit(X_train, y_train)
    
    predictions = model_pipeline.predict(X_test)
    mae = mean_absolute_error(y_test, predictions)
    r2 = r2_score(y_test, predictions)
    
    print("===========================================")
    print("🎉 MODEL TRAINING COMPLETED")
    print(f"Dataset Size: {len(df)} rows")
    print(f"Mean Absolute Error (MAE): {mae:.2f} attendees")
    print(f"R² Score: {r2:.4f}")
    print("===========================================")
    
    os.makedirs("models", exist_ok=True)
    model_path = "models/attendance_model.joblib"
    joblib.dump(model_pipeline, model_path)
    print(f"✅ Model saved to {model_path}")

if __name__ == "__main__":
    train_and_save_model()
