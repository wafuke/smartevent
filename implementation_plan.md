# Implementation Plan - SmartEvent System

SmartEvent is a comprehensive university event management platform designed for Strathmore University, featuring:
1. **Priority-Based SMS Notification Engine**: Categorizes event communications into High, Medium, and Low urgency levels using Africa's Talking API (with simulated/live delivery capabilities).
2. **Machine Learning Attendance Prediction Module**: Supervised model (Scikit-Learn/FastAPI) trained on university event characteristics (event type, scheduling, registration volume, past attendance rates, SMS priority) to predict headcount turnout and provide resource planning recommendations.
3. **Organizer & Student Web/Mobile Applications**: High-performance, modern React interface for event organizers (analytics, creation with live ML predictions, priority SMS launcher) and students (event discovery, registration, priority notifications inbox matching Chapter 4 wireframes).
4. **Backend REST API**: Node.js & Express server handling events, registrations, notification logs, predictive analytics, and proxying to the ML service.

---

## User Review Required

> [!IMPORTANT]
> **Africa's Talking API Credentials**: The SMS notification engine includes full support for Africa's Talking API configuration via environment variables (`AT_USERNAME`, `AT_API_KEY`, `AT_SENDER_ID`). A mock/sandbox fallback mode is active by default so you can test sending priority SMS messages without active credits.
>
> **Firebase Setup**: Firebase Auth & Firestore client configuration is enabled with a fallback local store mode so the system works immediately out-of-box while remaining fully ready for production Firebase environment keys (`REACT_APP_FIREBASE_*`).

---

## Open Questions

> [!NOTE]
> 1. **Machine Learning Model Preference**: The proposed proposal mentions Logistic Regression as the baseline model, with Random Forest/XGBoost for high-accuracy predictions. We plan to train both in the Python service script and serialize the highest-performing model (`attendance_model.joblib`). Is this acceptable?
> 2. **Mobile View Experience**: Should the student portal be embedded as a responsive mobile-first UI within the React app (matching Figures 4:7 through 4:10 in the proposal) alongside the Organizer Web Dashboard?

---

## Proposed Changes

### 1. ML Service Component (`ml-service/`)

#### [NEW] [train_model.py](file:///c:/Users/userss/Desktop/is%20project%20stuff/smartevent/ml-service/train_model.py)
- Generates realistic Strathmore University event dataset (`dataset.csv`) incorporating variables specified in Section 3.2.1: event category (Academic, Club, Workshop, Seminar, Campus Sports), venue capacity, registration count, time slot, day of week, past attendance rate, and priority SMS status.
- Trains a Scikit-Learn Supervised Random Forest / Logistic Regression classifier & regressor.
- Evaluates model metrics (Accuracy, Precision, Recall, F1-Score, MAE) and serializes the trained model artifact to `models/attendance_model.joblib`.

#### [MODIFY] [main.py](file:///c:/Users/userss/Desktop/is%20project%20stuff/smartevent/ml-service/main.py)
- Expands FastAPI application to accept rich prediction requests.
- Implements feature encoding pipeline matching the trained `.joblib` model.
- Returns predicted turnout percentage, estimated attendee count, risk score (e.g. Overcrowding Risk, Low Turnout Risk), and actionable resource recommendations (venue capacity check, catering estimate).

---

### 2. Backend Component (`backend/`)

#### [MODIFY] [server.js](file:///c:/Users/userss/Desktop/is%20project%20stuff/smartevent/backend/server.js)
- Mounts new API routes: `/api/events`, `/api/registrations`, `/api/sms`, `/api/analytics`, `/api/predict`.
- Configures CORS, logging, and error handling middleware.

#### [NEW] [routes/events.js](file:///c:/Users/userss/Desktop/is%20project%20stuff/smartevent/backend/routes/events.js)
- REST endpoints for creating, retrieving, updating, and deleting university events.

#### [NEW] [routes/sms.js](file:///c:/Users/userss/Desktop/is%20project%20stuff/smartevent/backend/routes/sms.js)
- Priority-based SMS notification service.
- Priority levels: `HIGH` (Emergency/Venue Changes/Deadlines), `MEDIUM` (Reminders/Schedule Updates), `LOW` (General News/Announcements).
- Africa's Talking API client wrapper with fallback mock dispatcher for local testing.
- Stores delivery logs with priority tags and delivery status.

#### [NEW] [routes/registrations.js](file:///c:/Users/userss/Desktop/is%20project%20stuff/smartevent/backend/routes/registrations.js)
- Student event registration and RSVP management endpoints.

#### [NEW] [routes/analytics.js](file:///c:/Users/userss/Desktop/is%20project%20stuff/smartevent/backend/routes/analytics.js)
- Aggregates system metrics: total events, total registrations, overall attendance prediction accuracy, SMS volume by priority level.

---

### 3. Frontend Component (`frontend/`)

#### [NEW] [Package Setup & Structure](file:///c:/Users/userss/Desktop/is%20project%20stuff/smartevent/frontend/package.json)
- React frontend initialized with Vite, Tailwind/Modern CSS styling with glassmorphic cards, Lucide Icons, and Recharts visualization library.

#### [NEW] [App Layout & Navigation](file:///c:/Users/userss/Desktop/is%20project%20stuff/smartevent/frontend/src/App.jsx)
- Top bar with Strathmore University SmartEvent branding, dual-view mode switcher (Organizer Dashboard vs Student Mobile View).

#### [NEW] Organizer Modules:
- **Organizer Dashboard**: Executive overview of active events, total registrations, predicted attendance breakdown, and quick action launcher.
- **Event Creation & ML Simulator**: Interactive form allowing organizers to input event details and instantly see the ML Predicted Attendance & Resource Guidance in real-time.
- **Priority SMS Broadcast Engine**: Interface to draft priority messages (High/Medium/Low priority), select target audience (All registered, specific event attendees), and send via Africa's Talking API.
- **Predictive Analytics & Reports**: Visual charts comparing predicted vs registered headcount, turnout rates by event type, and priority SMS delivery logs.

#### [NEW] Student Portal Modules (Matching Figures 4:7 - 4:10):
- **Sign In / Sign Up Screen** (Figure 4:7)
- **Available Events Feed** (Figure 4:8)
- **Event Details & RSVP Page** (Figure 4:9)
- **Priority Notifications Inbox** (Figure 4:10) with visual urgency indicators (Red for High, Amber for Medium, Blue for Low).

---

## Verification Plan

### Automated Verification
1. Run dataset generation and ML model training script: `python train_model.py` in `ml-service/`. Verify `attendance_model.joblib` output and model metrics.
2. Launch FastAPI ML service (`uvicorn main:app --port 8000`) and test `/health` and `/predict` endpoints via HTTP POST.
3. Test Node.js backend (`npm start` in `backend/`) on port 5000 and verify all REST endpoints (`/api/events`, `/api/predict`, `/api/sms`, `/api/analytics`).
4. Build and start Vite React frontend (`npm run build` & `npm run dev`) on port 5173.

### Manual Verification
1. **Event Creation with ML Prediction**: Create a new Strathmore University workshop event and verify that the ML model returns predicted turnout % and resource advice.
2. **Priority SMS Dispatch**: Send a High-Priority notification for an event and verify it appears in the student notification inbox tagged with `HIGH` priority status and logged in SMS analytics.
3. **Student Registration**: Test student registration flow and verify RSVP count updates dynamically in both organizer dashboard and ML prediction inputs.
4. **Analytics View**: Verify chart visualizations for attendance predictions and priority SMS delivery stats.
