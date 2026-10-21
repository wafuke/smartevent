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

// Root URL Route - Full Interactive Backend Database Tables & API Console
app.get("/", (req, res) => {
  const db = readLocalData();
  const users = (db.users || []).map(({ password, passwordHash, ...u }) => u);
  const admins = db.admin_profiles || [];
  const organizers = db.organizer_profiles || [];
  const students = db.student_profiles || [];
  const events = db.events || [];
  const registrations = db.registrations || [];
  const categories = db.categories || [];
  const venues = db.venues || [];
  const smsLogs = db.smsLogs || [];

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SmartEvent Backend Database Tables & API Console</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: 'Inter', system-ui, -apple-system, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 0; }
        .topbar { background: linear-gradient(90deg, #002244, #003366); color: #fff; padding: 22px 32px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; border-bottom: 3px solid #f59e0b; }
        .topbar h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
        .topbar p { margin: 4px 0 0 0; font-size: 12px; color: #cbd5e1; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
        .badge-online { background: #10b981; color: #fff; }
        .badge-admin { background: #f3e8ff; color: #7e22ce; border: 1px solid #d8b4fe; }
        .badge-organizer { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
        .badge-student { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
        .badge-high { background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; }
        .badge-medium { background: #fef3c7; color: #d97706; border: 1px solid #fcd34d; }
        .badge-low { background: #e0f2fe; color: #0284c7; border: 1px solid #7dd3fc; }
        .container { max-width: 1360px; margin: 24px auto; padding: 0 24px 48px 24px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 14px; margin-bottom: 24px; }
        .stat-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.03); }
        .stat-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; }
        .stat-val { font-size: 26px; font-weight: 800; color: #003366; margin-top: 4px; }
        .stat-sub { font-size: 11px; color: #059669; font-weight: 600; margin-top: 2px; }
        .tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 18px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
        .tab-btn { padding: 9px 15px; border-radius: 10px; border: 1px solid #cbd5e1; background: #fff; color: #334155; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.15s; }
        .tab-btn.active, .tab-btn:hover { background: #003366; color: #fff; border-color: #003366; }
        .panel { display: none; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; box-shadow: 0 2px 6px rgba(0,0,0,0.04); }
        .panel.active { display: block; }
        .panel-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; }
        .panel-title { font-size: 16px; font-weight: 800; color: #0f172a; margin: 0; }
        .search-box { padding: 8px 14px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 12px; width: 280px; outline: none; }
        .table-wrap { overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 12px; }
        table { width: 100%; border-collapse: collapse; text-align: left; font-size: 12px; }
        th { background: #f1f5f9; color: #334155; font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 0.04em; padding: 12px 14px; border-bottom: 1px solid #cbd5e1; white-space: nowrap; }
        td { padding: 11px 14px; border-bottom: 1px solid #f1f5f9; color: #1e293b; vertical-align: middle; }
        tr:hover td { background: #f8fafc; }
        code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 11px; color: #0f172a; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="topbar">
        <div>
          <h1>🎓 SmartEvent Relational Database & Admin Table Console</h1>
          <p>Strathmore University • Express REST Gateway (Port ${process.env.PORT || 5000}) • Bcrypt + JWT RBAC Security Active</p>
        </div>
        <div>
          <span class="badge badge-online">● DATABASE & API ONLINE</span>
        </div>
      </div>

      <div class="container">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Users Table</div>
            <div class="stat-val">${users.length}</div>
            <div class="stat-sub">${admins.length} Admins • ${organizers.length} Organizers • ${students.length} Students</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Events Table</div>
            <div class="stat-val">${events.length}</div>
            <div class="stat-sub">${categories.length} Active Categories</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Registrations Table</div>
            <div class="stat-val">${registrations.length}</div>
            <div class="stat-sub">Confirmed Student RSVPs</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Campus Venues</div>
            <div class="stat-val">${venues.length}</div>
            <div class="stat-sub">Mapped Lecture & Hall Spaces</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Africa's Talking SMS</div>
            <div class="stat-val">${smsLogs.length}</div>
            <div class="stat-sub">Priority Dispatches Logged</div>
          </div>
        </div>

        <div class="tabs">
          <button class="tab-btn active" onclick="showTab('users', this)">1. users (${users.length})</button>
          <button class="tab-btn" onclick="showTab('admins', this)">2. admin_profiles (${admins.length})</button>
          <button class="tab-btn" onclick="showTab('organizers', this)">3. organizer_profiles (${organizers.length})</button>
          <button class="tab-btn" onclick="showTab('students', this)">4. student_profiles (${students.length})</button>
          <button class="tab-btn" onclick="showTab('events', this)">5. events (${events.length})</button>
          <button class="tab-btn" onclick="showTab('registrations', this)">6. registrations (${registrations.length})</button>
          <button class="tab-btn" onclick="showTab('categories', this)">7. event_categories (${categories.length})</button>
          <button class="tab-btn" onclick="showTab('venues', this)">8. venues (${venues.length})</button>
          <button class="tab-btn" onclick="showTab('sms', this)">9. sms_logs (${smsLogs.length})</button>
        </div>

        <!-- 1. USERS TABLE -->
        <div id="tab-users" class="panel active">
          <div class="panel-header">
            <h2 class="panel-title">Table: <code>users</code> (All Authenticated Accounts)</h2>
            <input class="search-box" placeholder="Filter rows..." onkeyup="filterTable(this, 'tbl-users')" />
          </div>
          <div class="table-wrap">
            <table id="tbl-users">
              <thead>
                <tr>
                  <th>ID (PK)</th>
                  <th>Full Name</th>
                  <th>Email Address</th>
                  <th>Role</th>
                  <th>Student / Staff Code</th>
                  <th>Department / Program</th>
                  <th>Phone</th>
                  <th>Auth Provider</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${users.map(u => `
                  <tr>
                    <td><code>${u.id}</code></td>
                    <td><strong>${u.name}</strong></td>
                    <td>${u.email}</td>
                    <td><span class="badge badge-${u.role}">${u.role}</span></td>
                    <td><code>${u.studentId || u.adminCode || u.organizerCode || '—'}</code></td>
                    <td>${u.department || 'Strathmore University'}</td>
                    <td>${u.phone || '+254712345678'}</td>
                    <td>${u.authProvider || 'local'}</td>
                    <td><strong style="color:#059669">${u.status || 'Active'}</strong></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- 2. ADMIN PROFILES TABLE -->
        <div id="tab-admins" class="panel">
          <div class="panel-header">
            <h2 class="panel-title">Table: <code>admin_profiles</code> (2 System Administrators)</h2>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Profile ID (PK)</th>
                  <th>User ID (FK)</th>
                  <th>Admin Code</th>
                  <th>Administrator Name</th>
                  <th>Email</th>
                  <th>Role Title</th>
                  <th>Clearance</th>
                  <th>Office</th>
                  <th>Phone</th>
                </tr>
              </thead>
              <tbody>
                ${admins.map(a => `
                  <tr>
                    <td><code>${a.id}</code></td>
                    <td><code>${a.userId}</code></td>
                    <td><strong>${a.adminCode}</strong></td>
                    <td><strong>${a.name}</strong></td>
                    <td>${a.email}</td>
                    <td>${a.roleTitle}</td>
                    <td><span class="badge badge-admin">${a.clearanceLevel}</span></td>
                    <td>${a.office}</td>
                    <td>${a.phone}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- 3. ORGANIZER PROFILES TABLE -->
        <div id="tab-organizers" class="panel">
          <div class="panel-header">
            <h2 class="panel-title">Table: <code>organizer_profiles</code> (Event Organizers)</h2>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Profile ID (PK)</th>
                  <th>User ID (FK)</th>
                  <th>Org Code</th>
                  <th>Organizer Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Office Location</th>
                  <th>Phone</th>
                  <th>Events Hosted</th>
                </tr>
              </thead>
              <tbody>
                ${organizers.map(o => `
                  <tr>
                    <td><code>${o.id}</code></td>
                    <td><code>${o.userId}</code></td>
                    <td><strong>${o.organizerCode}</strong></td>
                    <td><strong>${o.name}</strong></td>
                    <td>${o.email}</td>
                    <td>${o.department}</td>
                    <td>${o.officeLocation}</td>
                    <td>${o.phone}</td>
                    <td><strong>${o.eventsHostedCount}</strong></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- 4. STUDENT PROFILES TABLE -->
        <div id="tab-students" class="panel">
          <div class="panel-header">
            <h2 class="panel-title">Table: <code>student_profiles</code> (Registered Students)</h2>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Profile ID (PK)</th>
                  <th>User ID (FK)</th>
                  <th>Admission No</th>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Degree Program</th>
                  <th>Faculty</th>
                  <th>Year</th>
                  <th>Phone (SMS)</th>
                  <th>Past Attendance Rate</th>
                </tr>
              </thead>
              <tbody>
                ${students.map(s => `
                  <tr>
                    <td><code>${s.id}</code></td>
                    <td><code>${s.userId}</code></td>
                    <td><strong>${s.studentId}</strong></td>
                    <td><strong>${s.name}</strong></td>
                    <td>${s.email}</td>
                    <td>${s.program}</td>
                    <td>${s.faculty}</td>
                    <td>Year ${s.yearOfStudy}</td>
                    <td>${s.phone}</td>
                    <td><strong>${Math.round((s.pastAttendanceRate || 0.8) * 100)}%</strong></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- 5. EVENTS TABLE -->
        <div id="tab-events" class="panel">
          <div class="panel-header">
            <h2 class="panel-title">Table: <code>events</code> (Campus Events & ML Forecast)</h2>
            <input class="search-box" placeholder="Search events..." onkeyup="filterTable(this, 'tbl-events')" />
          </div>
          <div class="table-wrap">
            <table id="tbl-events">
              <thead>
                <tr>
                  <th>Event ID (PK)</th>
                  <th>Event Title</th>
                  <th>Organizer</th>
                  <th>Category</th>
                  <th>Date & Time</th>
                  <th>Venue</th>
                  <th>RSVPs / Capacity</th>
                  <th>ML Predicted Turnout</th>
                  <th>SMS Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${events.map(e => `
                  <tr>
                    <td><code>${e.id}</code></td>
                    <td><strong>${e.title}</strong></td>
                    <td>${e.organizer}</td>
                    <td><span class="badge badge-student">${e.category}</span></td>
                    <td>${e.date} • ${e.time || e.timeSlot}</td>
                    <td>${e.venue}</td>
                    <td><strong>${e.registrationCount}</strong> / ${e.venueCapacity}</td>
                    <td><strong style="color:#0284c7">${e.predictedAttendance || Math.round(e.registrationCount * 0.8)} students</strong></td>
                    <td>Tier ${e.smsPriority || 2}</td>
                    <td><strong style="color:#059669">${e.status || 'Upcoming'}</strong></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- 6. REGISTRATIONS TABLE -->
        <div id="tab-registrations" class="panel">
          <div class="panel-header">
            <h2 class="panel-title">Table: <code>registrations</code> (Student Event RSVPs)</h2>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Registration ID (PK)</th>
                  <th>Event ID (FK)</th>
                  <th>Event Title</th>
                  <th>Student Name</th>
                  <th>Admission No</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Registered At</th>
                </tr>
              </thead>
              <tbody>
                ${registrations.map(r => `
                  <tr>
                    <td><code>${r.id}</code></td>
                    <td><code>${r.eventId}</code></td>
                    <td><strong>${r.eventTitle || r.eventId}</strong></td>
                    <td><strong>${r.studentName}</strong></td>
                    <td><code>${r.studentId}</code></td>
                    <td>${r.email}</td>
                    <td>${r.phone}</td>
                    <td><strong style="color:#059669">${r.status || 'Confirmed'}</strong></td>
                    <td>${(r.registeredAt || '').split('T')[0]}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- 7. CATEGORIES TABLE -->
        <div id="tab-categories" class="panel">
          <div class="panel-header">
            <h2 class="panel-title">Table: <code>event_categories</code></h2>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Category ID (PK)</th>
                  <th>Category Name</th>
                  <th>Description</th>
                  <th>Icon</th>
                  <th>Active Events</th>
                </tr>
              </thead>
              <tbody>
                ${categories.map(c => `
                  <tr>
                    <td><code>${c.id}</code></td>
                    <td><strong>${c.name}</strong></td>
                    <td>${c.description}</td>
                    <td><code>${c.icon || 'Tag'}</code></td>
                    <td><strong>${c.count || 0}</strong></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- 8. VENUES TABLE -->
        <div id="tab-venues" class="panel">
          <div class="panel-header">
            <h2 class="panel-title">Table: <code>venues</code> (Strathmore Campus Spaces)</h2>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Venue ID (PK)</th>
                  <th>Venue Name</th>
                  <th>Building</th>
                  <th>Max Capacity</th>
                  <th>AV & Lab Equipment</th>
                </tr>
              </thead>
              <tbody>
                ${venues.map(v => `
                  <tr>
                    <td><code>${v.id}</code></td>
                    <td><strong>${v.name}</strong></td>
                    <td>${v.building}</td>
                    <td><strong>${v.capacity} seats</strong></td>
                    <td>${v.equipment}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- 9. SMS LOGS TABLE -->
        <div id="tab-sms" class="panel">
          <div class="panel-header">
            <h2 class="panel-title">Table: <code>sms_logs</code> (Africa's Talking Priority SMS Dispatches)</h2>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>SMS ID (PK)</th>
                  <th>Priority</th>
                  <th>Event</th>
                  <th>Recipient</th>
                  <th>Phone (E.164)</th>
                  <th>Message Body</th>
                  <th>Gateway Response</th>
                  <th>Cost</th>
                  <th>Sent At</th>
                </tr>
              </thead>
              <tbody>
                ${smsLogs.map(s => `
                  <tr>
                    <td><code>${s.id}</code></td>
                    <td><span class="badge badge-${(s.priority || 'high').toLowerCase()}">${s.priority}</span></td>
                    <td><strong>${s.eventTitle}</strong></td>
                    <td>${s.recipientName || 'Student'}</td>
                    <td><code>${s.recipient}</code></td>
                    <td>${s.message}</td>
                    <td>${s.gatewayResponse}</td>
                    <td><strong>${s.cost}</strong></td>
                    <td>${(s.sentAt || '').replace('T', ' ').slice(0, 16)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <script>
        function showTab(name, btn) {
          document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
          document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
          document.getElementById('tab-' + name).classList.add('active');
          btn.classList.add('active');
        }
        function filterTable(input, tableId) {
          const q = input.value.toLowerCase();
          const rows = document.querySelectorAll('#' + tableId + ' tbody tr');
          rows.forEach(r => {
            r.style.display = r.innerText.toLowerCase().includes(q) ? '' : 'none';
          });
        }
      </script>
    </body>
    </html>
  `);
});

// Database Dump Endpoint
app.get("/api/db", (req, res) => {
  const data = readLocalData();
  res.json({
    success: true,
    databaseEngine: isFirestoreEnabled() ? "Firebase Firestore" : "Local Persistent Relational JSON",
    data
  });
});

// Health Check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "SmartEvent Express Backend",
    authSystem: "Active (Bcrypt + JWT + Google OAuth + Role Guarded)",
    smsGateway: "Africa's Talking API Integrated",
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
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[SmartEvent Backend] Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
