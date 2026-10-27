/**
 * Server-rendered admin console: every database table as a readable HTML table.
 * Access is restricted to ADMIN sessions (see server.js). All values are HTML-escaped.
 */
const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const fmtDate = (v) => {
  if (!v) return '-';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? esc(v) : d.toISOString().replace('T', ' ').slice(0, 16);
};

const badge = (text, kind) => `<span class="badge badge-${esc(String(kind || text).toLowerCase())}">${esc(text)}</span>`;

const STYLES = `
*{box-sizing:border-box}body{font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;background:#f8fafc;color:#0f172a;margin:0}
.topbar{background:linear-gradient(90deg,#002244,#003366);color:#fff;padding:20px 32px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px;border-bottom:3px solid #f59e0b}
.topbar h1{margin:0;font-size:21px;font-weight:800}.topbar p{margin:4px 0 0;font-size:12px;color:#cbd5e1}
.btn{padding:8px 14px;border-radius:9px;border:1px solid #cbd5e1;background:#fff;color:#003366;font-weight:700;font-size:12px;cursor:pointer}
.btn:hover{background:#f1f5f9}.btn-primary{background:#f59e0b;border-color:#f59e0b;color:#0f172a}
.container{max-width:1380px;margin:22px auto;padding:0 24px 48px}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:22px}
.stat{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:14px}
.stat b{display:block;font-size:11px;text-transform:uppercase;color:#64748b}.stat span{font-size:25px;font-weight:800;color:#003366}
.tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;border-bottom:1px solid #e2e8f0;padding-bottom:10px}
.tab{padding:8px 14px;border-radius:10px;border:1px solid #cbd5e1;background:#fff;color:#334155;font-size:12px;font-weight:700;cursor:pointer}
.tab.active,.tab:hover{background:#003366;color:#fff;border-color:#003366}
.panel{display:none;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:18px}.panel.active{display:block}
.panel-head{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:14px}
.panel-head h2{margin:0;font-size:16px}.search{padding:8px 13px;border:1px solid #cbd5e1;border-radius:10px;font-size:12px;width:260px}
.wrap{overflow-x:auto;border:1px solid #e2e8f0;border-radius:12px}
table{width:100%;border-collapse:collapse;font-size:12px;text-align:left}
th{background:#f1f5f9;color:#334155;font-size:10px;text-transform:uppercase;letter-spacing:.04em;padding:11px 13px;border-bottom:1px solid #cbd5e1;white-space:nowrap}
td{padding:10px 13px;border-bottom:1px solid #f1f5f9;vertical-align:middle}tr:hover td{background:#f8fafc}
.badge{display:inline-block;padding:3px 9px;border-radius:999px;font-size:10px;font-weight:700;text-transform:uppercase;background:#e2e8f0;color:#334155}
.badge-admin{background:#f3e8ff;color:#7e22ce}.badge-organizer{background:#fef3c7;color:#b45309}.badge-student{background:#e0f2fe;color:#0369a1}
.badge-active,.badge-confirmed,.badge-delivered,.badge-upcoming{background:#dcfce7;color:#15803d}
.badge-suspended,.badge-cancelled,.badge-failed,.badge-high{background:#fee2e2;color:#b91c1c}.badge-medium{background:#fef3c7;color:#b45309}.badge-low{background:#e0f2fe;color:#0369a1}
.empty{padding:26px;text-align:center;color:#94a3b8;font-size:13px}
.login{max-width:380px;margin:12vh auto;background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:28px;box-shadow:0 8px 30px rgba(0,0,0,.06)}
.login h1{margin:0 0 4px;font-size:20px;color:#003366}.login p{margin:0 0 18px;color:#64748b;font-size:13px}
.login label{display:block;font-size:11px;font-weight:700;color:#334155;margin:12px 0 4px;text-transform:uppercase}
.login input{width:100%;padding:10px 12px;border:1px solid #cbd5e1;border-radius:10px;font-size:14px}
.login .btn{width:100%;margin-top:18px;padding:11px;background:#003366;color:#fff;border-color:#003366}
.err{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;padding:9px 12px;border-radius:10px;font-size:12px;margin-bottom:8px;display:none}
`;

