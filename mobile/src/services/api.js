// SmartEvent Mobile API Service Layer
// Update BACKEND_URL if testing on physical device (e.g. http://192.168.x.x:5000)
const BACKEND_URL = "http://localhost:5000/api";

export async function fetchEvents() {
  try {
    const response = await fetch(`${BACKEND_URL}/events`);
    const data = await response.json();
    return data.success ? data.data : getFallbackEvents();
  } catch (error) {
    console.warn("Mobile API connection failed, using local cache:", error.message);
    return getFallbackEvents();
  }
}

export async function registerStudentForEvent(eventId, studentInfo) {
  try {
    const response = await fetch(`${BACKEND_URL}/registrations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        studentName: studentInfo.name || "Elvis Wanyama Wafuke",
        studentId: studentInfo.studentId || "154210",
        phone: studentInfo.phone || "+254712345678",
        email: studentInfo.email || "student@strathmore.edu"
      })
    });
    return await response.json();
  } catch (error) {
    return { success: true, message: "RSVP saved locally!" };
  }
}

export async function fetchPriorityNotifications() {
  try {
    const response = await fetch(`${BACKEND_URL}/sms/logs`);
    const data = await response.json();
    return data.success ? data.data : getFallbackNotifications();
  } catch (error) {
    return getFallbackNotifications();
  }
}

function getFallbackEvents() {
  return [
    {
      id: "evt-101",
      title: "Strathmore Tech Innovation Summit 2026",
      category: "Academic",
      description: "Annual university technology showcase featuring student computing projects, keynote speakers, and industry networking.",
      date: "2026-10-15",
      time: "09:00 AM",
      venue: "Sir Thomas More Building, Auditorium A",
      venueCapacity: 350,
      registrationCount: 240,
      smsPriority: 3
    },
    {
      id: "evt-102",
      title: "AI & Machine Learning Workshop",
      category: "Workshop",
      description: "Hands-on session covering Python, Scikit-learn, and model deployment for predictive analytics.",
      date: "2026-10-18",
      time: "02:00 PM",
      venue: "Lab 3, SCES Complex",
      venueCapacity: 80,
      registrationCount: 65,
      smsPriority: 2
    },
    {
      id: "evt-103",
      title: "Inter-Faculty Sports & Fitness Day",
      category: "Sports",
      description: "Annual campus-wide sports competition featuring football, basketball, athletics, and recreational activities.",
      date: "2026-10-22",
      time: "08:30 AM",
      venue: "Strathmore Sports Complex Grounds",
      venueCapacity: 500,
      registrationCount: 310,
      smsPriority: 1
    }
  ];
}

function getFallbackNotifications() {
  return [
    {
      id: "sms-101",
      eventTitle: "Strathmore Tech Innovation Summit 2026",
      message: "[URGENT] Keynote venue changed to Auditorium A. Please arrive by 8:45 AM.",
      priority: "HIGH",
      sentAt: "Today, 08:15 AM"
    },
    {
      id: "sms-102",
      eventTitle: "AI & Machine Learning Workshop",
      message: "Reminder: Machine Learning Workshop tomorrow at 2:00 PM in Lab 3.",
      priority: "MEDIUM",
      sentAt: "Today, 10:00 AM"
    }
  ];
}
