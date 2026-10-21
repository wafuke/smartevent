const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const { readLocalData, writeLocalData } = require("../db");
const { requireAuth } = require("../middleware/auth");

const JWT_SECRET = process.env.JWT_SECRET || "smartevent-strathmore-jwt-secret-key-2026";
const JWT_EXPIRES_IN = "7d";

function signAuthToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password, passwordHash, ...safeUser } = user;
  return safeUser;
}

function getUsers() {
  const db = readLocalData();
  return db.users || [];
}

function verifyPassword(user, candidatePassword) {
  if (!candidatePassword || typeof candidatePassword !== "string") return false;
  if (user.passwordHash) {
    return bcrypt.compareSync(candidatePassword, user.passwordHash);
  }
  if (user.password && user.password.startsWith("$2")) {
    return bcrypt.compareSync(candidatePassword, user.password);
  }
  if (user.password) {
    return user.password === candidatePassword;
  }
  return false;
}

// POST /api/auth/signup - Register new user account
router.post("/signup", (req, res) => {
  const { name, email, password, role, studentId, phone, department } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      error: "Full name, email address, and password are required."
    });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({
      success: false,
      error: "Please provide a valid email address (e.g. name@strathmore.edu)."
    });
  }

  if (String(password).length < 6) {
    return res.status(400).json({
      success: false,
      error: "Password must be at least 6 characters long."
    });
  }

  const db = readLocalData();
  db.users = db.users || [];
  const existing = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (existing) {
    return res.status(400).json({
      success: false,
      error: "An account with this email address already exists. Please sign in instead."
    });
  }

  const validRole = ["admin", "organizer", "student"].includes(role) ? role : "student";
  const passwordHash = bcrypt.hashSync(password, 10);
  const userId = `usr-${validRole}-${Date.now()}`;

  const newUser = {
    id: userId,
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash,
    role: validRole,
    studentId: validRole === "student" ? (studentId || `15${Math.floor(1000 + Math.random() * 9000)}`) : undefined,
    phone: phone || "+254712345678",
    department: department || "School of Computing & Engineering Sciences",
    status: "Active",
    authProvider: "local",
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);

  // Sync corresponding role profile table
  if (validRole === "student") {
    db.student_profiles = db.student_profiles || [];
    db.student_profiles.push({
      id: `stud-prof-${Date.now()}`,
      userId,
      studentId: newUser.studentId,
      name: newUser.name,
      email: newUser.email,
      program: newUser.department,
      faculty: "SCES",
      yearOfStudy: 3,
      phone: newUser.phone,
      hostelResident: false,
      pastAttendanceRate: 0.80
    });
  } else if (validRole === "organizer") {
    db.organizer_profiles = db.organizer_profiles || [];
    db.organizer_profiles.push({
      id: `org-prof-${Date.now()}`,
      userId,
      organizerCode: `ORG-${Math.floor(100 + Math.random() * 900)}`,
      name: newUser.name,
      email: newUser.email,
      department: newUser.department,
      officeLocation: "SCES Complex",
      phone: newUser.phone,
      verified: true,
      eventsHostedCount: 0
    });
  } else if (validRole === "admin") {
    db.admin_profiles = db.admin_profiles || [];
    db.admin_profiles.push({
      id: `adm-prof-${Date.now()}`,
      userId,
      adminCode: `ADM-${Math.floor(100 + Math.random() * 900)}`,
      name: newUser.name,
      email: newUser.email,
      roleTitle: "System Administrator",
      clearanceLevel: "ADMIN",
      office: "ICT Directorate",
      phone: newUser.phone,
      permissions: ["MANAGE_USERS", "MANAGE_EVENTS", "MANAGE_CATEGORIES", "SMS_BROADCAST"]
    });
  }

  writeLocalData(db);

  const userPayload = sanitizeUser(newUser);
  const token = signAuthToken(newUser);

  res.status(201).json({
    success: true,
    message: "Account registered successfully!",
    token,
    user: userPayload
  });
});

// POST /api/auth/login - Strictly validate email, password, and role
router.post("/login", (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: "Email address and password are required."
    });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const users = getUsers();
  const userByEmail = users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!userByEmail) {
    return res.status(401).json({
      success: false,
      error: "Invalid credentials: No account found with that email address."
    });
  }

  if (!verifyPassword(userByEmail, password)) {
    return res.status(401).json({
      success: false,
      error: "Invalid credentials: Incorrect password."
    });
  }

  if (userByEmail.status && userByEmail.status.toLowerCase() === "suspended") {
    return res.status(403).json({
      success: false,
      error: "This account has been suspended by a System Administrator."
    });
  }

  // If role filter specified, strictly verify role match
  if (role && userByEmail.role !== role) {
    return res.status(403).json({
      success: false,
      error: `Role mismatch: '${userByEmail.email}' is registered as '${userByEmail.role.toUpperCase()}', not '${role.toUpperCase()}'. Please select the '${userByEmail.role.toUpperCase()}' role.`
    });
  }

  // Upgrade plaintext password to bcrypt hash transparently if needed
  if (!userByEmail.passwordHash) {
    const db = readLocalData();
    const target = (db.users || []).find((u) => u.id === userByEmail.id);
    if (target) {
      target.passwordHash = bcrypt.hashSync(password, 10);
      delete target.password;
      writeLocalData(db);
    }
  }

  const userPayload = sanitizeUser(userByEmail);
  const token = signAuthToken(userByEmail);

  res.json({
    success: true,
    message: `Welcome back, ${userByEmail.name}!`,
    token,
    user: userPayload
  });
});

