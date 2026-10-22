const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

let firestoreDb = null;

try {
  const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
  if (fs.existsSync(serviceAccountPath)) {
    const admin = require('firebase-admin');
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    firestoreDb = admin.firestore();
    console.log("🔥 Connected to Firebase Firestore Database.");
  } else {
    console.log("ℹ️ No serviceAccountKey.json found. Using Local Persistent JSON Store (data.json).");
  }
} catch (error) {
  console.warn("⚠️ Firebase initialization skipped, falling back to local JSON store:", error.message);
}

const DATA_FILE = path.join(__dirname, 'data.json');

function buildDefaultData() {
  const defaultPasswordHash = bcrypt.hashSync('Strathmore@2026', 10);
  const legacyPasswordHash = bcrypt.hashSync('password123', 10);

  // ============================================================================
  // 1. USERS TABLE (22 Users: 2 Admins, 10 Organizers, 10 Students)
  // ============================================================================
  const users = [
    // --- 2 ADMIN ACCOUNTS ---
    {
      id: "usr-admin-1",
      name: "Elvis Wanyama Wafuke",
      email: "admin@strathmore.edu",
      passwordHash: legacyPasswordHash,
      role: "ADMIN",
      status: "Active",
      staffId: "ADM-001",
      phone: "+254712345678",
      department: "ICT & Campus Operations Directorate",
      clearanceLevel: "Super Admin",
      authProvider: "local,google",
      createdAt: "2026-08-01T08:00:00.000Z"
    },
    {
      id: "usr-admin-2",
      name: "Mr. Allan Vikiru",
      email: "allan.vikiru@strathmore.edu",
      passwordHash: legacyPasswordHash,
      role: "ADMIN",
      status: "Active",
      staffId: "ADM-002",
      phone: "+254722998877",
      department: "School of Computing & Engineering Sciences (SCES)",
      clearanceLevel: "Academic & System Auditor",
      authProvider: "local,google",
      createdAt: "2026-08-02T09:30:00.000Z"
    },

    // --- 10 EVENT ORGANIZER ACCOUNTS ---
    {
      id: "usr-org-1",
      name: "Dr. Joseph Orero (SCES Dean's Office)",
      email: "organizer@strathmore.edu",
      passwordHash: legacyPasswordHash,
      role: "ORGANIZER",
      status: "Active",
      organizerCode: "ORG-001",
      organizationName: "SCES Academic & Research Colloquium",
      department: "School of Computing & Engineering Sciences",
      phone: "+254711223344",
      verified: true,
      authProvider: "local,google",
      createdAt: "2026-08-10T10:15:00.000Z"
    },
    {
      id: "usr-org-2",
      name: "@iLabAfrica Innovation Centre",
      email: "ilab@strathmore.edu",
      passwordHash: legacyPasswordHash,
      role: "ORGANIZER",
      status: "Active",
      organizerCode: "ORG-002",
      organizationName: "@iLabAfrica Research & Incubation Hub",
      department: "Directorate of Research & Tech Innovation",
      phone: "+254722334455",
      verified: true,
      authProvider: "local,google",
      createdAt: "2026-08-12T11:00:00.000Z"
    },
    {
      id: "usr-org-3",
      name: "Strathmore Career Development Services",
      email: "careers@strathmore.edu",
      passwordHash: legacyPasswordHash,
      role: "ORGANIZER",
      status: "Active",
      organizerCode: "ORG-003",
      organizationName: "Strathmore Career & Industry Liaison Office",
      department: "Career Placement & Alumni Relations",
      phone: "+254733556677",
      verified: true,
      authProvider: "local,google",
      createdAt: "2026-08-15T14:20:00.000Z"
    },
    {
      id: "usr-org-4",
      name: "Strathmore Sports & Athletics Council",
      email: "sports@strathmore.edu",
      passwordHash: legacyPasswordHash,
      role: "ORGANIZER",
      status: "Active",
      organizerCode: "ORG-004",
      organizationName: "Strathmore Blades & Scorpions Sports Directorate",
      department: "Sports & Student Welfare Department",
      phone: "+254710887766",
      verified: true,
      authProvider: "local,google",
      createdAt: "2026-08-18T16:00:00.000Z"
    },
    {
      id: "usr-org-5",
      name: "Strathmore Business School (SBS) Executive Events",
      email: "sbs.events@strathmore.edu",
      passwordHash: legacyPasswordHash,
      role: "ORGANIZER",
      status: "Active",
      organizerCode: "ORG-005",
      organizationName: "Strathmore Business School Leadership Forum",
      department: "Strathmore Business School (SBS)",
      phone: "+254721445566",
      verified: true,
      authProvider: "local,google",
      createdAt: "2026-08-19T09:00:00.000Z"
    },
    {
      id: "usr-org-6",
      name: "Strathmore Law Clinic & Moot Society",
      email: "lawsociety@strathmore.edu",
      passwordHash: legacyPasswordHash,
      role: "ORGANIZER",
      status: "Active",
      organizerCode: "ORG-006",
      organizationName: "Strathmore Law School Moot & Legal Aid Society",
      department: "Strathmore Law School (SLS)",
      phone: "+254734667788",
      verified: true,
      authProvider: "local,google",
      createdAt: "2026-08-20T10:30:00.000Z"
    },
    {
      id: "usr-org-7",
      name: "Strathmore Student Council (SSC)",
      email: "studentcouncil@strathmore.edu",
      passwordHash: legacyPasswordHash,
      role: "ORGANIZER",
      status: "Active",
      organizerCode: "ORG-007",
      organizationName: "Strathmore University Student Council (SSC)",
      department: "Dean of Students Office",
      phone: "+254715778899",
      verified: true,
      authProvider: "local,google",
      createdAt: "2026-08-21T11:45:00.000Z"
    },
    {
      id: "usr-org-8",
      name: "Google Developer Student Club (GDSC Strathmore)",
      email: "gdsc@strathmore.edu",
      passwordHash: legacyPasswordHash,
      role: "ORGANIZER",
      status: "Active",
      organizerCode: "ORG-008",
      organizationName: "GDSC & IEEE Strathmore Tech Chapter",
      department: "SCES Student Tech Communities",
      phone: "+254726889900",
      verified: true,
      authProvider: "local,google",
      createdAt: "2026-08-22T13:15:00.000Z"
    },
    {
      id: "usr-org-9",
      name: "Strathmore Enterprise Development Centre (SEDC)",
      email: "sedc@strathmore.edu",
      passwordHash: legacyPasswordHash,
      role: "ORGANIZER",
      status: "Active",
      organizerCode: "ORG-009",
      organizationName: "SEDC Entrepreneurship & SME Hub",
      department: "Strathmore Enterprise Development Centre",
      phone: "+254737990011",
      verified: true,
      authProvider: "local,google",
      createdAt: "2026-08-23T15:00:00.000Z"
    },
    {
      id: "usr-org-10",
      name: "Strathmore Community Outreach & Sustainability Club",
      email: "community@strathmore.edu",
      passwordHash: legacyPasswordHash,
      role: "ORGANIZER",
      status: "Active",
      organizerCode: "ORG-010",
      organizationName: "Community Service Centre & Green Campus Initiative",
      department: "Community Outreach Programme (COP)",
      phone: "+254718112244",
      verified: true,
      authProvider: "local,google",
      createdAt: "2026-08-24T16:30:00.000Z"
    },

    // --- 10 STUDENT ACCOUNTS ---
    {
      id: "usr-stud-1",
      name: "Elvis Wanyama Wafuke",
      email: "student@strathmore.edu",
      passwordHash: legacyPasswordHash,
      role: "STUDENT",
      status: "Active",
      studentId: "154210",
      phone: "+254712345678",
      department: "BSc Informatics & Computer Science",
      yearOfStudy: 4,
      authProvider: "local,google",
      createdAt: "2026-09-01T08:00:00.000Z"
    },
    {
      id: "usr-stud-2",
      name: "Amina Hassan",
      email: "amina.hassan@strathmore.edu",
      passwordHash: legacyPasswordHash,
      role: "STUDENT",
      status: "Active",
      studentId: "154382",
      phone: "+254722112233",
      department: "BSc Computer Networks & Cyber Security",
      yearOfStudy: 3,
      authProvider: "local,google",
      createdAt: "2026-09-02T09:10:00.000Z"
    },
    {
      id: "usr-stud-3",
      name: "Brian Kiprop",
      email: "brian.kiprop@strathmore.edu",
      passwordHash: legacyPasswordHash,
      role: "STUDENT",
      status: "Active",
      studentId: "153904",
      phone: "+254733445566",
      department: "BSc Business Information Technology (BBIT)",
      yearOfStudy: 4,
      authProvider: "local,google",
      createdAt: "2026-09-03T10:45:00.000Z"
    },
    {
      id: "usr-stud-4",
      name: "Grace Wanjiku",
      email: "grace.wanjiku@strathmore.edu",
      passwordHash: legacyPasswordHash,
      role: "STUDENT",
      status: "Active",
      studentId: "155102",
      phone: "+254715998811",
      department: "Bachelor of Commerce (Finance)",
      yearOfStudy: 2,
      authProvider: "local,google",
      createdAt: "2026-09-04T12:00:00.000Z"
    },
    {
      id: "usr-stud-5",
      name: "Kevin Omondi",
      email: "kevin.omondi@strathmore.edu",
      passwordHash: legacyPasswordHash,
      role: "STUDENT",
      status: "Active",
      studentId: "154771",
      phone: "+254728776655",
      department: "BSc Electrical & Electronics Engineering",
      yearOfStudy: 3,
      authProvider: "local,google",
      createdAt: "2026-09-05T14:15:00.000Z"
    },
    {
      id: "usr-stud-6",
      name: "Faith Mutua",
      email: "faith.mutua@strathmore.edu",
      passwordHash: legacyPasswordHash,
      role: "STUDENT",
      status: "Active",
      studentId: "155419",
      phone: "+254799112244",
      department: "Bachelor of Laws (LLB)",
      yearOfStudy: 1,
      authProvider: "local,google",
      createdAt: "2026-09-06T15:30:00.000Z"
    },
    {
      id: "usr-stud-7",
      name: "David Njoroge",
      email: "david.njoroge@strathmore.edu",
      passwordHash: legacyPasswordHash,
      role: "STUDENT",
      status: "Active",
      studentId: "154615",
      phone: "+254714556677",
      department: "BSc Financial Engineering",
      yearOfStudy: 3,
      authProvider: "local,google",
      createdAt: "2026-09-07T09:20:00.000Z"
    },
    {
      id: "usr-stud-8",
      name: "Cynthia Chebet",
      email: "cynthia.chebet@strathmore.edu",
      passwordHash: legacyPasswordHash,
      role: "STUDENT",
      status: "Active",
      studentId: "155288",
      phone: "+254725667788",
      department: "BSc Informatics & Computer Science",
      yearOfStudy: 2,
      authProvider: "local,google",
      createdAt: "2026-09-08T11:10:00.000Z"
    },
    {
      id: "usr-stud-9",
      name: "samuel.mwangi@strathmore.edu" ? "Samuel Mwangi" : "Samuel Mwangi",
      email: "samuel.mwangi@strathmore.edu",
      passwordHash: legacyPasswordHash,
      role: "STUDENT",
      status: "Active",
      studentId: "153812",
      phone: "+254736778899",
      department: "BSc Supply Chain & Operations Management",
      yearOfStudy: 4,
      authProvider: "local,google",
      createdAt: "2026-09-09T13:40:00.000Z"
    },
    {
      id: "usr-stud-10",
      name: "Michelle Akinyi",
      email: "michelle.akinyi@strathmore.edu",
      passwordHash: legacyPasswordHash,
      role: "STUDENT",
      status: "Active",
      studentId: "155604",
      phone: "+254719889900",
      department: "BSc Data Science & Analytics",
      yearOfStudy: 1,
      authProvider: "local,google",
      createdAt: "2026-09-10T16:05:00.000Z"
    }
  ];

  // ============================================================================
  // 2. ROLE PROFILES TABLES (2 Admins, 10 Organizers, 10 Students)
  // ============================================================================
  const admin_profiles = [
    {
      id: "adm-prof-1",
      userId: "usr-admin-1",
      staffId: "ADM-001",
      name: "Elvis Wanyama Wafuke",
      email: "admin@strathmore.edu",
      title: "Chief System Administrator",
      department: "ICT & Campus Operations Directorate",
      clearanceLevel: "Super Admin (Full CRUD & Gateway Control)",
      phone: "+254712345678",
      lastLogin: "2026-10-22T07:40:00.000Z"
    },
    {
      id: "adm-prof-2",
      userId: "usr-admin-2",
      staffId: "ADM-002",
      name: "Mr. Allan Vikiru",
      email: "allan.vikiru@strathmore.edu",
      title: "Faculty System Supervisor & Auditor",
      department: "School of Computing & Engineering Sciences (SCES)",
      clearanceLevel: "Executive Admin (Oversight, Analytics & SMS)",
      phone: "+254722998877",
      lastLogin: "2026-10-22T07:15:00.000Z"
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
      officeLocation: "STC Building, 3rd Floor, Room 304",
      phone: "+254711223344",
      verified: true,
      eventsHostedCount: 2
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
      eventsHostedCount: 2
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
      eventsHostedCount: 2
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
      eventsHostedCount: 1
    },
    {
      id: "org-prof-5",
      userId: "usr-org-5",
      organizerCode: "ORG-005",
      name: "Strathmore Business School (SBS) Executive Events",
      email: "sbs.events@strathmore.edu",
      department: "Strathmore Business School (SBS)",
      officeLocation: "SBS Main Wing, 2nd Floor",
      phone: "+254721445566",
      verified: true,
      eventsHostedCount: 2
    },
    {
      id: "org-prof-6",
      userId: "usr-org-6",
      organizerCode: "ORG-006",
      name: "Strathmore Law Clinic & Moot Society",
      email: "lawsociety@strathmore.edu",
      department: "Strathmore Law School (SLS)",
      officeLocation: "SLS Wing, Moot Court Chambers",
      phone: "+254734667788",
      verified: true,
      eventsHostedCount: 1
    },
    {
      id: "org-prof-7",
      userId: "usr-org-7",
      organizerCode: "ORG-007",
      name: "Strathmore Student Council (SSC)",
      email: "studentcouncil@strathmore.edu",
      department: "Dean of Students Office",
      officeLocation: "Student Centre, 1st Floor SSC Suite",
      phone: "+254715778899",
      verified: true,
      eventsHostedCount: 2
    },
    {
      id: "org-prof-8",
      userId: "usr-org-8",
      organizerCode: "ORG-008",
      name: "Google Developer Student Club (GDSC Strathmore)",
      email: "gdsc@strathmore.edu",
      department: "SCES Student Tech Communities",
      officeLocation: "iLabAfrica Lab 2",
      phone: "+254726889900",
      verified: true,
      eventsHostedCount: 2
    },
    {
      id: "org-prof-9",
      userId: "usr-org-9",
      organizerCode: "ORG-009",
      name: "Strathmore Enterprise Development Centre (SEDC)",
      email: "sedc@strathmore.edu",
      department: "Strathmore Enterprise Development Centre",
      officeLocation: "Management Science Building, Room 108",
      phone: "+254737990011",
      verified: true,
      eventsHostedCount: 1
    },
    {
      id: "org-prof-10",
      userId: "usr-org-10",
      organizerCode: "ORG-010",
      name: "Strathmore Community Outreach & Sustainability Club",
      email: "community@strathmore.edu",
      department: "Community Outreach Programme (COP)",
      officeLocation: "Central Administration Block, Annex B",
      phone: "+254718112244",
      verified: true,
      eventsHostedCount: 1
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
      studentId: "153904",
      name: "Brian Kiprop",
      email: "brian.kiprop@strathmore.edu",
      program: "BSc Business Information Technology (BBIT)",
      faculty: "SCES",
      yearOfStudy: 4,
      phone: "+254733445566",
      hostelResident: false,
      pastAttendanceRate: 0.79
    },
    {
      id: "stud-prof-4",
      userId: "usr-stud-4",
      studentId: "155102",
      name: "Grace Wanjiku",
      email: "grace.wanjiku@strathmore.edu",
      program: "Bachelor of Commerce (Finance)",
      faculty: "SIMS",
      yearOfStudy: 2,
      phone: "+254715998811",
      hostelResident: true,
      pastAttendanceRate: 0.84
    },
    {
      id: "stud-prof-5",
      userId: "usr-stud-5",
      studentId: "154771",
      name: "Kevin Omondi",
      email: "kevin.omondi@strathmore.edu",
      program: "BSc Electrical & Electronics Engineering",
      faculty: "SCES",
      yearOfStudy: 3,
      phone: "+254728776655",
      hostelResident: false,
      pastAttendanceRate: 0.75
    },
    {
      id: "stud-prof-6",
      userId: "usr-stud-6",
      studentId: "155419",
      name: "Faith Mutua",
      email: "faith.mutua@strathmore.edu",
      program: "Bachelor of Laws (LLB)",
      faculty: "SLS",
      yearOfStudy: 1,
      phone: "+254799112244",
      hostelResident: true,
      pastAttendanceRate: 0.93
    },
    {
      id: "stud-prof-7",
      userId: "usr-stud-7",
      studentId: "154615",
      name: "David Njoroge",
      email: "david.njoroge@strathmore.edu",
      program: "BSc Financial Engineering",
      faculty: "SIMS",
      yearOfStudy: 3,
      phone: "+254714556677",
      hostelResident: false,
      pastAttendanceRate: 0.82
    },
    {
      id: "stud-prof-8",
      userId: "usr-stud-8",
      studentId: "155288",
      name: "Cynthia Chebet",
      email: "cynthia.chebet@strathmore.edu",
      program: "BSc Informatics & Computer Science",
      faculty: "SCES",
      yearOfStudy: 2,
      phone: "+254725667788",
      hostelResident: true,
      pastAttendanceRate: 0.89
    },
    {
      id: "stud-prof-9",
      userId: "usr-stud-9",
      studentId: "153812",
      name: "Samuel Mwangi",
      email: "samuel.mwangi@strathmore.edu",
      program: "BSc Supply Chain & Operations Management",
      faculty: "SBS",
      yearOfStudy: 4,
      phone: "+254736778899",
      hostelResident: false,
      pastAttendanceRate: 0.77
    },
    {
      id: "stud-prof-10",
      userId: "usr-stud-10",
      studentId: "155604",
      name: "Michelle Akinyi",
      email: "michelle.akinyi@strathmore.edu",
      program: "BSc Data Science & Analytics",
      faculty: "SCES",
      yearOfStudy: 1,
      phone: "+254719889900",
      hostelResident: true,
      pastAttendanceRate: 0.95
    }
  ];

  // ============================================================================
  // 3. CATEGORIES & VENUES TABLES
  // ============================================================================
  const categories = [
    { id: "cat-1", name: "Academic", description: "Colloquia, research defenses, and faculty guest lectures", color: "#003366", activeEvents: 3 },
    { id: "cat-2", name: "Workshop", description: "Hands-on technical labs, coding bootcamps, and hackathons", color: "#0284c7", activeEvents: 4 },
    { id: "cat-3", name: "Career Fair", description: "Graduate recruitment drives, employer panels, and CV clinics", color: "#059669", activeEvents: 3 },
    { id: "cat-4", name: "Seminar", description: "Industry executive talks, policy dialogues, and fireside chats", color: "#7c3aed", activeEvents: 3 },
    { id: "cat-5", name: "Sports", description: "Inter-faculty tournaments, varsity leagues, and fitness days", color: "#ea580c", activeEvents: 1 },
    { id: "cat-6", name: "Cultural", description: "Cultural week festivals, music nights, and community outreach", color: "#e11d48", activeEvents: 2 }
  ];

  const venues = [
    { id: "ven-1", name: "Main Auditorium", building: "Central Building", capacity: 500, hasProjector: true, hasPA: true },
    { id: "ven-2", name: "iLab Africa Innovation Room 302", building: "Student Centre (STC)", capacity: 120, hasProjector: true, hasPA: true },
    { id: "ven-3", name: "Student Center Graduation Square", building: "Main Campus Quad", capacity: 600, hasProjector: false, hasPA: true },
    { id: "ven-4", name: "SCES Lecture Theatre 4 (LT4)", building: "Phase 2 Academic Block", capacity: 180, hasProjector: true, hasPA: true },
    { id: "ven-5", name: "Strathmore Business School (SBS) Auditorium", building: "SBS Wing", capacity: 300, hasProjector: true, hasPA: true },
    { id: "ven-6", name: "Strathmore Sports Complex Main Pitch", building: "Madaraka Sports Grounds", capacity: 800, hasProjector: false, hasPA: true },
    { id: "ven-7", name: "SLS Moot Court Chambers", building: "Strathmore Law School Wing", capacity: 150, hasProjector: true, hasPA: true }
  ];

  // ============================================================================
  // 4. EVENTS TABLE (16 Campus Events mapped across all 10 Organizers)
  // ============================================================================
  const events = [
    // Organizer 1: Dr. Joseph Orero (usr-org-1)
    {
      id: "evt-101",
      title: "Strathmore AI & Machine Learning Annual Colloquium",
      category: "Academic",
      date: "2026-11-12",
      time: "14:00 - 17:00",
      timeSlot: "Afternoon",
      dayOfWeek: "Thursday",
      venue: "Main Auditorium",
      venueCapacity: 500,
      registrationCount: 412,
      smsPriority: 3,
      featured: true,
      status: "Upcoming",
      organizerId: "usr-org-1",
      organizerName: "Dr. Joseph Orero (SCES Dean's Office)",
      description: "Keynote research symposium featuring live demonstrations of predictive campus analytics, computer vision, and NLP systems built by Strathmore SCES final-year researchers.",
      createdAt: "2026-10-01T09:00:00.000Z"
    },
    {
      id: "evt-102",
      title: "Final Year IS Project Defense & Poster Exhibition",
      category: "Academic",
      date: "2026-11-26",
      time: "08:30 - 13:00",
      timeSlot: "Morning",
      dayOfWeek: "Thursday",
      venue: "SCES Lecture Theatre 4 (LT4)",
      venueCapacity: 180,
      registrationCount: 164,
      smsPriority: 3,
      featured: false,
      status: "Upcoming",
      organizerId: "usr-org-1",
      organizerName: "Dr. Joseph Orero (SCES Dean's Office)",
      description: "Official BSc Informatics & Computer Science project defense showcase evaluated by SCES faculty panels and industry supervisors.",
      createdAt: "2026-10-02T10:00:00.000Z"
    },

    // Organizer 2: @iLabAfrica Innovation Centre (usr-org-2)
    {
      id: "evt-103",
      title: "Cybersecurity & Cloud Threat Hunting Bootcamp",
      category: "Workshop",
      date: "2026-11-15",
      time: "09:00 - 13:00",
      timeSlot: "Morning",
      dayOfWeek: "Sunday",
      venue: "iLab Africa Innovation Room 302",
      venueCapacity: 120,
      registrationCount: 114,
      smsPriority: 3,
      featured: true,
      status: "Upcoming",
      organizerId: "usr-org-2",
      organizerName: "@iLabAfrica Innovation Centre",
      description: "Intensive hands-on blue-team defense lab covering zero-trust network architecture, SIEM log analysis, and penetration testing.",
      createdAt: "2026-10-03T11:30:00.000Z"
    },
    {
      id: "evt-104",
      title: "Fintech & Africa's Talking API Developer Hackathon",
      category: "Workshop",
      date: "2026-11-21",
      time: "08:30 - 17:30",
      timeSlot: "Morning",
      dayOfWeek: "Saturday",
      venue: "iLab Africa Innovation Room 302",
      venueCapacity: 120,
      registrationCount: 118,
      smsPriority: 3,
      featured: true,
      status: "Upcoming",
      organizerId: "usr-org-2",
      organizerName: "@iLabAfrica Innovation Centre",
      description: "24-hour sprint building USSD, Priority SMS, and mobile payment solutions using Africa's Talking and Daraja APIs.",
      createdAt: "2026-10-04T09:15:00.000Z"
    },

    // Organizer 3: Strathmore Career Development Services (usr-org-3)
    {
      id: "evt-105",
      title: "Annual Engineering & Tech Graduate Career Fair",
      category: "Career Fair",
      date: "2026-11-18",
      time: "10:00 - 16:00",
      timeSlot: "Morning",
      dayOfWeek: "Wednesday",
      venue: "Student Center Graduation Square",
      venueCapacity: 600,
      registrationCount: 485,
      smsPriority: 2,
      featured: true,
      status: "Upcoming",
      organizerId: "usr-org-3",
      organizerName: "Strathmore Career Development Services",
      description: "Connect directly with hiring managers from Safaricom, Microsoft ADC, Google Nairobi, Deloitte, and Equity Bank for internships and graduate roles.",
      createdAt: "2026-10-05T14:00:00.000Z"
    },
    {
      id: "evt-106",
      title: "Global Tech CV Clinic & Mock Technical Interviews",
      category: "Career Fair",
      date: "2026-11-29",
      time: "14:00 - 17:00",
      timeSlot: "Afternoon",
      dayOfWeek: "Sunday",
      venue: "SCES Lecture Theatre 4 (LT4)",
      venueCapacity: 180,
      registrationCount: 132,
      smsPriority: 2,
      featured: false,
      status: "Upcoming",
      organizerId: "usr-org-3",
      organizerName: "Strathmore Career Development Services",
      description: "One-on-one resume reviews and whiteboard data-structure interview coaching with alumni engineers from leading tech firms.",
      createdAt: "2026-10-06T12:00:00.000Z"
    },

    // Organizer 4: Strathmore Sports & Athletics Council (usr-org-4)
    {
      id: "evt-107",
      title: "Inter-Faculty Chancellor's Cup Football & Rugby Finals",
      category: "Sports",
      date: "2026-11-28",
      time: "15:00 - 18:30",
      timeSlot: "Afternoon",
      dayOfWeek: "Saturday",
      venue: "Strathmore Sports Complex Main Pitch",
      venueCapacity: 800,
      registrationCount: 640,
      smsPriority: 2,
      featured: false,
      status: "Upcoming",
      organizerId: "usr-org-4",
      organizerName: "Strathmore Sports & Athletics Council",
      description: "Championship showdown between SCES Titans and SIMS Warriors followed by the trophy presentation at Madaraka grounds.",
      createdAt: "2026-10-07T16:10:00.000Z"
    },

    // Organizer 5: Strathmore Business School (SBS) Executive Events (usr-org-5)
    {
      id: "evt-108",
      title: "East Africa Quantitative Finance & Data Science Summit",
      category: "Seminar",
      date: "2026-11-24",
      time: "14:00 - 16:30",
      timeSlot: "Afternoon",
      dayOfWeek: "Tuesday",
      venue: "Strathmore Business School (SBS) Auditorium",
      venueCapacity: 300,
      registrationCount: 238,
      smsPriority: 2,
      featured: false,
      status: "Upcoming",
      organizerId: "usr-org-5",
      organizerName: "Strathmore Business School (SBS) Executive Events",
      description: "Executive panel exploring algorithmic trading, credit risk modeling, and central bank digital currencies across East African markets.",
      createdAt: "2026-10-08T10:30:00.000Z"
    },
    {
      id: "evt-109",
      title: "CEO Fireside Chat: Leading Digital Transformation in Africa",
      category: "Seminar",
      date: "2026-12-03",
      time: "17:30 - 19:30",
      timeSlot: "Evening",
      dayOfWeek: "Thursday",
      venue: "Strathmore Business School (SBS) Auditorium",
      venueCapacity: 300,
      registrationCount: 265,
      smsPriority: 3,
      featured: true,
      status: "Upcoming",
      organizerId: "usr-org-5",
      organizerName: "Strathmore Business School (SBS) Executive Events",
      description: "Evening executive leadership dialogue with C-suite leaders on scaling enterprise governance and AI adoption across African corporations.",
      createdAt: "2026-10-09T11:00:00.000Z"
    },

    // Organizer 6: Strathmore Law Clinic & Moot Society (usr-org-6)
    {
      id: "evt-110",
      title: "Data Privacy, AI Regulation & Kenya Data Protection Act Symposium",
      category: "Academic",
      date: "2026-12-01",
      time: "14:00 - 17:00",
      timeSlot: "Afternoon",
      dayOfWeek: "Tuesday",
      venue: "SLS Moot Court Chambers",
      venueCapacity: 150,
      registrationCount: 138,
      smsPriority: 2,
      featured: false,
      status: "Upcoming",
      organizerId: "usr-org-6",
      organizerName: "Strathmore Law Clinic & Moot Society",
      description: "Legal and technical debate with the Office of the Data Protection Commissioner (ODPC) on algorithmic accountability and citizen privacy rights.",
      createdAt: "2026-10-10T09:45:00.000Z"
    },

    // Organizer 7: Strathmore Student Council (SSC) (usr-org-7)
    {
      id: "evt-111",
      title: "Strathmore Annual Cultural Week Gala & Concert",
      category: "Cultural",
      date: "2026-12-04",
      time: "16:00 - 20:00",
      timeSlot: "Evening",
      dayOfWeek: "Friday",
      venue: "Student Center Graduation Square",
      venueCapacity: 600,
      registrationCount: 540,
      smsPriority: 1,
      featured: true,
      status: "Upcoming",
      organizerId: "usr-org-7",
      organizerName: "Strathmore Student Council (SSC)",
      description: "Celebration of international diversity featuring culinary showcases, traditional performances, and live campus musical acts.",
      createdAt: "2026-10-11T15:00:00.000Z"
    },
    {
      id: "evt-112",
      title: "Student Townhall & Campus Welfare Open Forum",
      category: "Seminar",
      date: "2026-11-19",
      time: "11:00 - 13:00",
      timeSlot: "Morning",
      dayOfWeek: "Thursday",
      venue: "Main Auditorium",
      venueCapacity: 500,
      registrationCount: 320,
      smsPriority: 3,
      featured: false,
      status: "Upcoming",
      organizerId: "usr-org-7",
      organizerName: "Strathmore Student Council (SSC)",
      description: "Direct Q&A session between the 16th Student Council Executive, Dean of Students, and student body regarding academic policies and campus facilities.",
      createdAt: "2026-10-12T10:20:00.000Z"
    },

    // Organizer 8: Google Developer Student Club (GDSC Strathmore) (usr-org-8)
    {
      id: "evt-113",
      title: "Kotlin, Flutter & Gemini Android DevFest Strathmore",
      category: "Workshop",
      date: "2026-11-27",
      time: "09:00 - 15:00",
      timeSlot: "Morning",
      dayOfWeek: "Friday",
      venue: "iLab Africa Innovation Room 302",
      venueCapacity: 120,
      registrationCount: 116,
      smsPriority: 3,
      featured: true,
      status: "Upcoming",
      organizerId: "usr-org-8",
      organizerName: "Google Developer Student Club (GDSC Strathmore)",
      description: "Hands-on mobile engineering codelab building cross-platform apps with on-device Gemini Nano and Firebase Cloud Messaging.",
      createdAt: "2026-10-13T13:00:00.000Z"
    },
    {
      id: "evt-114",
      title: "Open Source & Kubernetes Cloud Native Study Jam",
      category: "Workshop",
      date: "2026-12-06",
      time: "10:00 - 14:00",
      timeSlot: "Morning",
      dayOfWeek: "Sunday",
      venue: "SCES Lecture Theatre 4 (LT4)",
      venueCapacity: 180,
      registrationCount: 149,
      smsPriority: 2,
      featured: false,
      status: "Upcoming",
      organizerId: "usr-org-8",
      organizerName: "Google Developer Student Club (GDSC Strathmore)",
      description: "Practical container orchestration workshop deploying microservices on Google Kubernetes Engine (GKE) and Docker.",
      createdAt: "2026-10-14T14:00:00.000Z"
    },

    // Organizer 9: Strathmore Enterprise Development Centre (SEDC) (usr-org-9)
    {
      id: "evt-115",
      title: "Student Startup Pitch Deck & Venture Capital Demo Day",
      category: "Career Fair",
      date: "2026-12-08",
      time: "14:00 - 17:30",
      timeSlot: "Afternoon",
      dayOfWeek: "Tuesday",
      venue: "Strathmore Business School (SBS) Auditorium",
      venueCapacity: 300,
      registrationCount: 244,
      smsPriority: 3,
      featured: true,
      status: "Upcoming",
      organizerId: "usr-org-9",
      organizerName: "Strathmore Enterprise Development Centre (SEDC)",
      description: "Ten student-founded startups pitch to Nairobi angel investors and VC funds for seed grants up to KES 1,500,000.",
      createdAt: "2026-10-15T09:30:00.000Z"
    },

    // Organizer 10: Strathmore Community Outreach & Sustainability Club (usr-org-10)
    {
      id: "evt-116",
      title: "Green Campus Solar & E-Waste Recycling Innovation Drive",
      category: "Cultural",
      date: "2026-12-10",
      time: "09:00 - 14:00",
      timeSlot: "Morning",
      dayOfWeek: "Thursday",
      venue: "Student Center Graduation Square",
      venueCapacity: 600,
      registrationCount: 385,
      smsPriority: 2,
      featured: false,
      status: "Upcoming",
      organizerId: "usr-org-10",
      organizerName: "Strathmore Community Outreach & Sustainability Club",
      description: "Campus sustainability drive collecting electronic waste for safe refurbishment and showcasing student clean-energy prototypes.",
      createdAt: "2026-10-16T11:15:00.000Z"
    }
  ];

  // ============================================================================
  // 5. REGISTRATIONS TABLE
  // ============================================================================
  const registrations = [
    {
      id: "reg-1001",
      eventId: "evt-101",
      eventTitle: "Strathmore AI & Machine Learning Annual Colloquium",
      userId: "usr-stud-1",
      studentId: "154210",
      studentName: "Elvis Wanyama Wafuke",
      studentEmail: "student@strathmore.edu",
      phone: "+254712345678",
      status: "Confirmed",
      registeredAt: "2026-10-12T10:15:00.000Z"
    },
    {
      id: "reg-1002",
      eventId: "evt-103",
      eventTitle: "Cybersecurity & Cloud Threat Hunting Bootcamp",
      userId: "usr-stud-1",
      studentId: "154210",
      studentName: "Elvis Wanyama Wafuke",
      studentEmail: "student@strathmore.edu",
      phone: "+254712345678",
      status: "Confirmed",
      registeredAt: "2026-10-12T10:18:00.000Z"
    },
    {
      id: "reg-1003",
      eventId: "evt-104",
      eventTitle: "Fintech & Africa's Talking API Developer Hackathon",
      userId: "usr-stud-1",
      studentId: "154210",
      studentName: "Elvis Wanyama Wafuke",
      studentEmail: "student@strathmore.edu",
      phone: "+254712345678",
      status: "Confirmed",
      registeredAt: "2026-10-13T11:00:00.000Z"
    },
    {
      id: "reg-1004",
      eventId: "evt-101",
      eventTitle: "Strathmore AI & Machine Learning Annual Colloquium",
      userId: "usr-stud-2",
      studentId: "154382",
      studentName: "Amina Hassan",
      studentEmail: "amina.hassan@strathmore.edu",
      phone: "+254722112233",
      status: "Confirmed",
      registeredAt: "2026-10-13T12:30:00.000Z"
    },
    {
      id: "reg-1005",
      eventId: "evt-105",
      eventTitle: "Annual Engineering & Tech Graduate Career Fair",
      userId: "usr-stud-3",
      studentId: "153904",
      studentName: "Brian Kiprop",
      studentEmail: "brian.kiprop@strathmore.edu",
      phone: "+254733445566",
      status: "Confirmed",
      registeredAt: "2026-10-14T09:45:00.000Z"
    },
    {
      id: "reg-1006",
      eventId: "evt-108",
      eventTitle: "East Africa Quantitative Finance & Data Science Summit",
      userId: "usr-stud-4",
      studentId: "155102",
      studentName: "Grace Wanjiku",
      studentEmail: "grace.wanjiku@strathmore.edu",
      phone: "+254715998811",
      status: "Confirmed",
      registeredAt: "2026-10-14T15:20:00.000Z"
    },
    {
      id: "reg-1007",
      eventId: "evt-104",
      eventTitle: "Fintech & Africa's Talking API Developer Hackathon",
      userId: "usr-stud-5",
      studentId: "154771",
      studentName: "Kevin Omondi",
      studentEmail: "kevin.omondi@strathmore.edu",
      phone: "+254728776655",
      status: "Confirmed",
      registeredAt: "2026-10-15T08:50:00.000Z"
    },
    {
      id: "reg-1008",
      eventId: "evt-110",
      eventTitle: "Data Privacy, AI Regulation & Kenya Data Protection Act Symposium",
      userId: "usr-stud-6",
      studentId: "155419",
      studentName: "Faith Mutua",
      studentEmail: "faith.mutua@strathmore.edu",
      phone: "+254799112244",
      status: "Confirmed",
      registeredAt: "2026-10-15T14:10:00.000Z"
    },
    {
      id: "reg-1009",
      eventId: "evt-109",
      eventTitle: "CEO Fireside Chat: Leading Digital Transformation in Africa",
      userId: "usr-stud-7",
      studentId: "154615",
      studentName: "David Njoroge",
      studentEmail: "david.njoroge@strathmore.edu",
      phone: "+254714556677",
      status: "Confirmed",
      registeredAt: "2026-10-16T10:00:00.000Z"
    },
    {
      id: "reg-1010",
      eventId: "evt-113",
      eventTitle: "Kotlin, Flutter & Gemini Android DevFest Strathmore",
      userId: "usr-stud-8",
      studentId: "155288",
      studentName: "Cynthia Chebet",
      studentEmail: "cynthia.chebet@strathmore.edu",
      phone: "+254725667788",
      status: "Confirmed",
      registeredAt: "2026-10-16T11:30:00.000Z"
    },
    {
      id: "reg-1011",
      eventId: "evt-115",
      eventTitle: "Student Startup Pitch Deck & Venture Capital Demo Day",
      userId: "usr-stud-9",
      studentId: "153812",
      studentName: "Samuel Mwangi",
      studentEmail: "samuel.mwangi@strathmore.edu",
      phone: "+254736778899",
      status: "Confirmed",
      registeredAt: "2026-10-17T09:15:00.000Z"
    },
    {
      id: "reg-1012",
      eventId: "evt-101",
      eventTitle: "Strathmore AI & Machine Learning Annual Colloquium",
      userId: "usr-stud-10",
      studentId: "155604",
      studentName: "Michelle Akinyi",
      studentEmail: "michelle.akinyi@strathmore.edu",
      phone: "+254719889900",
      status: "Confirmed",
      registeredAt: "2026-10-17T14:40:00.000Z"
    }
  ];

  // ============================================================================
  // 6. AFRICA'S TALKING PRIORITY SMS LOGS TABLE
  // ============================================================================
  const smsLogs = [
    {
      id: "sms-901",
      eventId: "evt-101",
      eventTitle: "Strathmore AI & Machine Learning Annual Colloquium",
      priority: "HIGH",
      recipientCount: 412,
      recipientsSample: ["+254712345678", "+254722112233", "+254719889900"],
      message: "🚨 [URGENT - Strathmore SmartEvent]: AI & ML Annual Colloquium starts at 14:00 in Main Auditorium. Present your Student ID at Entry Gate B.",
      status: "DELIVERED (Africa's Talking Gateway)",
      gatewayMessageId: "ATXid_892341098234019",
      cost: "KES 329.60",
      sentBy: "Dr. Joseph Orero (ORG-001)",
      sentAt: "2026-10-18T08:30:00.000Z"
    },
    {
      id: "sms-902",
      eventId: "evt-103",
      eventTitle: "Cybersecurity & Cloud Threat Hunting Bootcamp",
      priority: "HIGH",
      recipientCount: 114,
      recipientsSample: ["+254712345678", "+254728776655"],
      message: "🚨 [URGENT - @iLabAfrica]: Room 302 lab workstations are pre-configured. Bring your laptop charger and Strathmore SmartEvent QR pass.",
      status: "DELIVERED (Africa's Talking Gateway)",
      gatewayMessageId: "ATXid_892341098234088",
      cost: "KES 91.20",
      sentBy: "@iLabAfrica Innovation Centre (ORG-002)",
      sentAt: "2026-10-18T11:15:00.000Z"
    },
    {
      id: "sms-903",
      eventId: "evt-105",
      eventTitle: "Annual Engineering & Tech Graduate Career Fair",
      priority: "MEDIUM",
      recipientCount: 485,
      recipientsSample: ["+254733445566", "+254715998811"],
      message: "📌 [REMINDER - Career Services]: Employer booths open at 10:00 AM at Graduation Square. Upload your CV to the SmartEvent portal.",
      status: "DELIVERED (Africa's Talking Gateway)",
      gatewayMessageId: "ATXid_892341098234152",
      cost: "KES 388.00",
      sentBy: "Strathmore Career Services (ORG-003)",
      sentAt: "2026-10-18T14:00:00.000Z"
    },
    {
      id: "sms-904",
      eventId: "evt-104",
      eventTitle: "Fintech & Africa's Talking API Developer Hackathon",
      priority: "HIGH",
      recipientCount: 118,
      recipientsSample: ["+254712345678", "+254728776655"],
      message: "🚨 [URGENT - Hackathon]: Sandbox API keys for Africa's Talking SMS & USSD have been provisioned to all registered team leads.",
      status: "DELIVERED (Africa's Talking Gateway)",
      gatewayMessageId: "ATXid_892341098234209",
      cost: "KES 94.40",
      sentBy: "Elvis Wanyama Wafuke (ADM-001)",
      sentAt: "2026-10-18T16:45:00.000Z"
    },
    {
      id: "sms-905",
      eventId: "evt-111",
      eventTitle: "Strathmore Annual Cultural Week Gala & Concert",
      priority: "LOW",
      recipientCount: 540,
      recipientsSample: ["+254799112244", "+254722112233"],
      message: "ℹ️ [INFO - Cultural Week]: Early-bird wristbands for the Friday Cultural Gala are available at the Student Center desk.",
      status: "DELIVERED (Africa's Talking Gateway)",
      gatewayMessageId: "ATXid_892341098234299",
      cost: "KES 432.00",
      sentBy: "Mr. Allan Vikiru (ADM-002)",
      sentAt: "2026-10-18T17:20:00.000Z"
    }
  ];

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
    savedEvents: {
      "usr-stud-1": ["evt-103", "evt-105"],
      "usr-stud-2": ["evt-104"]
    }
  };
}

function ensureCompleteSeedData(data) {
  const defaults = buildDefaultData();
  let modified = false;

  for (const key of Object.keys(defaults)) {
    if (!data[key] || (Array.isArray(defaults[key]) && (!Array.isArray(data[key]) || data[key].length < defaults[key].length))) {
      if (Array.isArray(defaults[key])) {
        const existingById = new Map((data[key] || []).map(item => [item.id, item]));
        for (const seedItem of defaults[key]) {
          existingById.set(seedItem.id, { ...(existingById.get(seedItem.id) || {}), ...seedItem });
        }
        data[key] = Array.from(existingById.values());
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
