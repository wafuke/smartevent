const express = require("express");
const axios = require("axios");

const router = express.Router();

// POST /api/predict
// Body: the same feature fields your model was trained on, e.g.
// { eventType, dayOfWeek, timeSlot, pastAttendanceRate, registrationCount, smsSent }
router.post("/", async (req, res) => {
  try {
    const mlServiceUrl = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";
    const response = await axios.post(`${mlServiceUrl}/predict`, req.body);
    res.json(response.data);
  } catch (err) {
    console.error("Prediction request failed:", err.message);
    res.status(502).json({ error: "ML service unavailable", detail: err.message });
  }
});

module.exports = router;
