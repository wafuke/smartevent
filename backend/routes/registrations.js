const express = require("express");
const router = express.Router();
const { readLocalData, writeLocalData } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

// GET /api/registrations - List registrations (Filterable by eventId or studentId)
router.get("/", (req, res) => {
  const db = readLocalData();
  const { eventId, studentId } = req.query;
  let filtered = db.registrations || [];

  if (eventId) {
    filtered = filtered.filter((r) => r.eventId === eventId);
  }
  if (studentId) {
    filtered = filtered.filter((r) => r.studentId === studentId);
  }

  res.json({ success: true, count: filtered.length, data: filtered });
});

// POST /api/registrations - Register student for an event (Authenticated)
router.post("/", requireAuth, (req, res) => {
  const { eventId, studentName, studentId, phone, email } = req.body;

  if (!eventId) {
    return res.status(400).json({ success: false, error: "Missing eventId" });
  }

  const db = readLocalData();
  db.registrations = db.registrations || [];
  db.events = db.events || [];

  const currentUser = req.user;

  // Check if already registered for this event
  const existing = db.registrations.find(
    (r) => r.eventId === eventId && (r.userId === currentUser.id || r.email === currentUser.email)
  );

  if (existing) {
    return res.status(400).json({ success: false, error: "You are already registered for this event." });
  }

  const newRegistration = {
    id: `reg-${Date.now()}`,
    eventId,
    userId: currentUser.id,
    studentName: studentName || currentUser.name,
    studentId: studentId || currentUser.studentId || "154210",
    phone: phone || "+254712345678",
    email: email || currentUser.email,
    registeredAt: new Date().toISOString()
  };

  db.registrations.push(newRegistration);

  // Increment event registration count and update ML predicted turnout
  const event = db.events.find((e) => e.id === eventId);
  if (event) {
    event.registrationCount = (event.registrationCount || 0) + 1;
    event.predictedAttendance = Math.round(event.registrationCount * (event.pastAttendanceRate || 0.8));
  }

  writeLocalData(db);

  res.status(201).json({
    success: true,
    message: "RSVP Registration successful!",
    data: newRegistration
  });
});

// DELETE /api/registrations/:id - Cancel registration (Authenticated)
router.delete("/:id", requireAuth, (req, res) => {
  const db = readLocalData();
  db.registrations = db.registrations || [];
  db.events = db.events || [];

  const index = db.registrations.findIndex(r => r.id === req.params.id || r.eventId === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: "Registration record not found" });
  }

  const registration = db.registrations[index];

  // Students can only cancel their own registration (unless Admin/Organizer)
  if (req.user.role === "student" && registration.userId && registration.userId !== req.user.id) {
    return res.status(403).json({ success: false, error: "Unauthorized to cancel another student's RSVP" });
  }

  const deleted = db.registrations.splice(index, 1);

  // Decrement event registration count
  const event = db.events.find((e) => e.id === registration.eventId);
  if (event && event.registrationCount > 0) {
    event.registrationCount -= 1;
    event.predictedAttendance = Math.round(event.registrationCount * (event.pastAttendanceRate || 0.8));
  }

  writeLocalData(db);

  res.json({
    success: true,
    message: "RSVP Registration cancelled successfully",
    data: deleted[0]
  });
});

module.exports = router;
