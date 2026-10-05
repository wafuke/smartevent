# 🎓 SmartEvent — University Event Management, Priority SMS & ML Prediction System

**Author:** Elvis Wanyama Wafuke (154210)  
**Supervisor:** Mr. Allan Vikiru  
**Institution:** Strathmore University — School of Computing and Engineering Sciences  

---

## 🛠️ System Architecture & Components

SmartEvent consists of three main services designed to run side-by-side:

```text
smartevent/
├── frontend/     # React.js + Vite Web Dashboard & Student Mobile App (Port 5173)
├── backend/      # Node.js + Express REST API & Priority SMS Engine (Port 5000)
├── ml-service/   # Python + FastAPI Machine Learning Prediction Engine (Port 8000)
├── notebooks/    # Google Colab Training Notebooks (Google Drive Integration)
└── README.md
```

---

## 🚀 How to Run the System (Side-by-Side Terminals)

Open **3 separate terminal windows** (or 3 terminal tabs in VS Code):

### 1️⃣ Terminal 1: Backend Server (Node.js & Express API)
```bash
cd backend
npm install
npm run dev
```
- **Local URL:** `http://localhost:5000`
- **Database Dump:** `http://localhost:5000/api/db`
- **Events API:** `http://localhost:5000/api/events`

---

### 2️⃣ Terminal 2: ML Prediction Service (Python & FastAPI)
```bash
cd ml-service
pip install -r requirements.txt
python train_model.py
python main.py
```
- **Local URL:** `http://localhost:8000`
- **API Docs (Swagger):** `http://localhost:8000/docs`
- **Prediction Endpoint:** `POST http://localhost:8000/predict`

---

### 3️⃣ Terminal 3: Frontend Web Dashboard & Student App (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
- **Organizer Dashboard & Student App:** `http://localhost:5173`

---

## 📓 Google Colab ML Notebook

To run model training in Google Colab with Google Drive export:
- Open [`notebooks/SmartEvent_ML_Attendance_Prediction.ipynb`](file:///c:/Users/userss/Desktop/is%20project%20stuff/smartevent/notebooks/SmartEvent_ML_Attendance_Prediction.ipynb) or open directly in Colab:
- 👉 **[Open in Google Colab](https://colab.research.google.com/github/wafuke/smartevent/blob/main/notebooks/SmartEvent_ML_Attendance_Prediction.ipynb)**
