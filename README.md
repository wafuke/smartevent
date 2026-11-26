# SmartEvent — University Event Management, Priority SMS & ML Prediction System

**Author:** Elvis Wanyama Wafuke (154210)  
**Supervisor:** Mr. Allan Vikiru  
**Institution:** Strathmore University — School of Computing and Engineering Sciences  

---

## System Architecture & Project Structure

SmartEvent is organized into four synchronized services plus project documentation:

```text
smartevent/
├── backend/       # Node.js + Express REST API, JWT Auth, Google OAuth 2.0 & Africa's Talking Priority SMS (Port 5000)
├── frontend/      # React.js + Vite Web Application (Public, Student, Organizer & Admin Portals — Port 5173)
├── mobile/        # React Native + Expo SDK 58 Mobile Application (Android, iOS & Expo Web)
├── ml-service/    # Python + FastAPI Logistic Regression Attendance Prediction Engine (Port 8000)
├── notebooks/     # Google Colab ML Training & Evaluation Notebook
├── docs/          # System Architecture & Live Africa's Talking Evidence Screenshots
├── start-all.ps1  # One-command PowerShell launcher for all local services
└── README.md
```

---

## Quick Start (One Command on Windows)

From the project root (`smartevent/`), launch Backend, ML Service, Frontend Web, and Mobile Expo together:

```powershell
.\start-all.ps1
```

---

## Manual Startup (Side-by-Side Terminals)

### 1. Backend Server (Node.js & Express API — Port 5000)
```bash
cd backend
npm install
npm test        # Runs all 20 automated backend unit & integration tests
npm run dev     # Starts API on http://localhost:5000
```

### 2. ML Prediction Service (Python & FastAPI — Port 8000)
```bash
cd ml-service
pip install -r requirements.txt
python train_model.py
python main.py
```
- **API Docs (Swagger):** `http://localhost:8000/docs`
- *(Note: The Node.js backend also includes a built-in fallback predictor if the Python service is offline.)*

### 3. Frontend Web Application (React + Vite — Port 5173)
```bash
cd frontend
npm install
npm run dev     # Starts Web App on http://localhost:5173
```

### 4. Mobile Application (React Native + Expo SDK 58)
```bash
cd mobile
npm install
npx expo start  # Scan QR code in Expo Go (SDK 58), or press 'w' for Web
```

---

## Key Integrations
- **Google OAuth 2.0 Sign-In:** Real `accounts.google.com` OAuth 2.0 authentication configured via `GOOGLE_CLIENT_ID` (`backend/.env`) and `VITE_GOOGLE_CLIENT_ID` (`frontend/.env`).
- **Africa's Talking Priority SMS:** Live + Sandbox dual-dispatch in `backend/services/sms.js` with student-controlled priority tiers (`HIGH`, `MEDIUM`, `LOW`, `NONE`) and opt-out support.
- **Web & Mobile Live Sync:** Mobile auto-detects the host LAN IP and polls every 6 seconds alongside Web focus/interval sync so RSVPs, events, SMS alerts, and profile changes reflect immediately across platforms.
