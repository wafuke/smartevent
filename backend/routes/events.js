const express = require("express");
const router = express.Router();
const { readLocalData, writeLocalData } = require("../db");

// GET /api/events - List all events
router.get("/", (req, res) => {
  const db = readLocalData();
  res.json({ success: true, count: db.events.length, data: db.events });
});

// GET /api/events/:id - Get single event details
router.get("/:id", (req, res) => {
  const db = readLocalData();
  const event = db.events.find((e) => e.id === req.params.id);
  if (!event) {
    return res.status(404).json({ success: false, error: "Event not found" });
  }
  res.json({ success: true, data: event });
});

// POST /api/events - Create a new event
router.post("/", (req, res) => {
  const { title, category, description, date, timeSlot, time, venue, venueCapacity, smsPriority } = req.body;
  if (!title || !category || !venue || !venueCapacity) {
    return res.status(400).json({ success: false, error: "Missing required event fields" });
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
    organizer: "Strathmore University",
    createdAt: new Date().toISOString()
  };

  db.events.unshift(newEvent);
  writeLocalData(db);

  res.status(201).json({ success: true, message: "Event created successfully", data: newEvent });
});

// PUT /api/events/:id - Update event details
router.put("/:id", (req, res) => {
  const db = readLocalData();
  const index = db.events.findIndex((e) => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: "Event not found" });
  }

  db.events[index] = { ...db.events[index], ...req.body, id: req.params.id };
  writeLocalData(db);

  res.json({ success: true, message: "Event updated", data: db.events[index] });
});

// DELETE /api/events/:id - Delete an event
router.delete("/:id", (req, res) => {
  const db = readLocalData();
  const index = db.events.findIndex((e) => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: "Event not found" });
  }

  const deleted = db.events.splice(index, 1);
  writeLocalData(db);

  res.json({ success: true, message: "Event deleted", data: deleted[0] });
});

module.exports = router;
