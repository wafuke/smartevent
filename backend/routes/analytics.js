const express = require("express");
const router = express.Router();

// GET /api/analytics - Summary metrics for dashboard graphs
router.get("/", (req, res) => {
  const summary = {
    totalEvents: 12,
    activeEvents: 3,
    totalRegistrations: 615,
    averageTurnoutRate: 79.4,
    mlAccuracyScore: "91.2%",
    smsStats: {
      totalSent: 1420,
      highPriority: 480,
      mediumPriority: 650,
      lowPriority: 290,
      deliverySuccessRate: "98.6%"
    },
    categoryBreakdown: [
      { name: "Academic", events: 4, avgAttendance: 210 },
      { name: "Workshops", events: 3, avgAttendance: 75 },
      { name: "Seminars", events: 2, avgAttendance: 110 },
      { name: "Sports & Social", events: 2, avgAttendance: 340 },
      { name: "Career Fairs", events: 1, avgAttendance: 450 }
    ],
    predictedVsActual: [
      { month: "May", registered: 420, predicted: 340, actual: 335 },
      { month: "Jun", registered: 510, predicted: 410, actual: 425 },
      { month: "Jul", registered: 380, predicted: 300, actual: 295 },
      { month: "Aug", registered: 600, predicted: 490, actual: 485 },
      { month: "Sep", registered: 615, predicted: 492, actual: 490 }
    ]
  };

  res.json({ success: true, data: summary });
});

module.exports = router;
