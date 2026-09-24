const fs = require('fs');
const path = require('path');
let admin = null;
let firestoreDb = null;

// Attempt Firebase Admin Initialization
try {
  admin = require('firebase-admin');
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH && fs.existsSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)) {
    const serviceAccount = require(path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    firestoreDb = admin.firestore();
    console.log("[SmartEvent DB] Connected to Firebase Firestore");
  } else if (process.env.FIREBASE_CONFIG) {
    admin.initializeApp();
    firestoreDb = admin.firestore();
    console.log("[SmartEvent DB] Connected to Firebase Firestore using default credentials");
  }
} catch (e) {
  console.log("[SmartEvent DB] Firebase initialized in fallback local storage mode:", e.message);
}

// Fallback Local JSON Store
const DATA_FILE = path.join(__dirname, 'data.json');

const defaultData = {
  events: [
    {
      id: "evt-101",
      title: "Strathmore Tech Innovation Summit 2026",
      category: "Academic",
      description: "Annual university technology and computing project showcase featuring student capstone presentations, keynote speakers, and industry partner networking.",
      date: "2026-10-15",
      timeSlot: "Morning",
      time: "09:00 AM",
      venue: "Sir Thomas More Building, Auditorium A",
      venueCapacity: 350,
      registrationCount: 240,
      pastAttendanceRate: 0.82,
      predictedAttendance: 215,
      smsPriority: 3,
      status: "Upcoming",
      organizer: "School of Computing and Engineering Sciences",
      createdAt: "2026-09-20T10:00:00Z"
    },
    {
      id: "evt-102",
      title: "AI & Machine Learning Workshop",
      category: "Workshop",
      description: "Hands-on session covering Python, Scikit-learn, and model deployment for predictive analytics.",
      date: "2026-10-18",
      timeSlot: "Afternoon",
      time: "02:00 PM",
      venue: "Lab 3, SCES Complex",
      venueCapacity: 80,
      registrationCount: 65,
      pastAttendanceRate: 0.78,
      predictedAttendance: 56,
      smsPriority: 2,
      status: "Upcoming",
      organizer: "Strathmore Tech Club",
      createdAt: "2026-09-21T14:30:00Z"
    },
    {
      id: "evt-103",
      title: "Inter-Faculty Sports & Fitness Day",
      category: "Sports",
      description: "Annual campus-wide sports competition featuring football, basketball, athletics, and fun activities.",
      date: "2026-10-22",
      timeSlot: "Morning",
      time: "08:30 AM",
      venue: "Strathmore Sports Complex Grounds",
      venueCapacity: 500,
      registrationCount: 310,
      pastAttendanceRate: 0.85,
      predictedAttendance: 320,
      smsPriority: 1,
      status: "Upcoming",
      organizer: "Sports Department",
      createdAt: "2026-09-22T09:15:00Z"
    }
  ],
  registrations: [
    {
      id: "reg-1",
      eventId: "evt-101",
      studentName: "Elvis Wanyama Wafuke",
      studentId: "154210",
      phone: "+254712345678",
      email: "elvis.wafuke@strathmore.edu",
      registeredAt: "2026-09-21T09:30:00Z"
    }
  ],
  smsLogs: [
    {
      id: "sms-101",
      eventId: "evt-101",
      eventTitle: "Strathmore Tech Innovation Summit 2026",
      recipient: "+254712345678",
      message: "[URGENT] Keynote venue changed to Auditorium A. Please arrive by 8:45 AM.",
      priority: "HIGH",
      priorityLevel: 3,
      status: "DELIVERED",
      gatewayResponse: "Sent (Africa's Talking API)",
      cost: "KES 0.80",
      sentAt: "2026-09-24T08:15:00Z"
    }
  ]
};

function readLocalData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return defaultData;
  }
}

function writeLocalData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Error writing data file:", e.message);
  }
}

module.exports = {
  isFirestoreEnabled: () => !!firestoreDb,
  getFirestore: () => firestoreDb,
  readLocalData,
  writeLocalData
};
