require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { readLocalData, isFirestoreEnabled } = require("./db");

const predictRoute = require("./routes/predict");
const eventsRoute = require("./routes/events");
const registrationsRoute = require("./routes/registrations");
const smsRoute = require("./routes/sms");
const analyticsRoute = require("./routes/analytics");

const app = express();
app.use(cors());
app.use(express.json());

// Root URL Route - HTML API & Database Status Inspector Page
app.get("/", (req, res) => {
  const data = readLocalData();
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>SmartEvent Backend API & Database Status</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 40px; }
        .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; max-width: 800px; margin: 0 auto 24px auto; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        h1 { color: #38bdf8; margin-top: 0; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: bold; background: #0284c7; color: white; margin-right: 8px; }
        .badge-green { background: #10b981; }
        .endpoint-list { list-style: none; padding: 0; }
        .endpoint-list li { margin-bottom: 12px; background: #0f172a; padding: 12px 16px; border-radius: 8px; border: 1px solid #334155; display: flex; justify-space-between; align-items: center; }
        a { color: #38bdf8; text-decoration: none; font-weight: 600; }
        a:hover { text-decoration: underline; }
        pre { background: #020617; padding: 16px; border-radius: 8px; overflow-x: auto; color: #a5f3fc; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="card">
        <span class="badge badge-green">SYSTEM ONLINE</span>
        <span class="badge">Strathmore University SmartEvent</span>
        <h1>SmartEvent API & Database Gateway</h1>
        <p>The Express REST API server is running successfully on <strong>port ${process.env.PORT || 5000}</strong>.</p>
        <p><strong>Database Engine:</strong> ${isFirestoreEnabled() ? "Firebase Firestore (Cloud)" : "JSON File Store (Local)"}</p>
      </div>

      <div class="card">
        <h2>Active API & Database Endpoints</h2>
        <ul class="endpoint-list">
          <li>
            <span>📅 <strong>Events Database:</strong> GET /api/events</span>
            <a href="/api/events" target="_blank">View Events JSON &rarr;</a>
          </li>
          <li>
            <span>📝 <strong>Student Registrations:</strong> GET /api/registrations</span>
            <a href="/api/registrations" target="_blank">View RSVPs JSON &rarr;</a>
          </li>
          <li>
            <span>📱 <strong>Priority SMS Gateway Logs:</strong> GET /api/sms/logs</span>
            <a href="/api/sms/logs" target="_blank">View SMS Logs &rarr;</a>
          </li>
          <li>
            <span>📊 <strong>System Analytics & ML Metrics:</strong> GET /api/analytics</span>
            <a href="/api/analytics" target="_blank">View Analytics &rarr;</a>
          </li>
          <li>
            <span>🤖 <strong>ML Attendance Predictor Proxy:</strong> POST /api/predict</span>
            <a href="/health" target="_blank">View Service Health &rarr;</a>
          </li>
          <li>
            <span>💾 <strong>Full Database Dump:</strong> GET /api/db</span>
            <a href="/api/db" target="_blank">Inspect Full Database &rarr;</a>
          </li>
        </ul>
      </div>

      <div class="card">
        <h3>Database Collection Summary</h3>
        <ul>
          <li><strong>Events Count:</strong> ${data.events.length}</li>
          <li><strong>Registrations Count:</strong> ${data.registrations.length}</li>
          <li><strong>Priority SMS Logs Count:</strong> ${data.smsLogs.length}</li>
        </ul>
      </div>
    </body>
    </html>
  `);
});

// Full Database Inspection Endpoint
app.get("/api/db", (req, res) => {
  const data = readLocalData();
  res.json({
    success: true,
    databaseEngine: isFirestoreEnabled() ? "Firebase Firestore" : "Local JSON Persistent Store",
    data
  });
});

// Health Check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "SmartEvent Express Backend",
    database: isFirestoreEnabled() ? "Firestore" : "Local JSON",
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use("/api/events", eventsRoute);
app.use("/api/registrations", registrationsRoute);
app.use("/api/sms", smsRoute);
app.use("/api/analytics", analyticsRoute);
app.use("/api/predict", predictRoute);

// Catch-all 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      "GET /",
      "GET /api/db",
      "GET /api/events",
      "GET /api/registrations",
      "GET /api/sms/logs",
      "POST /api/sms/send",
      "GET /api/analytics",
      "POST /api/predict"
    ]
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[SmartEvent Backend] Server running on http://localhost:${PORT}`);
});
