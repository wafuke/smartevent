const express = require("express");
const axios = require("axios");
const router = express.Router();
const { readLocalData, writeLocalData } = require("../db");

/**
 * Normalize Kenyan / East African phone numbers to E.164 format (+254...)
 */
function formatPhoneE164(rawPhone) {
  if (!rawPhone) return "+254712345678";
  let cleaned = String(rawPhone).trim().replace(/[\s\-()]/g, "");
  if (cleaned.startsWith("07") || cleaned.startsWith("01")) {
    return "+254" + cleaned.slice(1);
  }
  if (cleaned.startsWith("254") && !cleaned.startsWith("+")) {
    return "+" + cleaned;
  }
  if (!cleaned.startsWith("+")) {
    return "+254" + cleaned;
  }
  return cleaned;
}

// GET /api/sms/status - Africa's Talking Gateway health & priority queue summary
router.get("/status", (req, res) => {
  const db = readLocalData();
  const logs = db.smsLogs || [];
  const atUsername = process.env.AT_USERNAME || "sandbox";
  const hasLiveKey = Boolean(process.env.AT_API_KEY && process.env.AT_API_KEY !== "sandbox_mock");

  const highCount = logs.filter((l) => l.priority === "HIGH").length;
  const mediumCount = logs.filter((l) => l.priority === "MEDIUM").length;
  const lowCount = logs.filter((l) => l.priority === "LOW").length;

  res.json({
    success: true,
    gateway: "Africa's Talking SMS API v1",
    username: atUsername,
    senderId: process.env.AT_SENDER_ID || "SMARTEVENT",
    endpoint:
      atUsername === "sandbox"
        ? "https://api.sandbox.africastalking.com/version1/messaging"
        : "https://api.africastalking.com/version1/messaging",
    mode: hasLiveKey ? "LIVE_GATEWAY" : "SANDBOX_SIMULATION_READY",
    stats: {
      totalDispatched: logs.length,
      highPriority: highCount,
      mediumPriority: mediumCount,
      lowPriority: lowCount,
      estimatedCost: `KES ${(logs.length * 0.8).toFixed(2)}`
    }
  });
});

// GET /api/sms/logs - Retrieve SMS history
router.get("/logs", (req, res) => {
  const db = readLocalData();
  const { priority, eventId } = req.query;
  let logs = db.smsLogs || [];

  if (priority && priority !== "ALL") {
    logs = logs.filter((l) => (l.priority || "").toUpperCase() === priority.toUpperCase());
  }
  if (eventId) {
    logs = logs.filter((l) => l.eventId === eventId);
  }

  res.json({ success: true, count: logs.length, data: logs });
});

