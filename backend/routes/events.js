const express = require("express");
const router = express.Router();
const { readLocalData, writeLocalData } = require("../db");
const { requireAuth, requireRole } = require("../middleware/auth");

// GET /api/events - List all events (Public)
router.get("/", (req, res) => {
  const db = readLocalData();
  const events = db.events || [];
  const search = req.query.search;
  const category = req.query.category;

  let filtered = events;
  if (category && category !== "All") {
    filtered = filtered.filter(e => e.category === category);
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(e => 
      e.title.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.venue.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, count: filtered.length, total: events.length, data: filtered });
});

// GET /api/events/:id - Get single event details (Public)
router.get("/:id", (req, res) => {
  const db = readLocalData();
  const event = (db.events || []).find((e) => e.id === req.params.id);
  if (!event) {
    return res.status(404).json({ success: false, error: "Event not found" });
  }
  res.json({ success: true, data: event });
});

// GET /api/events/:id/attendees - Get attendee roster (Organizer or Admin only)
router.get("/:id/attendees", requireRole(["organizer", "admin"]), (req, res) => {
  const db = readLocalData();
  const event = (db.events || []).find((e) => e.id === req.params.id);
  if (!event) {
    return res.status(404).json({ success: false, error: "Event not found" });
  }

  const attendees = (db.registrations || []).filter(r => r.eventId === req.params.id);
  res.json({ success: true, count: attendees.length, data: attendees });
});

// POST /api/events - Create a new event (Organizer or Admin only)
router.post("/", requireRole(["organizer", "admin"]), (req, res) => {
  const { title, category, description, date, timeSlot, time, venue, venueCapacity, smsPriority } = req.body;
  if (!title || !category || !venue || !venueCapacity) {
    return res.status(400).json({ success: false, error: "Missing required event fields (title, category, venue, venueCapacity)" });
  }

  const db = readLocalData();

  const newEvent = {
    id: `evt-${Date.now()}`,
    title,
    category: category || "General",
    description: description || "",
    date: date || new Date().toISOString().split("T")[0],
    timeSlot: timeSlot || "Afternoon",
    time: time || "10:00 AM",
    venue,
    venueCapacity: parseInt(venueCapacity, 10),
    registrationCount: 0,
    pastAttendanceRate: 0.75,
    predictedAttendance: Math.round(parseInt(venueCapacity, 10) * 0.75),
    smsPriority: parseInt(smsPriority, 10) || 2,
    status: "Upcoming",
    organizer: req.user ? req.user.name : "Strathmore Event Organizer",
    organizerName: req.user ? req.user.name : "Strathmore Event Organizer",
    organizerId: req.user ? req.user.id : "usr-org-1",
    createdAt: new Date().toISOString()
  };

  db.events = db.events || [];
  db.events.unshift(newEvent);
  writeLocalData(db);

  res.status(201).json({ success: true, message: "Event created successfully", data: newEvent });
});

// PUT /api/events/:id - Update event details (Organizer or Admin only)
router.put("/:id", requireRole(["organizer", "admin"]), (req, res) => {
  const db = readLocalData();
  db.events = db.events || [];
  const index = db.events.findIndex((e) => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: "Event not found" });
  }

  const currentEvent = db.events[index];

  // Organizers can only edit their own events (unless Admin)
  if (req.user.role !== "admin" && currentEvent.organizerId && currentEvent.organizerId !== req.user.id) {
    return res.status(403).json({ success: false, error: "Unauthorized to edit events created by another organizer" });
  }

  db.events[index] = {
    ...currentEvent,
    ...req.body,
    id: req.params.id,
    updatedAt: new Date().toISOString()
  };

  writeLocalData(db);

  res.json({ success: true, message: "Event updated successfully", data: db.events[index] });
});

// DELETE /api/events/:id - Delete an event (Organizer or Admin only)
router.delete("/:id", requireRole(["organizer", "admin"]), (req, res) => {
  const db = readLocalData();
  db.events = db.events || [];
  const index = db.events.findIndex((e) => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: "Event not found" });
  }

  const currentEvent = db.events[index];

  // Organizers can only delete their own events (unless Admin)
  if (req.user.role !== "admin" && currentEvent.organizerId && currentEvent.organizerId !== req.user.id) {
    return res.status(403).json({ success: false, error: "Unauthorized to delete events created by another organizer" });
  }

  const deleted = db.events.splice(index, 1);
  writeLocalData(db);

  res.json({ success: true, message: "Event deleted successfully", data: deleted[0] });
});

module.exports = router;