function table(id, columns, rows) {
  if (!rows.length) return '<div class="empty">No records.</div>';
  return `<div class="wrap"><table id="${id}"><thead><tr>${columns.map((c) => `<th>${esc(c.label)}</th>`).join('')}</tr></thead><tbody>${rows
    .map((r) => `<tr>${columns.map((c) => `<td>${c.render ? c.render(r) : esc(r[c.key] ?? '-')}</td>`).join('')}</tr>`)
    .join('')}</tbody></table></div>`;
}

function buildConsoleLoginHtml({ nonce, forbidden }) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SmartEvent Admin Console</title><style>${STYLES}</style></head><body>
<div class="login"><h1>SmartEvent Admin Console</h1><p>Database tables are visible to administrators only.</p>
<div class="err" id="err" style="${forbidden ? 'display:block' : ''}">${forbidden ? 'Your account is not an administrator.' : ''}</div>
<form id="f"><label>Admin email</label><input id="email" type="email" required autocomplete="username"><label>Password</label><input id="pw" type="password" required autocomplete="current-password"><button class="btn" type="submit">Sign in</button></form></div>
<script nonce="${nonce}">
const err=document.getElementById('err');
document.getElementById('f').addEventListener('submit',async(e)=>{e.preventDefault();err.style.display='none';
try{const r=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:document.getElementById('email').value,password:document.getElementById('pw').value,role:'admin'})});
const d=await r.json();if(!r.ok||!d.success)throw new Error(d.error||'Login failed');
const s=await fetch('/console/session',{method:'POST',headers:{Authorization:'Bearer '+d.token}});if(!s.ok)throw new Error('Could not start session');location.reload();}
catch(x){err.textContent=x.message;err.style.display='block';}});
</script></body></html>`;
}

function buildConsoleHtml({ db, user, nonce, engine }) {
  const users = (db.users || []).map(({ password, passwordHash, ...u }) => u);
  const events = db.events || [];
  const tabs = [
    {
      id: 'users', label: `Users (${users.length})`,
      html: table('t-users', [
        { label: 'Name', key: 'name' }, { label: 'Email', key: 'email' },
        { label: 'Role', render: (r) => badge(r.role, r.role) },
        { label: 'ID / Code', render: (r) => esc(r.studentId || r.organizerCode || r.staffId || '-') },
        { label: 'Phone', key: 'phone' },
        { label: 'Status', render: (r) => badge(r.status || 'Active') },
        { label: 'Created', render: (r) => fmtDate(r.createdAt) }
      ], users)
    },
    {
      id: 'events', label: `Events (${events.length})`,
      html: table('t-events', [
        { label: 'Event', key: 'title' }, { label: 'Organizer', render: (r) => esc(r.organizerName || r.organizer) },
        { label: 'Category', key: 'category' }, { label: 'Date', key: 'date' }, { label: 'Venue', key: 'venue' },
        { label: 'RSVPs', render: (r) => `${esc(r.registrationCount || 0)} / ${esc(r.venueCapacity)}` },
        { label: 'Status', render: (r) => badge(r.status || 'Upcoming') }
      ], events)
    },
    {
      id: 'regs', label: `Registrations (${(db.registrations || []).length})`,
      html: table('t-regs', [
        { label: 'Student', render: (r) => esc(r.studentName) }, { label: 'Adm. No', key: 'studentId' },
        { label: 'Event', render: (r) => esc(r.eventTitle || r.eventId) }, { label: 'Phone', key: 'phone' },
        { label: 'Registered', render: (r) => fmtDate(r.registeredAt) }, { label: 'Status', render: (r) => badge(r.status || 'Confirmed') }
      ], db.registrations || [])
    },
    {
      id: 'cats', label: `Categories (${(db.categories || []).length})`,
      html: table('t-cats', [
        { label: 'Name', key: 'name' }, { label: 'Description', key: 'description' },
        { label: 'Events', render: (r) => esc(events.filter((e) => e.category === r.name).length) }
      ], db.categories || [])
    },
    {
      id: 'venues', label: `Venues (${(db.venues || []).length})`,
      html: table('t-venues', [
        { label: 'Name', key: 'name' }, { label: 'Building', key: 'building' }, { label: 'Capacity', key: 'capacity' },
        { label: 'Projector', render: (r) => (r.hasProjector ? 'Yes' : 'No') }, { label: 'PA system', render: (r) => (r.hasPA ? 'Yes' : 'No') }
      ], db.venues || [])
    },
    {
      id: 'orgp', label: `Organizer profiles (${(db.organizer_profiles || []).length})`,
      html: table('t-orgp', [
        { label: 'Code', key: 'organizerCode' }, { label: 'Name', key: 'name' }, { label: 'Department', key: 'department' },
        { label: 'Office', key: 'officeLocation' }, { label: 'Verified', render: (r) => (r.verified ? 'Yes' : 'Pending') }
      ], db.organizer_profiles || [])
    },
    {
      id: 'studp', label: `Student profiles (${(db.student_profiles || []).length})`,
      html: table('t-studp', [
        { label: 'Adm. No', key: 'studentId' }, { label: 'Name', key: 'name' }, { label: 'Programme', key: 'program' },
        { label: 'Faculty', key: 'faculty' }, { label: 'Year', key: 'yearOfStudy' },
        { label: 'Past attendance', render: (r) => `${Math.round((r.pastAttendanceRate || 0) * 100)}%` }
      ], db.student_profiles || [])
    },
    {
      id: 'admp', label: `Admin profiles (${(db.admin_profiles || []).length})`,
      html: table('t-admp', [
        { label: 'Staff ID', key: 'staffId' }, { label: 'Name', key: 'name' }, { label: 'Title', key: 'title' },
        { label: 'Clearance', key: 'clearanceLevel' }
      ], db.admin_profiles || [])
    },
    {
      id: 'sms', label: `SMS logs (${(db.smsLogs || []).length})`,
      html: table('t-sms', [
        { label: 'Priority', render: (r) => badge(r.priority) }, { label: 'Event', render: (r) => esc(r.eventTitle) },
        { label: 'Recipient', render: (r) => esc(r.recipient || `${r.recipientCount || 0} recipients`) },
        { label: 'Message', render: (r) => esc(String(r.message || '').slice(0, 110)) },
        { label: 'Status', render: (r) => badge(String(r.status || '').split(' ')[0]) }, { label: 'Sent', render: (r) => fmtDate(r.sentAt) }
      ], db.smsLogs || [])
    },
    {
      id: 'act', label: `Activity (${(db.activity || []).length})`,
      html: table('t-act', [
        { label: 'Type', render: (r) => badge(r.type) }, { label: 'Detail', key: 'detail' }, { label: 'When', render: (r) => fmtDate(r.createdAt) }
      ], db.activity || [])
    }
  ];

  const count = (role) => users.filter((u) => u.role === role).length;
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SmartEvent Admin Console</title><style>${STYLES}</style></head><body>
<div class="topbar"><div><h1>SmartEvent - Database Tables &amp; API Console</h1><p>Signed in as ${esc(user.name)} (ADMIN) · Engine: ${esc(engine)} · Strathmore University</p></div>
<div><button class="btn btn-primary" id="logout">Sign out</button></div></div>
<div class="container">
<div class="stats">
<div class="stat"><b>Users</b><span>${users.length}</span></div><div class="stat"><b>Students</b><span>${count('student')}</span></div>
<div class="stat"><b>Organizers</b><span>${count('organizer')}</span></div><div class="stat"><b>Admins</b><span>${count('admin')}</span></div>
<div class="stat"><b>Events</b><span>${events.length}</span></div><div class="stat"><b>Registrations</b><span>${(db.registrations || []).length}</span></div>
<div class="stat"><b>SMS sent</b><span>${(db.smsLogs || []).length}</span></div></div>
<div class="tabs">${tabs.map((t, i) => `<button class="tab${i === 0 ? ' active' : ''}" data-tab="${t.id}">${esc(t.label)}</button>`).join('')}</div>
${tabs.map((t, i) => `<div class="panel${i === 0 ? ' active' : ''}" id="p-${t.id}"><div class="panel-head"><h2>${esc(t.label)}</h2><input class="search" placeholder="Filter rows..." data-filter="${t.id}"></div>${t.html}</div>`).join('')}
</div>
<script nonce="${nonce}">
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.tab,.panel').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.getElementById('p-'+b.dataset.tab).classList.add('active');}));
document.querySelectorAll('.search').forEach(i=>i.addEventListener('input',()=>{const q=i.value.toLowerCase();document.querySelectorAll('#p-'+i.dataset.filter+' tbody tr').forEach(r=>{r.style.display=r.innerText.toLowerCase().includes(q)?'':'none';});}));
document.getElementById('logout').addEventListener('click',async()=>{await fetch('/console/logout',{method:'POST'});location.reload();});
</script></body></html>`;
}

module.exports = { buildConsoleHtml, buildConsoleLoginHtml, esc };