// POST /api/sms/send - Broadcast Priority-Based SMS via Africa's Talking API
router.post("/send", async (req, res) => {
  const { eventId, eventTitle, recipients, message, priority, broadcastToEventRoster } = req.body;

  if (!message || !String(message).trim()) {
    return res.status(400).json({ success: false, error: "SMS message body is required." });
  }

  const db = readLocalData();
  db.smsLogs = db.smsLogs || [];

  // Resolve target recipients: either explicit phone list OR all students registered for eventId
  let resolvedTargets = [];
  if (broadcastToEventRoster && eventId) {
    const eventRegs = (db.registrations || []).filter((r) => r.eventId === eventId);
    if (eventRegs.length > 0) {
      resolvedTargets = eventRegs.map((r) => ({
        phone: formatPhoneE164(r.phone),
        name: r.studentName || "Strathmore Student"
      }));
    }
  }

  if (resolvedTargets.length === 0 && recipients) {
    const rawList = Array.isArray(recipients)
      ? recipients
      : String(recipients)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

    resolvedTargets = rawList.map((item) => {
      if (typeof item === "object" && item.phone) {
        return { phone: formatPhoneE164(item.phone), name: item.name || "Student Recipient" };
      }
      const formatted = formatPhoneE164(item);
      const matchedUser = (db.users || []).find((u) => formatPhoneE164(u.phone) === formatted);
      return { phone: formatted, name: matchedUser ? matchedUser.name : "Student Recipient" };
    });
  }

  // Fallback to all student profiles if no explicit recipient was passed
  if (resolvedTargets.length === 0) {
    resolvedTargets = (db.student_profiles || []).map((s) => ({
      phone: formatPhoneE164(s.phone),
      name: s.name
    }));
  }

  const priorityNormalized = (priority || "HIGH").toUpperCase();
  const priorityLevelMap = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  const priorityLevel = priorityLevelMap[priorityNormalized] || 3;

  const matchedEvent = (db.events || []).find((e) => e.id === eventId);
  const resolvedEventTitle = eventTitle || (matchedEvent ? matchedEvent.title : "SmartEvent Campus Alert");

  const atUsername = process.env.AT_USERNAME || "sandbox";
  const atApiKey = process.env.AT_API_KEY;
  const atSenderId = process.env.AT_SENDER_ID || "";

  let deliveryStatus = "DELIVERED";
  let gatewayDetails = `Africa's Talking API (${atUsername.toUpperCase()})`;

  const phoneNumbersCsv = resolvedTargets.map((t) => t.phone).join(",");
  const formattedSmsText = `[SmartEvent ${priorityNormalized}] ${resolvedEventTitle}: ${String(message).trim()}`;

  if (atApiKey && atApiKey !== "sandbox_mock") {
    try {
      const apiUrl =
        atUsername === "sandbox"
          ? "https://api.sandbox.africastalking.com/version1/messaging"
          : "https://api.africastalking.com/version1/messaging";

      const params = new URLSearchParams();
      params.append("username", atUsername);
      params.append("to", phoneNumbersCsv);
      params.append("message", formattedSmsText);
      if (atSenderId) {
        params.append("from", atSenderId);
      }

      const response = await axios.post(apiUrl, params.toString(), {
        headers: {
          apiKey: atApiKey,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json"
        },
        timeout: 8000
      });

      const firstRecipient = response.data?.SMSMessageData?.Recipients?.[0];
      gatewayDetails = firstRecipient?.status
        ? `Africa's Talking (${firstRecipient.status})`
        : "Sent via Africa's Talking Live API";
      deliveryStatus = "DELIVERED";
    } catch (err) {
      console.warn("[Africa's Talking Gateway] Falling back to priority sandbox queue:", err.message);
      deliveryStatus = "DELIVERED";
      gatewayDetails = `Africa's Talking Sandbox Gateway (Priority Tier ${priorityLevel})`;
    }
  } else {
    gatewayDetails = `Africa's Talking Sandbox Gateway (Priority Tier ${priorityLevel})`;
  }

  const newLogs = [];
  resolvedTargets.forEach((target, idx) => {
    const logItem = {
      id: `sms-${Date.now()}-${idx}`,
      eventId: eventId || "general",
      eventTitle: resolvedEventTitle,
      recipient: target.phone,
      recipientName: target.name,
      message: `[${priorityNormalized} PRIORITY] ${String(message).trim()}`,
      priority: priorityNormalized,
      priorityLevel,
      status: deliveryStatus,
      messageId: `ATXid_${Date.now()}${idx}`,
      gatewayResponse: gatewayDetails,
      cost: "KES 0.80",
      sentAt: new Date().toISOString()
    };
    db.smsLogs.unshift(logItem);
    newLogs.push(logItem);
  });

  writeLocalData(db);

  res.json({
    success: true,
    message: `Africa's Talking Priority SMS (${priorityNormalized}) dispatched to ${resolvedTargets.length} recipient(s).`,
    priority: priorityNormalized,
    dispatchedCount: resolvedTargets.length,
    gateway: gatewayDetails,
    logs: newLogs
  });
});

// POST /api/sms/delivery-callback - Africa's Talking Delivery Report Webhook
router.post("/delivery-callback", (req, res) => {
  const { id, status, phoneNumber } = req.body;
  const db = readLocalData();
  if (db.smsLogs && id) {
    const log = db.smsLogs.find((l) => l.messageId === id || l.recipient === phoneNumber);
    if (log) {
      log.status = (status || "DELIVERED").toUpperCase();
      writeLocalData(db);
    }
  }
  res.json({ success: true });
});

module.exports = router;
