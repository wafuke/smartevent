const express = require("express");
const router = express.Router();
const { readLocalData, writeLocalData } = require("../db");

// GET /api/registrations - List all registrations or filter
router.get("/", (req, res) => {
  const db = readLocalData();
  const { eventId, studentId } = req.query;
  let filtered = db.registrations;

  if (eventId) {
    filtered = filtered.filter((r) => r.eventId === eventId);
  }
  if (studentId) {
    filtered = filtered.filter((r) => r.studentId === studentId);
  }

  res.json({ success: true, count: filtered.length, data: filtered });
});

// POST /api/registrations - Register student for an event
router.post("/", (req, res) => {
  const { eventId, studentName, studentId, phone, email } = req.body;

  if (!eventId || !studentName || !phone) {
    return res.status(400).json({ success: false, error: "Missing eventId, studentName, or phone" });
  }

  const db = readLocalData();

  // Check if already registered
  const existing = db.registrations.find(
    (r) => r.eventId === eventId && (r.studentId === studentId || r.phone === phone)
  );

  if (existing) {
    return res.status(400).json({ success: false, error: "Student is already registered for this event." });
  }

  const newRegistration = {
    id: `reg-${Date.now()}`,
    eventId,
    studentName,
    studentId: studentId || "154210",
    phone,
    email: email || "student@strathmore.edu",
    registeredAt: new Date().toISOString()
  };

  db.registrations.push(newRegistration);

  // Increment event registration count
  const event = db.events.find((e) => e.id === eventId);
  if (event) {
    event.registrationCount = (event.registrationCount || 0) + 1;
    event.predictedAttendance = Math.round(event.registrationCount * (event.pastAttendanceRate || 0.8));
  }

  writeLocalData(db);

  res.status(201).json({
    success: true,
    message: "Registration successful!",
    data: newRegistration
  });
});

module.exports = router;