// POST /api/auth/google - Google OAuth / Google Workspace Sign-In
router.post("/google", (req, res) => {
  try {
    let { email, name, googleId, picture, role, credential } = req.body;

    // If a Google Identity Services JWT credential was provided, decode its payload
    if (credential && typeof credential === "string" && credential.split(".").length === 3) {
      const base64Payload = credential.split(".")[1];
      const decodedJson = Buffer.from(base64Payload, "base64").toString("utf8");
      const payload = JSON.parse(decodedJson);
      email = payload.email || email;
      name = payload.name || name;
      googleId = payload.sub || googleId;
      picture = payload.picture || picture;
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Google authentication requires a valid Google account email."
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const db = readLocalData();
    db.users = db.users || [];

    let user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (user) {
      // If user explicitly asked for a role that doesn't match their existing account role, warn or use their true role
      if (role && user.role !== role) {
        return res.status(403).json({
          success: false,
          error: `Your Google account (${user.email}) is registered with the '${user.role.toUpperCase()}' role, not '${role.toUpperCase()}'.`
        });
      }
      user.googleId = googleId || user.googleId || `google_${user.id}`;
      user.picture = picture || user.picture;
      user.lastLoginAt = new Date().toISOString();
      writeLocalData(db);
    } else {
      // Provision new account via Google OAuth
      const validRole = ["admin", "organizer", "student"].includes(role) ? role : "student";
      // Security: Only pre-authorized emails can self-provision as Admin via Google
      if (validRole === "admin") {
        return res.status(403).json({
          success: false,
          error: "Administrator accounts cannot be self-created via Google Sign-In. Please sign in with an authorized Admin Google account (admin@strathmore.edu or allan.vikiru@strathmore.edu)."
        });
      }

      const userId = `usr-google-${Date.now()}`;
      user = {
        id: userId,
        name: name || normalizedEmail.split("@")[0].replace(/\./g, " "),
        email: normalizedEmail,
        passwordHash: bcrypt.hashSync(`google_oauth_${Date.now()}`, 10),
        role: validRole,
        googleId: googleId || `google_${Date.now()}`,
        picture: picture || null,
        studentId: validRole === "student" ? `15${Math.floor(1000 + Math.random() * 9000)}` : undefined,
        phone: "+254712345678",
        department: "School of Computing & Engineering Sciences",
        status: "Active",
        authProvider: "google",
        createdAt: new Date().toISOString()
      };

      db.users.push(user);

      if (validRole === "student") {
        db.student_profiles = db.student_profiles || [];
        db.student_profiles.push({
          id: `stud-prof-${Date.now()}`,
          userId,
          studentId: user.studentId,
          name: user.name,
          email: user.email,
          program: "BSc Informatics & Computer Science",
          faculty: "SCES",
          yearOfStudy: 3,
          phone: user.phone,
          hostelResident: false,
          pastAttendanceRate: 0.82
        });
      } else if (validRole === "organizer") {
        db.organizer_profiles = db.organizer_profiles || [];
        db.organizer_profiles.push({
          id: `org-prof-${Date.now()}`,
          userId,
          organizerCode: `ORG-${Math.floor(100 + Math.random() * 900)}`,
          name: user.name,
          email: user.email,
          department: user.department,
          officeLocation: "SCES Complex",
          phone: user.phone,
          verified: true,
          eventsHostedCount: 0
        });
      }

      writeLocalData(db);
    }

    const userPayload = sanitizeUser(user);
    const token = signAuthToken(user);

    res.json({
      success: true,
      message: `Signed in with Google as ${user.name}`,
      token,
      user: userPayload
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: "Failed to verify Google account credential: " + err.message
    });
  }
});

// GET /api/auth/me - Validate current JWT token and return active user profile
router.get("/me", requireAuth, (req, res) => {
  res.json({
    success: true,
    user: sanitizeUser(req.user)
  });
});

// GET /api/auth/users - List registered users (sanitized)
router.get("/users", (req, res) => {
  const users = getUsers().map(sanitizeUser);
  res.json({ success: true, count: users.length, data: users });
});

module.exports = router;
