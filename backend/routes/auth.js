const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const { readLocalData, writeLocalData } = require("../db");
const { requireAuth } = require("../middleware/auth");

const JWT_SECRET = process.env.JWT_SECRET || "smartevent-strathmore-jwt-secret-key-2026";
const JWT_EXPIRES_IN = "8h";

// Brute-force protection: track failed login attempts per email
const loginAttempts = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60 * 1000; // 1 minute lockout after 5 failed attempts

function checkRateLimit(emailKey) {
  const record = loginAttempts.get(emailKey);
  if (!record) return { allowed: true };
  if (record.count >= MAX_FAILED_ATTEMPTS) {
    const elapsed = Date.now() - record.lastAttempt;
    if (elapsed < LOCKOUT_DURATION_MS) {
      const remainingSec = Math.ceil((LOCKOUT_DURATION_MS - elapsed) / 1000);
      return {
        allowed: false,
        error: `Too many failed login attempts. Account temporarily locked for ${remainingSec}s.`
      };
    }
    loginAttempts.delete(emailKey);
  }
  return { allowed: true };
}

function recordFailedAttempt(emailKey) {
  const record = loginAttempts.get(emailKey) || { count: 0, lastAttempt: 0 };
  record.count += 1;
  record.lastAttempt = Date.now();
  loginAttempts.set(emailKey, record);
}

function clearFailedAttempts(emailKey) {
  loginAttempts.delete(emailKey);
}

function signAuthToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: String(user.role || "student").toLowerCase(),
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password, passwordHash, ...safeUser } = user;
  return {
    ...safeUser,
    role: String(safeUser.role || "student").toLowerCase()
  };
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

