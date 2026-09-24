import os
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib

def generate_synthetic_data(num_samples=1200, seed=42):
    np.random.seed(seed)
    
    event_types = ['Academic', 'Workshop', 'Seminar', 'Club Activity', 'Sports', 'Career Fair']
    time_slots = ['Morning', 'Afternoon', 'Evening']
    
    data = []
    for _ in range(num_samples):
        e_type = np.random.choice(event_types, p=[0.25, 0.25, 0.20, 0.15, 0.10, 0.05])
        day_of_week = np.random.randint(0, 7) # 0=Mon, 6=Sun
        time_slot = np.random.choice(time_slots, p=[0.3, 0.5, 0.2])
        venue_capacity = int(np.random.choice([50, 100, 150, 200, 350, 500]))
        
        # Registration is usually 50% - 120% of venue capacity
        registration_count = int(venue_capacity * np.random.uniform(0.5, 1.15))
        past_attendance_rate = np.round(np.random.uniform(0.45, 0.90), 2)
        sms_priority_sent = int(np.random.choice([1, 2, 3], p=[0.3, 0.4, 0.3])) # 1: Low, 2: Medium, 3: High
        
        # Calculate realistic base turnout percentage based on features
        base_rate = past_attendance_rate
        
        # Event type modifier
        if e_type in ['Academic', 'Career Fair']:
            base_rate += 0.08
        elif e_type == 'Sports':
            base_rate += 0.05
        elif e_type == 'Seminar':
            base_rate -= 0.04
            
        # SMS priority impact: High-priority SMS boosts turnout by ~10%, Medium by ~5%
        if sms_priority_sent == 3:
            base_rate += 0.12
        elif sms_priority_sent == 2:
            base_rate += 0.06
            
        # Day of week impact (mid-week higher, weekends lower)
        if day_of_week in [1, 2, 3]: # Tue, Wed, Thu
            base_rate += 0.05
        elif day_of_week in [5, 6]: # Sat, Sun
            base_rate -= 0.10
            
        # Add random noise
        turnout_rate = np.clip(base_rate + np.random.normal(0, 0.05), 0.30, 0.98)
        actual_attendance = int(np.clip(registration_count * turnout_rate, 10, venue_capacity))
        
        data.append({
            'eventType': e_type,
            'dayOfWeek': day_of_week,
            'timeSlot': time_slot,
            'venueCapacity': venue_capacity,
            'registrationCount': registration_count,
            'pastAttendanceRate': past_attendance_rate,
            'smsPriority': sms_priority_sent,
            'attendanceCount': actual_attendance,
            'turnoutRate': round(turnout_rate, 3)
        })
        
    return pd.DataFrame(data)

def train_and_save_model():
    print("Generating synthetic Strathmore University event dataset...")
    df = generate_synthetic_data()
    
    # Save CSV for reference/inspection
    os.makedirs("data", exist_ok=True)
    df.to_csv("data/university_events.csv", index=False)
    print("Saved dataset to ml-service/data/university_events.csv")
    
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
    
    print(f"Model Training Completed Successfully!")
    print(f"Mean Absolute Error (MAE): {mae:.2f} attendees")
    print(f"R^2 Score: {r2:.4f}")
    
    os.makedirs("models", exist_ok=True)
    model_path = "models/attendance_model.joblib"
    joblib.dump(model_pipeline, model_path)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    train_and_save_model()
