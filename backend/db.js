const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

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
  console.log("[SmartEvent DB] Firebase initialized in local persistent database mode:", e.message);
}

const DATA_FILE = path.join(__dirname, 'data.json');
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync('password123', 10);

function buildDefaultData() {
  const users = [
    // ================= 2 SYSTEM ADMINISTRATORS =================
    {
      id: "usr-admin-1",
      name: "Elvis Wanyama Wafuke (Admin)",
      email: "admin@strathmore.edu",
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: "admin",
      adminCode: "ADM-001",
      phone: "+254712345678",
      department: "ICT Infrastructure & Enterprise Systems",
      status: "Active",
      authProvider: "local+google",
      createdAt: "2026-08-01T08:00:00Z"
    },
    {
      id: "usr-admin-2",
      name: "Mr. Allan Vikiru",
      email: "allan.vikiru@strathmore.edu",
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: "admin",
      adminCode: "ADM-002",
      phone: "+254720998811",
      department: "School of Computing & Engineering Sciences (Supervisor)",
      status: "Active",
      authProvider: "local+google",
      createdAt: "2026-08-01T08:30:00Z"
    },

    // ================= 4 EVENT ORGANIZERS =================
    {
      id: "usr-org-1",
      name: "Dr. Joseph Orero (SCES Dean's Office)",
      email: "organizer@strathmore.edu",
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: "organizer",
      organizerCode: "ORG-001",
      phone: "+254721001122",
      department: "School of Computing & Engineering Sciences",
      organizationName: "SCES Faculty Events Board",
      status: "Active",
      authProvider: "local+google",
      createdAt: "2026-08-05T09:00:00Z"
    },
    {
      id: "usr-org-2",
      name: "@iLabAfrica Innovation Centre",
      email: "ilab@strathmore.edu",
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: "organizer",
      organizerCode: "ORG-002",
      phone: "+254722334455",
      department: "Directorate of Research & Tech Innovation",
      organizationName: "@iLabAfrica Research & Incubation Hub",
      status: "Active",
      authProvider: "local+google",
      createdAt: "2026-08-06T10:15:00Z"
    },
    {
      id: "usr-org-3",
      name: "Strathmore Career Development Services",
      email: "careers@strathmore.edu",
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: "organizer",
      organizerCode: "ORG-003",
      phone: "+254733556677",
      department: "Career Placement & Industry Relations",
      organizationName: "Strathmore Career Services Office",
      status: "Active",
      authProvider: "local+google",
      createdAt: "2026-08-08T11:00:00Z"
    },
    {
      id: "usr-org-4",
      name: "Strathmore Sports & Athletics Council",
      email: "sports@strathmore.edu",
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: "organizer",
      organizerCode: "ORG-004",
      phone: "+254710887766",
      department: "Sports & Student Welfare Department",
      organizationName: "Strathmore Blades & Scorpions Athletics",
      status: "Active",
      authProvider: "local+google",
      createdAt: "2026-08-10T12:00:00Z"
    },

    // ================= 6 STUDENTS =================
    {
      id: "usr-stud-1",
      name: "Elvis Wanyama Wafuke",
      email: "student@strathmore.edu",
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: "student",
      studentId: "154210",
      phone: "+254712345678",
      department: "BSc Informatics & Computer Science",
      yearOfStudy: 4,
      status: "Active",
      authProvider: "local+google",
      createdAt: "2026-08-15T09:00:00Z"
    },
    {
      id: "usr-stud-2",
      name: "Amina Hassan",
      email: "amina.hassan@strathmore.edu",
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: "student",
      studentId: "154382",
      phone: "+254722112233",
      department: "BSc Computer Networks & Cyber Security",
      yearOfStudy: 3,
      status: "Active",
      authProvider: "local+google",
      createdAt: "2026-08-16T10:20:00Z"
    },
    {
      id: "usr-stud-3",
      name: "Kevin Otieno",
      email: "kevin.otieno@strathmore.edu",
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: "student",
      studentId: "153910",
      phone: "+254733445566",
      department: "BSc Business Information Technology (BBIT)",
      yearOfStudy: 4,
      status: "Active",
      authProvider: "local+google",
      createdAt: "2026-08-17T11:45:00Z"
    },
    {
      id: "usr-stud-4",
      name: "Grace Wanjiku",
      email: "grace.wanjiku@strathmore.edu",
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: "student",
      studentId: "155104",
      phone: "+254711998877",
      department: "BSc Informatics & Computer Science",
      yearOfStudy: 2,
      status: "Active",
      authProvider: "local+google",
      createdAt: "2026-08-18T14:10:00Z"
    },
    {
      id: "usr-stud-5",
      name: "Brian Kiprop",
      email: "brian.kiprop@strathmore.edu",
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: "student",
      studentId: "154890",
      phone: "+254745667788",
      department: "BSc Telecommunications & Electrical Engineering",
      yearOfStudy: 3,
      status: "Active",
      authProvider: "local+google",
      createdAt: "2026-08-19T15:30:00Z"
    },
    {
      id: "usr-stud-6",
      name: "Faith Mutua",
      email: "faith.mutua@strathmore.edu",
      passwordHash: DEFAULT_PASSWORD_HASH,
      role: "student",
      studentId: "155220",
      phone: "+254701234567",
      department: "Bachelor of Financial Services",
      yearOfStudy: 1,
      status: "Active",
      authProvider: "local+google",
      createdAt: "2026-08-20T16:00:00Z"
    }
  ];

  const admin_profiles = [
    {
      id: "adm-prof-1",
      userId: "usr-admin-1",
      adminCode: "ADM-001",
      name: "Elvis Wanyama Wafuke (Admin)",
      email: "admin@strathmore.edu",
      roleTitle: "Chief ICT Systems Administrator",
      clearanceLevel: "SUPER_ADMIN",
      office: "Central Building, Room CB-204",
      phone: "+254712345678",
      permissions: ["MANAGE_USERS", "MANAGE_EVENTS", "MANAGE_CATEGORIES", "SMS_BROADCAST", "DB_CONSOLE"]
    },
    {
      id: "adm-prof-2",
      userId: "usr-admin-2",
      adminCode: "ADM-002",
      name: "Mr. Allan Vikiru",
      email: "allan.vikiru@strathmore.edu",
      roleTitle: "Project Supervisor & Senior Systems Admin",
      clearanceLevel: "SUPER_ADMIN",
      office: "SCES Complex, Faculty Wing 3",
      phone: "+254720998811",
      permissions: ["MANAGE_USERS", "MANAGE_EVENTS", "MANAGE_CATEGORIES", "SMS_BROADCAST", "DB_CONSOLE"]
    }
  ];

  const organizer_profiles = [
    {
      id: "org-prof-1",
      userId: "usr-org-1",
      organizerCode: "ORG-001",
      name: "Dr. Joseph Orero (SCES Dean's Office)",
      email: "organizer@strathmore.edu",
      department: "School of Computing & Engineering Sciences",
      officeLocation: "SCES Complex, 2nd Floor",
      phone: "+254721001122",
      verified: true,
      eventsHostedCount: 14
    },
    {
      id: "org-prof-2",
      userId: "usr-org-2",
      organizerCode: "ORG-002",
      name: "@iLabAfrica Innovation Centre",
      email: "ilab@strathmore.edu",
      department: "Directorate of Research & Tech Innovation",
      officeLocation: "Student Centre Building, 4th Floor",
      phone: "+254722334455",
      verified: true,
      eventsHostedCount: 19
    },
    {
      id: "org-prof-3",
      userId: "usr-org-3",
      organizerCode: "ORG-003",
      name: "Strathmore Career Development Services",
      email: "careers@strathmore.edu",
      department: "Career Placement & Industry Relations",
      officeLocation: "Sir Thomas More Building, Ground Floor",
      phone: "+254733556677",
      verified: true,
      eventsHostedCount: 9
    },
    {
      id: "org-prof-4",
      userId: "usr-org-4",
      organizerCode: "ORG-004",
      name: "Strathmore Sports & Athletics Council",
      email: "sports@strathmore.edu",
      department: "Sports & Student Welfare Department",
      officeLocation: "Strathmore Sports Complex Pavilion",
      phone: "+254710887766",
      verified: true,
      eventsHostedCount: 11
    }
  ];

  const student_profiles = [
    {
      id: "stud-prof-1",
      userId: "usr-stud-1",
      studentId: "154210",
      name: "Elvis Wanyama Wafuke",
      email: "student@strathmore.edu",
      program: "BSc Informatics & Computer Science",
      faculty: "SCES",
      yearOfStudy: 4,
      phone: "+254712345678",
      hostelResident: false,
      pastAttendanceRate: 0.88
    },
    {
      id: "stud-prof-2",
      userId: "usr-stud-2",
      studentId: "154382",
      name: "Amina Hassan",
      email: "amina.hassan@strathmore.edu",
      program: "BSc Computer Networks & Cyber Security",
      faculty: "SCES",
      yearOfStudy: 3,
      phone: "+254722112233",
      hostelResident: true,
      pastAttendanceRate: 0.91
    },
    {
      id: "stud-prof-3",
      userId: "usr-stud-3",
      studentId: "153910",
      name: "Kevin Otieno",
      email: "kevin.otieno@strathmore.edu",
      program: "BSc Business Information Technology",
      faculty: "SCES",
      yearOfStudy: 4,
      phone: "+254733445566",
      hostelResident: false,
      pastAttendanceRate: 0.79
    },
    {
      id: "stud-prof-4",
      userId: "usr-stud-4",
      studentId: "155104",
      name: "Grace Wanjiku",
      email: "grace.wanjiku@strathmore.edu",
      program: "BSc Informatics & Computer Science",
      faculty: "SCES",
      yearOfStudy: 2,
      phone: "+254711998877",
      hostelResident: true,
      pastAttendanceRate: 0.84
    },
    {
      id: "stud-prof-5",
      userId: "usr-stud-5",
      studentId: "154890",
      name: "Brian Kiprop",
      email: "brian.kiprop@strathmore.edu",
      program: "BSc Telecommunications & Electrical Engineering",
      faculty: "SCES",
      yearOfStudy: 3,
      phone: "+254745667788",
      hostelResident: false,
      pastAttendanceRate: 0.76
    },
    {
      id: "stud-prof-6",
      userId: "usr-stud-6",
      studentId: "155220",
      name: "Faith Mutua",
      email: "faith.mutua@strathmore.edu",
      program: "Bachelor of Financial Services",
      faculty: "SIMS",
      yearOfStudy: 1,
      phone: "+254701234567",
      hostelResident: true,
      pastAttendanceRate: 0.86
    }
  ];

  const categories = [
    { id: "cat-1", name: "Academic", description: "Conferences, symposia, research showcases, and faculty lectures", icon: "BookOpen", count: 14 },
    { id: "cat-2", name: "Workshop", description: "Hands-on technical coding sessions, AI labs, and skills training", icon: "Code", count: 11 },
    { id: "cat-3", name: "Seminar", description: "Industry expert panels, cybersecurity talks, and keynote sessions", icon: "Users", count: 8 },
    { id: "cat-4", name: "Career Fair", description: "Corporate recruitment drives, CV clinics, and internship networking", icon: "Briefcase", count: 6 },
    { id: "cat-5", name: "Sports", description: "Inter-faculty tournaments, athletics, basketball, and rugby 7s", icon: "Trophy", count: 9 },
    { id: "cat-6", name: "Club Activity", description: "Student club hackathons, debate nights, and cultural showcases", icon: "Film", count: 10 }
  ];

  const venues = [
    { id: "ven-1", name: "Sir Thomas More Building, Auditorium A", building: "STM Building", capacity: 350, equipment: "4K Projector, Dual Mic PA, Live Stream" },
    { id: "ven-2", name: "Lab 3, SCES Complex", building: "SCES Complex", capacity: 80, equipment: "80 Workstations, High-Speed Fiber, Smartboard" },
    { id: "ven-3", name: "Student Centre Main Hall", building: "Student Centre", capacity: 400, equipment: "Exhibition Booths, Stage Lighting, PA System" },
    { id: "ven-4", name: "MSB Lecture Theatre 2", building: "Management Science Bldg", capacity: 150, equipment: "Tiered Seating, Smart Podium, Recording System" },
    { id: "ven-5", name: "Strathmore Sports Complex Grounds", building: "Sports Complex", capacity: 500, equipment: "Floodlights, Scoreboard, First-Aid Tent" },
    { id: "ven-6", name: "@iLabAfrica Innovation Boardroom", building: "Student Centre 4th Flr", capacity: 120, equipment: "Video Conferencing, Whiteboards, Cloud Lab" }
  ];

  const events = [
    {
      id: "evt-101",
      title: "Strathmore Tech Innovation Summit 2026",
      category: "Academic",
      description: "Annual university technology and computing project showcase featuring final-year BSc ICS & BBIT capstone demonstrations, keynote speakers, and industry partner networking.",
      date: "2026-10-25",
      timeSlot: "Morning",
      time: "09:00 AM",
      venue: "Sir Thomas More Building, Auditorium A",
      venueCapacity: 350,
      registrationCount: 284,
      pastAttendanceRate: 0.84,
      predictedAttendance: 242,
      smsPriority: 3,
      status: "Upcoming",
      featured: true,
      organizer: "Dr. Joseph Orero (SCES Dean's Office)",
      organizerId: "usr-org-1",
      createdAt: "2026-09-20T10:00:00Z"
    },
    {
      id: "evt-102",
      title: "AI & Logistic Regression ML Workshop",
      category: "Workshop",
      description: "Hands-on lab session covering data cleaning, synthetic university dataset generation, Scikit-learn pipelines, and attendance prediction deployment.",
      date: "2026-10-28",
      timeSlot: "Afternoon",
      time: "02:00 PM",
      venue: "Lab 3, SCES Complex",
      venueCapacity: 80,
      registrationCount: 68,
      pastAttendanceRate: 0.82,
      predictedAttendance: 58,
      smsPriority: 3,
      status: "Upcoming",
      featured: true,
      organizer: "@iLabAfrica Innovation Centre",
      organizerId: "usr-org-2",
      createdAt: "2026-09-21T14:30:00Z"
    },
    {
      id: "evt-103",
      title: "Annual Graduate Career & Internship Fair 2026",
      category: "Career Fair",
      description: "Meet 40+ top employers in software engineering, banking, fintech, consulting, and telecommunications recruiting Strathmore students for internships and graduate roles.",
      date: "2026-11-02",
      timeSlot: "Morning",
      time: "10:00 AM",
      venue: "Student Centre Main Hall",
      venueCapacity: 400,
      registrationCount: 335,
      pastAttendanceRate: 0.86,
      predictedAttendance: 291,
      smsPriority: 3,
      status: "Upcoming",
      featured: true,
      organizer: "Strathmore Career Development Services",
      organizerId: "usr-org-3",
      createdAt: "2026-09-23T09:00:00Z"
    },
    {
      id: "evt-104",
      title: "Zero-Trust Cybersecurity & Cloud FinTech Seminar",
      category: "Seminar",
      description: "Industry guest lecture by leading East African CISOs on securing mobile money APIs, cloud infrastructure resilience, and AI threat detection.",
      date: "2026-11-05",
      timeSlot: "Afternoon",
      time: "04:00 PM",
      venue: "MSB Lecture Theatre 2",
      venueCapacity: 150,
      registrationCount: 118,
      pastAttendanceRate: 0.78,
      predictedAttendance: 96,
      smsPriority: 2,
      status: "Upcoming",
      featured: false,
      organizer: "@iLabAfrica Innovation Centre",
      organizerId: "usr-org-2",
      createdAt: "2026-09-25T11:20:00Z"
    },
    {
      id: "evt-105",
      title: "Inter-Faculty Sports & Fitness Championship",
      category: "Sports",
      description: "Annual campus-wide sports tournament featuring SCES, SIMS, SLS, and SBS teams competing in football, basketball, rugby 7s, and track relays.",
      date: "2026-11-08",
      timeSlot: "Morning",
      time: "08:30 AM",
      venue: "Strathmore Sports Complex Grounds",
      venueCapacity: 500,
      registrationCount: 365,
      pastAttendanceRate: 0.85,
      predictedAttendance: 312,
      smsPriority: 2,
      status: "Upcoming",
      featured: false,
      organizer: "Strathmore Sports & Athletics Council",
      organizerId: "usr-org-4",
      createdAt: "2026-09-26T09:15:00Z"
    },
    {
      id: "evt-106",
      title: "Africa's Talking Developer & IoT Hackathon",
      category: "Club Activity",
      description: "24-hour student buildathon building USSD, Priority SMS, Voice, and Airtime APIs for campus and community impact.",
      date: "2026-11-12",
      timeSlot: "Morning",
      time: "09:00 AM",
      venue: "@iLabAfrica Innovation Boardroom",
      venueCapacity: 120,
      registrationCount: 108,
      pastAttendanceRate: 0.88,
      predictedAttendance: 95,
      smsPriority: 3,
      status: "Upcoming",
      featured: true,
      organizer: "@iLabAfrica Innovation Centre",
      organizerId: "usr-org-2",
      createdAt: "2026-09-28T13:00:00Z"
    },
    {
      id: "evt-107",
      title: "Final Year IS Project Proposal & Defense Clinic",
      category: "Academic",
      description: "Mandatory academic preparation session for 4th-year Informatics & Computer Science students covering system architecture, ML validation, and defense presentation skills.",
      date: "2026-11-15",
      timeSlot: "Afternoon",
      time: "02:30 PM",
      venue: "Sir Thomas More Building, Auditorium A",
      venueCapacity: 350,
      registrationCount: 210,
      pastAttendanceRate: 0.91,
      predictedAttendance: 192,
      smsPriority: 3,
      status: "Upcoming",
      featured: false,
      organizer: "Dr. Joseph Orero (SCES Dean's Office)",
      organizerId: "usr-org-1",
      createdAt: "2026-10-01T10:00:00Z"
    },
    {
      id: "evt-108",
      title: "Quantitative Finance & Actuarial Modelling Seminar",
      category: "Seminar",
      description: "Joint SCES & SIMS seminar exploring algorithmic trading, credit risk scoring with logistic regression, and Nairobi Securities Exchange analytics.",
      date: "2026-11-19",
      timeSlot: "Evening",
      time: "05:30 PM",
      venue: "MSB Lecture Theatre 2",
      venueCapacity: 150,
      registrationCount: 88,
      pastAttendanceRate: 0.72,
      predictedAttendance: 64,
      smsPriority: 2,
      status: "Upcoming",
      featured: false,
      organizer: "Strathmore Career Development Services",
      organizerId: "usr-org-3",
      createdAt: "2026-10-03T15:00:00Z"
    }
  ];

  const registrations = [
    {
      id: "reg-1001",
      eventId: "evt-101",
      eventTitle: "Strathmore Tech Innovation Summit 2026",
      userId: "usr-stud-1",
      studentName: "Elvis Wanyama Wafuke",
      studentId: "154210",
      phone: "+254712345678",
      email: "student@strathmore.edu",
      status: "Confirmed",
      registeredAt: "2026-10-01T09:30:00Z"
    },
    {
      id: "reg-1002",
      eventId: "evt-102",
      eventTitle: "AI & Logistic Regression ML Workshop",
      userId: "usr-stud-1",
      studentName: "Elvis Wanyama Wafuke",
      studentId: "154210",
      phone: "+254712345678",
      email: "student@strathmore.edu",
      status: "Confirmed",
      registeredAt: "2026-10-02T11:15:00Z"
    },
    {
      id: "reg-1003",
      eventId: "evt-106",
      eventTitle: "Africa's Talking Developer & IoT Hackathon",
      userId: "usr-stud-1",
      studentName: "Elvis Wanyama Wafuke",
      studentId: "154210",
      phone: "+254712345678",
      email: "student@strathmore.edu",
      status: "Confirmed",
      registeredAt: "2026-10-03T14:00:00Z"
    },
    {
      id: "reg-1004",
      eventId: "evt-101",
      eventTitle: "Strathmore Tech Innovation Summit 2026",
      userId: "usr-stud-2",
      studentName: "Amina Hassan",
      studentId: "154382",
      phone: "+254722112233",
      email: "amina.hassan@strathmore.edu",
      status: "Confirmed",
      registeredAt: "2026-10-03T16:20:00Z"
    },
    {
      id: "reg-1005",
      eventId: "evt-102",
      eventTitle: "AI & Logistic Regression ML Workshop",
      userId: "usr-stud-2",
      studentName: "Amina Hassan",
      studentId: "154382",
      phone: "+254722112233",
      email: "amina.hassan@strathmore.edu",
      status: "Confirmed",
      registeredAt: "2026-10-04T08:45:00Z"
    },
    {
      id: "reg-1006",
      eventId: "evt-103",
      eventTitle: "Annual Graduate Career & Internship Fair 2026",
      userId: "usr-stud-3",
      studentName: "Kevin Otieno",
      studentId: "153910",
      phone: "+254733445566",
      email: "kevin.otieno@strathmore.edu",
      status: "Confirmed",
      registeredAt: "2026-10-05T10:10:00Z"
    },
    {
      id: "reg-1007",
      eventId: "evt-104",
      eventTitle: "Zero-Trust Cybersecurity & Cloud FinTech Seminar",
      userId: "usr-stud-4",
      studentName: "Grace Wanjiku",
      studentId: "155104",
      phone: "+254711998877",
      email: "grace.wanjiku@strathmore.edu",
      status: "Confirmed",
      registeredAt: "2026-10-06T12:30:00Z"
    },
    {
      id: "reg-1008",
      eventId: "evt-105",
      eventTitle: "Inter-Faculty Sports & Fitness Championship",
      userId: "usr-stud-5",
      studentName: "Brian Kiprop",
      studentId: "154890",
      phone: "+254745667788",
      email: "brian.kiprop@strathmore.edu",
      status: "Confirmed",
      registeredAt: "2026-10-07T15:00:00Z"
    },
    {
      id: "reg-1009",
      eventId: "evt-103",
      eventTitle: "Annual Graduate Career & Internship Fair 2026",
      userId: "usr-stud-6",
      studentName: "Faith Mutua",
      studentId: "155220",
      phone: "+254701234567",
      email: "faith.mutua@strathmore.edu",
      status: "Confirmed",
      registeredAt: "2026-10-08T09:15:00Z"
    }
  ];

  const smsLogs = [
    {
      id: "sms-101",
      eventId: "evt-101",
      eventTitle: "Strathmore Tech Innovation Summit 2026",
      recipient: "+254712345678",
      recipientName: "Elvis Wanyama Wafuke",
      message: "[HIGH PRIORITY] Keynote venue confirmed at Auditorium A (Sir Thomas More Bldg). Doors open at 8:30 AM. Show your SmartEvent RSVP pass.",
      priority: "HIGH",
      priorityLevel: 3,
      status: "DELIVERED",
      messageId: "ATXid_98234109283401",
      gatewayResponse: "Success (Africa's Talking Gateway)",
      cost: "KES 0.80",
      sentAt: "2026-10-18T08:15:00Z"
    },
    {
      id: "sms-102",
      eventId: "evt-102",
      eventTitle: "AI & Logistic Regression ML Workshop",
      recipient: "+254722112233",
      recipientName: "Amina Hassan",
      message: "[HIGH PRIORITY] Lab 3 capacity is 85% full! Please bring your laptop with Python 3.11+ & Scikit-learn installed.",
      priority: "HIGH",
      priorityLevel: 3,
      status: "DELIVERED",
      messageId: "ATXid_98234109283402",
      gatewayResponse: "Success (Africa's Talking Gateway)",
      cost: "KES 0.80",
      sentAt: "2026-10-18T10:30:00Z"
    },
    {
      id: "sms-103",
      eventId: "evt-103",
      eventTitle: "Annual Graduate Career & Internship Fair 2026",
      recipient: "+254733445566",
      recipientName: "Kevin Otieno",
      message: "[MEDIUM PRIORITY] Reminder: Upload your updated CV to the Strathmore Career Portal before the Graduate Fair on 2nd Nov.",
      priority: "MEDIUM",
      priorityLevel: 2,
      status: "DELIVERED",
      messageId: "ATXid_98234109283403",
      gatewayResponse: "Success (Africa's Talking Gateway)",
      cost: "KES 0.80",
      sentAt: "2026-10-19T14:20:00Z"
    },
    {
      id: "sms-104",
      eventId: "evt-106",
      eventTitle: "Africa's Talking Developer & IoT Hackathon",
      recipient: "+254712345678",
      recipientName: "Elvis Wanyama Wafuke",
      message: "[HIGH PRIORITY] Your Africa's Talking Sandbox API key & hackathon team table (#T-04) have been provisioned.",
      priority: "HIGH",
      priorityLevel: 3,
      status: "DELIVERED",
      messageId: "ATXid_98234109283404",
      gatewayResponse: "Success (Africa's Talking Gateway)",
      cost: "KES 0.80",
      sentAt: "2026-10-20T09:00:00Z"
    },
    {
      id: "sms-105",
      eventId: "evt-105",
      eventTitle: "Inter-Faculty Sports & Fitness Championship",
      recipient: "+254745667788",
      recipientName: "Brian Kiprop",
      message: "[LOW PRIORITY] SCES Football & Basketball team warmups start at 8:00 AM at the Sports Complex Grounds.",
      priority: "LOW",
      priorityLevel: 1,
      status: "DELIVERED",
      messageId: "ATXid_98234109283405",
      gatewayResponse: "Success (Africa's Talking Gateway)",
      cost: "KES 0.80",
      sentAt: "2026-10-20T16:45:00Z"
    }
  ];

  const favorites = {
    "usr-stud-1": ["evt-101", "evt-102", "evt-106"],
    "usr-stud-2": ["evt-102", "evt-104"]
  };

  return {
    users,
    admin_profiles,
    organizer_profiles,
    student_profiles,
    categories,
    venues,
    events,
    registrations,
    smsLogs,
    favorites
  };
}

function ensureCompleteSeedData(data) {
  const defaults = buildDefaultData();
  let modified = false;

  // Ensure all relational tables exist and have the rich seed records
  for (const key of Object.keys(defaults)) {
    if (!data[key] || (Array.isArray(data[key]) && data[key].length < defaults[key].length)) {
      if (Array.isArray(defaults[key])) {
        const existingIds = new Set((data[key] || []).map(item => item.id));
        const merged = [...(data[key] || [])];
        for (const seedItem of defaults[key]) {
          if (!existingIds.has(seedItem.id)) {
            merged.push(seedItem);
          }
        }
        data[key] = merged;
      } else {
        data[key] = { ...defaults[key], ...(data[key] || {}) };
      }
      modified = true;
    }
  }

  return { data, modified };
}

function readLocalData() {
  if (!fs.existsSync(DATA_FILE)) {
    const initial = buildDefaultData();
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    const { data, modified } = ensureCompleteSeedData(parsed);
    if (modified) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    }
    return data;
  } catch (e) {
    const initial = buildDefaultData();
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    return initial;
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
  writeLocalData,
  buildDefaultData
};
