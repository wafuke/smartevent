require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { readLocalData, isFirestoreEnabled } = require("./db");
const { verifyToken } = require("./middleware/auth");

const authRoute = require("./routes/auth");
const usersRoute = require("./routes/users");
const eventsRoute = require("./routes/events");
const categoriesRoute = require("./routes/categories");
const registrationsRoute = require("./routes/registrations");
const favoritesRoute = require("./routes/favorites");
const notificationsRoute = require("./routes/notifications");
const adminRoute = require("./routes/admin");
const smsRoute = require("./routes/sms");
const analyticsRoute = require("./routes/analytics");
const predictRoute = require("./routes/predict");

const app = express();
app.use(cors());
app.use(express.json());

// Apply Auth Middleware globally (populates req.user if token provided)
app.use(verifyToken);

// Root URL Route - HTML API & Database Status Inspector Page
app.get("/", (req, res) => {
  const data = readLocalData();
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>SmartEvent Gateway & Authentication API</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 40px; }
        .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; max-width: 800px; margin: 0 auto 24px auto; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        h1 { color: #38bdf8; margin-top: 0; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: bold; background: #0284c7; color: white; margin-right: 8px; }
        .badge-green { background: #10b981; }
        .endpoint-list { list-style: none; padding: 0; }
        .endpoint-list li { margin-bottom: 12px; background: #0f172a; padding: 12px 16px; border-radius: 8px; border: 1px solid #334155; display: flex; justify-content: space-between; align-items: center; }
        a { color: #38bdf8; text-decoration: none; font-weight: 600; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="card">
        <span class="badge badge-green">SYSTEM ONLINE</span>
        <span class="badge">Strathmore SmartEvent Enterprise REST API</span>
        <h1>SmartEvent REST API & Authentication Gateway</h1>
        <p>Running on <strong>port ${process.env.PORT || 5000}</strong> with role-based authorization guards (Admin, Organizer, Student).</p>
      </div>

      <div class="card">
        <h2>Active API Endpoints</h2>
        <ul class="endpoint-list">
          <li>
            <span>🔐 <strong>Auth API:</strong> POST /api/auth/login, POST /api/auth/signup</span>
            <a href="/api/auth/users" target="_blank">Users &rarr;</a>
          </li>
          <li>
            <span>👥 <strong>User Management:</strong> GET /api/users</span>
            <a href="/api/users" target="_blank">View Users JSON &rarr;</a>
          </li>
          <li>
            <span>📅 <strong>Events REST API:</strong> GET /api/events</span>
            <a href="/api/events" target="_blank">View Events &rarr;</a>
          </li>
          <li>
            <span>🏷️ <strong>Categories API:</strong> GET /api/categories</span>
            <a href="/api/categories" target="_blank">Categories &rarr;</a>
          </li>
          <li>
            <span>📝 <strong>Registrations API:</strong> GET /api/registrations</span>
            <a href="/api/registrations" target="_blank">RSVPs &rarr;</a>
          </li>
          <li>
            <span>👑 <strong>Admin Dashboard API:</strong> GET /api/admin/overview</span>
            <a href="/api/admin/overview" target="_blank">Admin Stats &rarr;</a>
          </li>
          <li>
            <span>📱 <strong>Priority SMS Gateway Logs:</strong> GET /api/sms/logs</span>
            <a href="/api/sms/logs" target="_blank">SMS Logs &rarr;</a>
          </li>
          <li>
            <span>📊 <strong>System Analytics & ML Metrics:</strong> GET /api/analytics</span>
            <a href="/api/analytics" target="_blank">Analytics &rarr;</a>
          </li>
        </ul>
      </div>
    </body>
    </html>
  `);
});

// Database Dump Endpoint
app.get("/api/db", (req, res) => {
  const data = readLocalData();
  res.json({
    success: true,
    databaseEngine: isFirestoreEnabled() ? "Firebase Firestore" : "Local Persistent JSON",
    data
  });
});

// Health Check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "SmartEvent Express Backend",
    authSystem: "Active (JWT / Role Middleware Guarded)",
    timestamp: new Date().toISOString()
  });
});

// API Routes Registration
app.use("/api/auth", authRoute);
app.use("/api/users", usersRoute);
app.use("/api/events", eventsRoute);
app.use("/api/categories", categoriesRoute);
app.use("/api/registrations", registrationsRoute);
app.use("/api/favorites", favoritesRoute);
app.use("/api/notifications", notificationsRoute);
app.use("/api/admin", adminRoute);
app.use("/api/sms", smsRoute);
app.use("/api/analytics", analyticsRoute);
app.use("/api/predict", predictRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[SmartEvent Backend] Server running on http://localhost:${PORT}`);
});
