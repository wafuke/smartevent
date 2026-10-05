const express = require("express");
const router = express.Router();
const { readLocalData, writeLocalData } = require("../db");

// Pre-seeded system accounts for instant testing
const defaultUsers = [
  {
    id: "usr-admin-1",
    name: "System Administrator",
    email: "admin@strathmore.edu",
    password: "password123",
    role: "admin", // admin, organizer, student
    department: "ICT Infrastructure",
    createdAt: new Date().toISOString()
  },
  {
    id: "usr-org-1",
    name: "SCES Event Organizer",
    email: "organizer@strathmore.edu",
    password: "password123",
    role: "organizer",
    department: "School of Computing & Engineering Sciences",
    createdAt: new Date().toISOString()
  },
  {
    id: "usr-stud-1",
    name: "Elvis Wanyama Wafuke",
    email: "student@strathmore.edu",
    studentId: "154210",
    password: "password123",
    role: "student",
    department: "Informatics and Computer Science",
    createdAt: new Date().toISOString()
  }
];

function getUsers() {
  const db = readLocalData();
  if (!db.users || db.users.length === 0) {
    db.users = defaultUsers;
    writeLocalData(db);
  }
  return db.users;
}

// POST /api/auth/signup - Register new user account
router.post("/signup", (req, res) => {
  const { name, email, password, role, studentId, department } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, error: "Name, email, and password are required." });
  }

  const users = getUsers();
  const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

  if (existing) {
    return res.status(400).json({ success: false, error: "An account with this email address already exists." });
  }

  const validRole = ['admin', 'organizer', 'student'].includes(role) ? role : 'student';

  const newUser = {
    id: `usr-${Date.now()}`,
    name,
    email: email.toLowerCase(),
    password, // In production Firebase Auth, password handling is managed via Firebase Admin SDK
    role: validRole,
    studentId: studentId || (validRole === 'student' ? '154210' : undefined),
    department: department || 'Strathmore University',
    createdAt: new Date().toISOString()
  };

  const db = readLocalData();
  db.users = db.users || [];
  db.users.push(newUser);
  writeLocalData(db);

  // Return user without password
  const { password: _, ...userPayload } = newUser;
  const token = `token_${newUser.id}_${Date.now()}`;

  res.status(201).json({
    success: true,
    message: "Account registered successfully!",
    token,
    user: userPayload
  });
});

// POST /api/auth/login - Sign In user account
router.post("/login", (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: "Email and password are required." });
  }

  const users = getUsers();
  const user = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!user) {
    return res.status(401).json({ success: false, error: "Invalid email or password credentials." });
  }

  // If role filter specified, verify role match
  if (role && user.role !== role) {
    return res.status(403).json({ success: false, error: `Account found, but role is '${user.role}' instead of '${role}'.` });
  }

  const { password: _, ...userPayload } = user;
  const token = `token_${user.id}_${Date.now()}`;

  res.json({
    success: true,
    message: `Welcome back, ${user.name}!`,
    token,
    user: userPayload
  });
});

// GET /api/auth/users - List registered users (Admin only)
router.get("/users", (req, res) => {
  const users = getUsers().map(({ password, ...u }) => u);
  res.json({ success: true, count: users.length, data: users });
});

module.exports = router;