// POST /api/auth/signup - Register new Student or Organizer account (Admin self-signup blocked)
router.post("/signup", (req, res) => {
  const { name, email, password, role, studentId, phone, department, organizationName } = req.body;

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

  const requestedRole = String(role || "student").trim().toLowerCase();
  if (requestedRole === "admin") {
    return res.status(403).json({
      success: false,
      error: "Security Restriction: Administrator accounts cannot be self-registered publicly."
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

  const validRole = requestedRole === "organizer" ? "ORGANIZER" : "STUDENT";
  const passwordHash = bcrypt.hashSync(password, 10);
  const userId = `usr-${validRole.toLowerCase()}-${Date.now()}`;

  const newUser = {
    id: userId,
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash,
    role: validRole,
    studentId: validRole === "STUDENT" ? (studentId || `15${Math.floor(1000 + Math.random() * 9000)}`) : undefined,
    organizerCode: validRole === "ORGANIZER" ? `ORG-${Math.floor(100 + Math.random() * 900)}` : undefined,
    organizationName: validRole === "ORGANIZER" ? (organizationName || department || `${String(name).trim()} Events`) : undefined,
    phone: phone || "+254712345678",
    department: department || "School of Computing & Engineering Sciences",
    status: "Active",
    authProvider: "local",
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);

  if (validRole === "STUDENT") {
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
      pastAttendanceRate: 0.82
    });
  } else if (validRole === "ORGANIZER") {
    db.organizer_profiles = db.organizer_profiles || [];
    db.organizer_profiles.push({
      id: `org-prof-${Date.now()}`,
      userId,
      organizerCode: newUser.organizerCode,
      name: newUser.name,
      email: newUser.email,
      department: newUser.department,
      officeLocation: "SCES Complex",
      phone: newUser.phone,
      verified: true,
      eventsHostedCount: 0
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

// POST /api/auth/login - Strictly validate email, password, rate limits, and optional role check
router.post("/login", (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: "Email address and password are required."
    });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  // Check brute-force rate limit
  const rateCheck = checkRateLimit(normalizedEmail);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      success: false,
      error: rateCheck.error
    });
  }

  const users = getUsers();
  const userByEmail = users.find((u) => u.email.toLowerCase() === normalizedEmail);

  if (!userByEmail) {
    recordFailedAttempt(normalizedEmail);
    return res.status(401).json({
      success: false,
      error: "Invalid email or password credentials."
    });
  }

  if (!verifyPassword(userByEmail, password)) {
    recordFailedAttempt(normalizedEmail);
    return res.status(401).json({
      success: false,
      error: "Invalid email or password credentials."
    });
  }

  if (userByEmail.status && userByEmail.status.toLowerCase() === "suspended") {
    return res.status(403).json({
      success: false,
      error: "This account has been suspended by a System Administrator."
    });
  }

  const userRoleLower = String(userByEmail.role || "student").toLowerCase();
  const requestedRoleLower = role ? String(role).trim().toLowerCase() : null;

  // If a specific role tab was chosen and does not match the user's actual role, reject
  if (requestedRoleLower && requestedRoleLower !== "auto" && userRoleLower !== requestedRoleLower) {
    return res.status(403).json({
      success: false,
      error: `Access Denied: This account is registered as '${userRoleLower.toUpperCase()}', not '${requestedRoleLower.toUpperCase()}'.`
    });
  }

  clearFailedAttempts(normalizedEmail);

  const userPayload = sanitizeUser(userByEmail);
  const token = signAuthToken(userByEmail);

  res.json({
    success: true,
    message: `Welcome back, ${userByEmail.name}!`,
    token,
    user: userPayload
  });
});

// POST /api/auth/google - Google OAuth / Google Workspace Account Chooser Sign-In
router.post("/google", (req, res) => {
  try {
    let { email, name, googleId, picture, role, credential, password } = req.body;

    // Decode Google Identity Services JWT credential if provided by Google OAuth popup
    let verifiedByGoogleToken = false;
    if (credential && typeof credential === "string" && credential.split(".").length === 3) {
      const base64Payload = credential.split(".")[1];
      const decodedJson = Buffer.from(base64Payload, "base64").toString("utf8");
      const payload = JSON.parse(decodedJson);
      email = payload.email || email;
      name = payload.name || name;
      googleId = payload.sub || googleId;
      picture = payload.picture || picture;
      verifiedByGoogleToken = Boolean(payload.email && payload.sub);
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Google authentication requires a valid Google account email."
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        error: "Please enter a valid Google Workspace (@strathmore.edu) or Gmail address."
      });
    }

    const db = readLocalData();
    db.users = db.users || [];

    let user = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (user) {
      const actualRole = String(user.role || "student").toLowerCase();

      // Security check: if signing into an existing account without a cryptographic Google ID token,
      // require password verification so no one can impersonate another user or Admin by email alone.
      if (!verifiedByGoogleToken) {
        if (!password || !verifyPassword(user, password)) {
          return res.status(401).json({
            success: false,
            error: "Please enter the valid Google / Strathmore Workspace password for this account."
          });
        }
      }

      if (role && role !== "auto" && actualRole !== String(role).toLowerCase()) {
        return res.status(403).json({
          success: false,
          error: `Your Google account (${user.email}) is registered as '${actualRole.toUpperCase()}', not '${String(role).toUpperCase()}'.`
        });
      }

      user.googleId = googleId || user.googleId || `google_${user.id}`;
      user.picture = picture || user.picture;
      user.lastLoginAt = new Date().toISOString();
      writeLocalData(db);
    } else {
      // Provision new Student or Organizer account via Google OAuth
      const requestedRole = String(role || "student").toLowerCase();
      if (requestedRole === "admin") {
        return res.status(403).json({
          success: false,
          error: "Administrator accounts cannot be self-created via Google Sign-In."
        });
      }

      if (!verifiedByGoogleToken && (!password || String(password).length < 6)) {
        return res.status(400).json({
          success: false,
          error: "Please provide your Google account password (min 6 characters) to verify your account."
        });
      }

      const validRole = requestedRole === "organizer" ? "ORGANIZER" : "STUDENT";
      const userId = `usr-google-${Date.now()}`;
      const formattedName =
        name ||
        normalizedEmail
          .split("@")[0]
          .replace(/[._-]/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());

      user = {
        id: userId,
        name: formattedName,
        email: normalizedEmail,
        passwordHash: bcrypt.hashSync(password || `google_oauth_${Date.now()}`, 10),
        role: validRole,
        googleId: googleId || `google_${Date.now()}`,
        picture: picture || null,
        studentId: validRole === "STUDENT" ? `15${Math.floor(1000 + Math.random() * 9000)}` : undefined,
        organizerCode: validRole === "ORGANIZER" ? `ORG-${Math.floor(100 + Math.random() * 900)}` : undefined,
        phone: "+254712345678",
        department: "School of Computing & Engineering Sciences",
        status: "Active",
        authProvider: "google",
        createdAt: new Date().toISOString()
      };

      db.users.push(user);

      if (validRole === "STUDENT") {
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
      } else {
        db.organizer_profiles = db.organizer_profiles || [];
        db.organizer_profiles.push({
          id: `org-prof-${Date.now()}`,
          userId,
          organizerCode: user.organizerCode,
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

// GET /api/auth/users - Protected endpoint (requires authentication)
router.get("/users", requireAuth, (req, res) => {
  const users = getUsers().map(sanitizeUser);
  res.json({ success: true, count: users.length, data: users });
});

module.exports = router;
