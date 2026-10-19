const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const { readLocalData, writeLocalData } = require("../db");

const JWT_SECRET = process.env.JWT_SECRET || "smartevent-strathmore-jwt-secret-key-2026";
const JWT_EXPIRES_IN = "7d";

// Pre-seeded system accounts for instant testing (passwords hashed lazily on first load)
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

function signAuthToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function getUsers() {
  const db = readLocalData();
  if (!db.users || db.users.length === 0) {
    db.users = defaultUsers.map((u) => ({
      ...u,
      passwordHash: bcrypt.hashSync(u.password, 10)
    }));
    writeLocalData(db);
  }
  return db.users;
}

function verifyPassword(user, candidatePassword) {
  if (user.passwordHash) {
    return bcrypt.compareSync(candidatePassword, user.passwordHash);
  }
  if (user.password && user.password.startsWith("$2")) {
    return bcrypt.compareSync(candidatePassword, user.password);
  }
  return user.password === candidatePassword;
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

  const validRole = ["admin", "organizer", "student"].includes(role) ? role : "student";
  const passwordHash = bcrypt.hashSync(password, 10);

  const newUser = {
    id: `usr-${Date.now()}`,
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: validRole,
    studentId: studentId || (validRole === "student" ? "154210" : undefined),
    department: department || "Strathmore University",
    status: "active",
    createdAt: new Date().toISOString()
  };

  const db = readLocalData();
  db.users = db.users || [];
  db.users.push(newUser);
  writeLocalData(db);

  // Return user without password/passwordHash
  const { password: _, passwordHash: __, ...userPayload } = newUser;
  const token = signAuthToken(newUser);

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
    (u) => u.email.toLowerCase() === email.toLowerCase() && verifyPassword(u, password)
  );

  if (!user) {
    return res.status(401).json({ success: false, error: "Invalid email or password credentials." });
  }

  // Upgrade plaintext password to bcrypt hash transparently if needed
  if (!user.passwordHash) {
    const db = readLocalData();
    const target = (db.users || []).find((u) => u.id === user.id);
    if (target) {
      target.passwordHash = bcrypt.hashSync(password, 10);
      writeLocalData(db);
    }
  }

  // If role filter specified, verify role match
  if (role && user.role !== role) {
    return res.status(403).json({ success: false, error: `Account found, but role is '${user.role}' instead of '${role}'.` });
  }

  const { password: _, passwordHash: __, ...userPayload } = user;
  const token = signAuthToken(user);

  res.json({
    success: true,
    message: `Welcome back, ${user.name}!`,
    token,
    user: userPayload
  });
});

// GET /api/auth/users - List registered users (Admin only)
router.get("/users", (req, res) => {
  const users = getUsers().map(({ password, passwordHash, ...u }) => u);
  res.json({ success: true, count: users.length, data: users });
});

module.exports = router;

