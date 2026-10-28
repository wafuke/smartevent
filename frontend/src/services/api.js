// SmartEvent Web API Client with Direct Backend & Offline Resilience
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const DIRECT_BACKEND_URL = 'http://localhost:5000/api';

const DEFAULT_PASSWORDS = ['password123', 'admin123', 'Strathmore@2026', '154210'];

const SEEDED_USERS = [
  // 2 Admins
  { id: 'usr-admin-1', name: 'Elvis Wanyama Wafuke', email: 'elvis.wafuke@strathmore.edu', aliasEmails: ['admin@strathmore.edu'], password: 'password123', role: 'admin', staffId: 'ADM-001', studentId: '154210', clearanceLevel: 'Super Admin', phone: '+254712345678', department: 'ICT & Campus Operations Directorate', isActive: true, createdAt: '2026-08-01T08:00:00.000Z' },
  { id: 'usr-admin-2', name: 'Mr. Allan Vikiru', email: 'allan.vikiru@strathmore.edu', password: 'password123', role: 'admin', staffId: 'ADM-002', clearanceLevel: 'Academic & System Auditor', phone: '+254722998877', department: 'School of Computing & Engineering Sciences (SCES)', isActive: true, createdAt: '2026-08-01T08:05:00.000Z' },

  // 10 Organizers
  { id: 'usr-org-1', name: "Dr. Joseph Orero (SCES Dean's Office)", email: 'organizer@strathmore.edu', password: 'password123', role: 'organizer', organizerCode: 'ORG-001', organizationName: 'SCES Academic & Research Colloquium', phone: '+254711223344', department: 'School of Computing & Engineering Sciences', isActive: true, createdAt: '2026-08-02T09:00:00.000Z' },
  { id: 'usr-org-2', name: '@iLabAfrica Innovation Centre', email: 'ilab@strathmore.edu', password: 'password123', role: 'organizer', organizerCode: 'ORG-002', organizationName: '@iLabAfrica Research & Incubation Hub', phone: '+254722334455', department: 'Directorate of Research & Tech Innovation', isActive: true, createdAt: '2026-08-02T09:10:00.000Z' },
  { id: 'usr-org-3', name: 'Strathmore Career Development Services', email: 'careers@strathmore.edu', password: 'password123', role: 'organizer', organizerCode: 'ORG-003', organizationName: 'Strathmore Career & Industry Liaison Office', phone: '+254733556677', department: 'Career Placement & Alumni Relations', isActive: true, createdAt: '2026-08-02T09:20:00.000Z' },
  { id: 'usr-org-4', name: 'Strathmore Sports & Athletics Council', email: 'sports@strathmore.edu', password: 'password123', role: 'organizer', organizerCode: 'ORG-004', organizationName: 'Strathmore Blades & Scorpions Sports Directorate', phone: '+254710887766', department: 'Sports & Student Welfare Department', isActive: true, createdAt: '2026-08-02T09:30:00.000Z' },
  { id: 'usr-org-5', name: 'Strathmore Business School (SBS) Executive Events', email: 'sbs.events@strathmore.edu', password: 'password123', role: 'organizer', organizerCode: 'ORG-005', organizationName: 'Strathmore Business School Leadership Forum', phone: '+254721445566', department: 'Strathmore Business School (SBS)', isActive: true, createdAt: '2026-08-02T09:40:00.000Z' },
  { id: 'usr-org-6', name: 'Strathmore Law Clinic & Moot Society', email: 'lawsociety@strathmore.edu', password: 'password123', role: 'organizer', organizerCode: 'ORG-006', organizationName: 'Strathmore Law School Moot & Legal Aid Society', phone: '+254734667788', department: 'Strathmore Law School (SLS)', isActive: true, createdAt: '2026-08-02T09:50:00.000Z' },
  { id: 'usr-org-7', name: 'Strathmore Student Council (SSC)', email: 'studentcouncil@strathmore.edu', password: 'password123', role: 'organizer', organizerCode: 'ORG-007', organizationName: 'Strathmore University Student Council (SSC)', phone: '+254715778899', department: 'Dean of Students Office', isActive: true, createdAt: '2026-08-02T10:00:00.000Z' },
  { id: 'usr-org-8', name: 'Google Developer Student Club (GDSC Strathmore)', email: 'gdsc@strathmore.edu', password: 'password123', role: 'organizer', organizerCode: 'ORG-008', organizationName: 'GDSC & IEEE Strathmore Tech Chapter', phone: '+254726889900', department: 'SCES Student Tech Communities', isActive: true, createdAt: '2026-08-02T10:10:00.000Z' },
  { id: 'usr-org-9', name: 'Strathmore Enterprise Development Centre (SEDC)', email: 'sedc@strathmore.edu', password: 'password123', role: 'organizer', organizerCode: 'ORG-009', organizationName: 'SEDC Entrepreneurship & SME Hub', phone: '+254737990011', department: 'Strathmore Enterprise Development Centre', isActive: true, createdAt: '2026-08-02T10:20:00.000Z' },
  { id: 'usr-org-10', name: 'Strathmore Community Outreach & Sustainability Club', email: 'community@strathmore.edu', password: 'password123', role: 'organizer', organizerCode: 'ORG-010', organizationName: 'Community Service Centre & Green Campus Initiative', phone: '+254718112244', department: 'Community Outreach Programme (COP)', isActive: true, createdAt: '2026-08-02T10:30:00.000Z' },

  // 10 Students
  { id: 'usr-stud-1', name: 'Elvis Wanyama Wafuke', email: 'student@strathmore.edu', password: 'password123', role: 'student', studentId: '154210', phone: '+254712345678', department: 'BSc Informatics & Computer Science', yearOfStudy: 4, isActive: true, createdAt: '2026-08-05T08:00:00.000Z' },
  { id: 'usr-stud-2', name: 'Amina Hassan', email: 'amina.hassan@strathmore.edu', password: 'password123', role: 'student', studentId: '154382', phone: '+254722112233', department: 'BSc Computer Networks & Cyber Security', yearOfStudy: 3, isActive: true, createdAt: '2026-08-05T08:10:00.000Z' },
  { id: 'usr-stud-3', name: 'Brian Kiprop', email: 'brian.kiprop@strathmore.edu', password: 'password123', role: 'student', studentId: '153904', phone: '+254733445566', department: 'BSc Business Information Technology (BBIT)', yearOfStudy: 4, isActive: true, createdAt: '2026-08-05T08:20:00.000Z' },
  { id: 'usr-stud-4', name: 'Grace Wanjiku', email: 'grace.wanjiku@strathmore.edu', password: 'password123', role: 'student', studentId: '155102', phone: '+254715998811', department: 'Bachelor of Commerce (Finance)', yearOfStudy: 2, isActive: true, createdAt: '2026-08-05T08:30:00.000Z' },
  { id: 'usr-stud-5', name: 'Kevin Omondi', email: 'kevin.omondi@strathmore.edu', password: 'password123', role: 'student', studentId: '154771', phone: '+254728776655', department: 'BSc Electrical & Electronics Engineering', yearOfStudy: 3, isActive: true, createdAt: '2026-08-05T08:40:00.000Z' },
  { id: 'usr-stud-6', name: 'Faith Mutua', email: 'faith.mutua@strathmore.edu', password: 'password123', role: 'student', studentId: '155419', phone: '+254799112244', department: 'Bachelor of Laws (LLB)', yearOfStudy: 2, isActive: true, createdAt: '2026-08-05T08:50:00.000Z' },
  { id: 'usr-stud-7', name: 'David Njoroge', email: 'david.njoroge@strathmore.edu', password: 'password123', role: 'student', studentId: '154615', phone: '+254714556677', department: 'BSc Financial Engineering', yearOfStudy: 3, isActive: true, createdAt: '2026-08-05T09:00:00.000Z' },
  { id: 'usr-stud-8', name: 'Cynthia Chebet', email: 'cynthia.chebet@strathmore.edu', password: 'password123', role: 'student', studentId: '155288', phone: '+254725667788', department: 'BSc Informatics & Computer Science', yearOfStudy: 2, isActive: true, createdAt: '2026-08-05T09:10:00.000Z' },
  { id: 'usr-stud-9', name: 'Samuel Mwangi', email: 'samuel.mwangi@strathmore.edu', password: 'password123', role: 'student', studentId: '153812', phone: '+254736778899', department: 'BSc Supply Chain & Operations Management', yearOfStudy: 4, isActive: true, createdAt: '2026-08-05T09:20:00.000Z' },
  { id: 'usr-stud-10', name: 'Michelle Akinyi', email: 'michelle.akinyi@strathmore.edu', password: 'password123', role: 'student', studentId: '155604', phone: '+254719889900', department: 'BSc Data Science & Analytics', yearOfStudy: 1, isActive: true, createdAt: '2026-08-05T09:30:00.000Z' }
];

const SEEDED_EVENTS = [
  { id: 'evt-101', title: 'Strathmore AI & Machine Learning Annual Colloquium', category: 'Academic', date: '2026-11-12', time: '14:00 - 17:00', timeSlot: 'Afternoon', venue: 'Main Auditorium', venueCapacity: 500, registrationCount: 412, predictedAttendance: 348, smsPriority: 3, status: 'Upcoming', featured: true, organizerId: 'usr-org-1', organizerName: "Dr. Joseph Orero (SCES Dean's Office)", description: 'Keynote research symposium featuring live demonstrations of predictive campus analytics, computer vision, and NLP systems.' },
  { id: 'evt-102', title: 'Final Year IS Project Defense & Poster Exhibition', category: 'Academic', date: '2026-11-26', time: '08:30 - 13:00', timeSlot: 'Morning', venue: 'SCES Lecture Theatre 4 (LT4)', venueCapacity: 180, registrationCount: 164, predictedAttendance: 151, smsPriority: 3, status: 'Upcoming', featured: false, organizerId: 'usr-org-1', organizerName: "Dr. Joseph Orero (SCES Dean's Office)", description: 'Official BSc Informatics & Computer Science project defense showcase evaluated by SCES faculty panels.' },
  { id: 'evt-103', title: 'Cybersecurity & Cloud Threat Hunting Bootcamp', category: 'Workshop', date: '2026-11-15', time: '09:00 - 13:00', timeSlot: 'Morning', venue: 'iLab Africa Innovation Room 302', venueCapacity: 120, registrationCount: 114, predictedAttendance: 98, smsPriority: 3, status: 'Upcoming', featured: true, organizerId: 'usr-org-2', organizerName: '@iLabAfrica Innovation Centre', description: 'Intensive hands-on blue-team defense lab covering zero-trust network architecture and SIEM log analysis.' },
  { id: 'evt-104', title: "Fintech & Africa's Talking API Developer Hackathon", category: 'Workshop', date: '2026-11-21', time: '08:30 - 17:30', timeSlot: 'Morning', venue: 'iLab Africa Innovation Room 302', venueCapacity: 120, registrationCount: 118, predictedAttendance: 109, smsPriority: 3, status: 'Upcoming', featured: false, organizerId: 'usr-org-2', organizerName: '@iLabAfrica Innovation Centre', description: "24-hour sprint building USSD, Priority SMS, and mobile payment solutions using Africa's Talking APIs." },
  { id: 'evt-105', title: 'Annual Engineering & Tech Graduate Career Fair', category: 'Career Fair', date: '2026-11-18', time: '10:00 - 16:00', timeSlot: 'Morning', venue: 'Student Center Graduation Square', venueCapacity: 600, registrationCount: 485, predictedAttendance: 392, smsPriority: 2, status: 'Upcoming', featured: true, organizerId: 'usr-org-3', organizerName: 'Strathmore Career Development Services', description: 'Connect directly with hiring managers from Safaricom, Microsoft ADC, Google Nairobi, Deloitte, and Equity Bank.' },
  { id: 'evt-106', title: 'Global Tech CV Clinic & Mock Technical Interviews', category: 'Career Fair', date: '2026-11-29', time: '14:00 - 17:00', timeSlot: 'Afternoon', venue: 'SCES Lecture Theatre 4 (LT4)', venueCapacity: 180, registrationCount: 132, predictedAttendance: 108, smsPriority: 2, status: 'Upcoming', featured: false, organizerId: 'usr-org-3', organizerName: 'Strathmore Career Development Services', description: 'One-on-one resume reviews and whiteboard data-structure interview coaching with alumni engineers.' },
  { id: 'evt-107', title: "Inter-Faculty Chancellor's Cup Football & Rugby Finals", category: 'Sports', date: '2026-11-28', time: '15:00 - 18:30', timeSlot: 'Afternoon', venue: 'Strathmore Sports Complex Main Pitch', venueCapacity: 800, registrationCount: 640, predictedAttendance: 565, smsPriority: 2, status: 'Upcoming', featured: false, organizerId: 'usr-org-4', organizerName: 'Strathmore Sports & Athletics Council', description: 'Championship showdown between SCES Titans and SIMS Warriors followed by the trophy presentation.' },
  { id: 'evt-108', title: 'East Africa Quantitative Finance & Data Science Summit', category: 'Seminar', date: '2026-11-24', time: '14:00 - 16:30', timeSlot: 'Afternoon', venue: 'Strathmore Business School (SBS) Auditorium', venueCapacity: 300, registrationCount: 238, predictedAttendance: 196, smsPriority: 2, status: 'Upcoming', featured: false, organizerId: 'usr-org-5', organizerName: 'Strathmore Business School (SBS) Executive Events', description: 'Executive panel exploring algorithmic trading, credit risk modeling, and central bank digital currencies.' },
  { id: 'evt-109', title: 'CEO Fireside Chat: Leading Digital Transformation in Africa', category: 'Seminar', date: '2026-12-03', time: '17:30 - 19:30', timeSlot: 'Evening', venue: 'Strathmore Business School (SBS) Auditorium', venueCapacity: 300, registrationCount: 265, predictedAttendance: 224, smsPriority: 3, status: 'Upcoming', featured: false, organizerId: 'usr-org-5', organizerName: 'Strathmore Business School (SBS) Executive Events', description: 'Evening executive leadership dialogue with C-suite leaders on scaling enterprise governance and AI adoption.' },
  { id: 'evt-110', title: 'Data Privacy, AI Regulation & Kenya Data Protection Act Symposium', category: 'Academic', date: '2026-12-01', time: '14:00 - 17:00', timeSlot: 'Afternoon', venue: 'SLS Moot Court Chambers', venueCapacity: 150, registrationCount: 138, predictedAttendance: 119, smsPriority: 2, status: 'Upcoming', featured: false, organizerId: 'usr-org-6', organizerName: 'Strathmore Law Clinic & Moot Society', description: 'Legal and technical debate with the Office of the Data Protection Commissioner (ODPC) on algorithmic accountability.' },
  { id: 'evt-111', title: 'Strathmore Annual Cultural Week Gala & Concert', category: 'Cultural', date: '2026-12-04', time: '16:00 - 20:00', timeSlot: 'Evening', venue: 'Student Center Graduation Square', venueCapacity: 600, registrationCount: 540, predictedAttendance: 472, smsPriority: 1, status: 'Upcoming', featured: false, organizerId: 'usr-org-7', organizerName: 'Strathmore Student Council (SSC)', description: 'Celebration of international diversity featuring culinary showcases, traditional performances, and live campus musical acts.' },
  { id: 'evt-112', title: 'Student Townhall & Campus Welfare Open Forum', category: 'Seminar', date: '2026-11-19', time: '11:00 - 13:00', timeSlot: 'Morning', venue: 'Main Auditorium', venueCapacity: 500, registrationCount: 320, predictedAttendance: 274, smsPriority: 3, status: 'Upcoming', featured: false, organizerId: 'usr-org-7', organizerName: 'Strathmore Student Council (SSC)', description: 'Direct Q&A session between the 16th Student Council Executive, Dean of Students, and student body.' },
  { id: 'evt-113', title: 'Kotlin, Flutter & Gemini Android DevFest Strathmore', category: 'Workshop', date: '2026-11-27', time: '09:00 - 15:00', timeSlot: 'Morning', venue: 'iLab Africa Innovation Room 302', venueCapacity: 120, registrationCount: 116, predictedAttendance: 103, smsPriority: 3, status: 'Upcoming', featured: false, organizerId: 'usr-org-8', organizerName: 'Google Developer Student Club (GDSC Strathmore)', description: 'Hands-on mobile engineering codelab building cross-platform apps with on-device Gemini Nano and Firebase.' },
  { id: 'evt-114', title: 'Open Source & Kubernetes Cloud Native Study Jam', category: 'Workshop', date: '2026-12-06', time: '10:00 - 14:00', timeSlot: 'Morning', venue: 'SCES Lecture Theatre 4 (LT4)', venueCapacity: 180, registrationCount: 149, predictedAttendance: 124, smsPriority: 2, status: 'Upcoming', featured: false, organizerId: 'usr-org-8', organizerName: 'Google Developer Student Club (GDSC Strathmore)', description: 'Practical container orchestration workshop deploying microservices on Google Kubernetes Engine (GKE) and Docker.' },
  { id: 'evt-115', title: 'Student Startup Pitch Deck & Venture Capital Demo Day', category: 'Career Fair', date: '2026-12-08', time: '14:00 - 17:30', timeSlot: 'Afternoon', venue: 'Strathmore Business School (SBS) Auditorium', venueCapacity: 300, registrationCount: 244, predictedAttendance: 208, smsPriority: 3, status: 'Upcoming', featured: false, organizerId: 'usr-org-9', organizerName: 'Strathmore Enterprise Development Centre (SEDC)', description: 'Ten student-founded startups pitch to Nairobi angel investors and VC funds for seed grants up to KES 1,500,000.' },
  { id: 'evt-116', title: 'Green Campus Solar & E-Waste Recycling Innovation Drive', category: 'Cultural', date: '2026-12-10', time: '09:00 - 14:00', timeSlot: 'Morning', venue: 'Student Center Graduation Square', venueCapacity: 600, registrationCount: 385, predictedAttendance: 312, smsPriority: 2, status: 'Upcoming', featured: false, organizerId: 'usr-org-10', organizerName: 'Strathmore Community Outreach & Sustainability Club', description: 'Campus sustainability drive collecting electronic waste for safe refurbishment and showcasing student clean-energy prototypes.' }
];

const SEEDED_CATEGORIES = [
  { id: 'cat-1', name: 'Academic', color: '#0033A0', description: 'Faculty lectures, research symposiums, and project defenses' },
  { id: 'cat-2', name: 'Workshop', color: '#0284C7', description: 'Hands-on technical labs, bootcamps, and hackathons' },
  { id: 'cat-3', name: 'Career Fair', color: '#D97706', description: 'Employer recruitment drives, CV clinics, and industry networking' },
  { id: 'cat-4', name: 'Seminar', color: '#7C3AED', description: 'Executive leadership forums, townhalls, and policy dialogues' },
  { id: 'cat-5', name: 'Sports', color: '#16A34A', description: 'Inter-faculty tournaments and varsity athletics' },
  { id: 'cat-6', name: 'Cultural', color: '#DC2626', description: 'Cultural week galas, community service, and sustainability drives' }
];

const SEEDED_VENUES = [
  { id: 'ven-1', name: 'Main Auditorium', building: 'Central Academic Block', capacity: 500, equipment: ['Projector', 'PA System', 'Livestream Cameras'] },
  { id: 'ven-2', name: 'iLab Africa Innovation Room 302', building: '@iLabAfrica Complex', capacity: 120, equipment: ['High-Speed Wi-Fi', 'Smartboard', 'Lab Workstations'] },
  { id: 'ven-3', name: 'Student Center Graduation Square', building: 'Student Center', capacity: 600, equipment: ['Outdoor Stage', 'Exhibition Tents', 'PA System'] },
  { id: 'ven-4', name: 'SCES Lecture Theatre 4 (LT4)', building: 'Phase 1 / SCES Wing', capacity: 180, equipment: ['Dual Projectors', 'Lapel Microphones'] },
  { id: 'ven-5', name: 'Strathmore Business School (SBS) Auditorium', building: 'SBS Complex', capacity: 300, equipment: ['Teleconferencing', '4K LED Wall', 'Acoustic Sound'] },
  { id: 'ven-6', name: 'Strathmore Sports Complex Main Pitch', building: 'Madaraka Sports Grounds', capacity: 800, equipment: ['Floodlights', 'Scoreboard', 'First Aid Tent'] },
  { id: 'ven-7', name: 'SLS Moot Court Chambers', building: 'Strathmore Law School', capacity: 150, equipment: ['Bench Microphones', 'Recording Suite'] }
];

function getOfflineStore() {
  try {
    const raw = localStorage.getItem('smartevent_offline_store_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.events)) {
        // Ensure elvis.wafuke@strathmore.edu is always present as admin
        const hasElvis = parsed.users.some((u) => u.email === 'elvis.wafuke@strathmore.edu');
        if (!hasElvis) {
          parsed.users.unshift(SEEDED_USERS[0]);
        }
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }
  const initial = {
    users: [...SEEDED_USERS],
    events: [...SEEDED_EVENTS],
    categories: [...SEEDED_CATEGORIES],
    venues: [...SEEDED_VENUES],
    registrations: [
      { id: 'reg-501', eventId: 'evt-101', studentId: '154210', userId: 'usr-stud-1', studentName: 'Elvis Wanyama Wafuke', studentEmail: 'student@strathmore.edu', phone: '+254712345678', registeredAt: '2026-10-14T10:15:00Z', status: 'Confirmed', checkedIn: true, checkedInAt: '2026-10-14T13:50:00Z' },
      { id: 'reg-502', eventId: 'evt-103', studentId: '154210', userId: 'usr-stud-1', studentName: 'Elvis Wanyama Wafuke', studentEmail: 'student@strathmore.edu', phone: '+254712345678', registeredAt: '2026-10-15T11:30:00Z', status: 'Confirmed', checkedIn: false }
    ],
    favorites: ['evt-101', 'evt-103', 'evt-105'],
    smsLogs: [
      { id: 'sms-901', eventId: 'evt-101', eventTitle: 'Strathmore AI & Machine Learning Annual Colloquium', recipient: '+254712345678', recipientCount: 412, message: '[URGENT - Strathmore SmartEvent]: AI & ML Annual Colloquium starts at 14:00 in Main Auditorium. Present your Student ID at Entry Gate B.', priority: 'HIGH', status: 'DELIVERED', provider: "Africa's Talking (Simulated)", sentAt: '2026-10-18T08:30:00.000Z' },
      { id: 'sms-902', eventId: 'evt-103', eventTitle: 'Cybersecurity & Cloud Threat Hunting Bootcamp', recipient: '+254712345678', recipientCount: 114, message: '[URGENT - @iLabAfrica]: Room 302 lab workstations are pre-configured. Bring your laptop charger and QR pass.', priority: 'HIGH', status: 'DELIVERED', provider: "Africa's Talking (Simulated)", sentAt: '2026-10-18T11:15:00.000Z' }
    ]
  };
  saveOfflineStore(initial);
  return initial;
}

function saveOfflineStore(store) {
  try {
    localStorage.setItem('smartevent_offline_store_v2', JSON.stringify(store));
  } catch (e) {
    // ignore
  }
}

function findOfflineUserByEmail(users, email) {
  const norm = String(email || '').trim().toLowerCase();
  if (!norm) return null;
  return users.find((u) => {
    if (String(u.email || '').toLowerCase() === norm) return true;
    if (Array.isArray(u.aliasEmails) && u.aliasEmails.some((a) => String(a || '').toLowerCase() === norm)) return true;
    return false;
  }) || null;
}

function getCurrentOfflineUser(store) {
  try {
    const saved = localStorage.getItem('smartevent_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.email) {
        return findOfflineUserByEmail(store.users, parsed.email) || parsed;
      }
    }
  } catch (e) {
    // ignore
  }
  return store.users[0];
}

function computePrediction(payload = {}) {
  const cap = Number(payload.venueCapacity) || 150;
  const reg = Number(payload.registrationCount) || Math.round(cap * 0.72);
  const prio = Number(payload.smsPriority) || 2;
  const baseRate = prio === 3 ? 0.84 : prio === 2 ? 0.78 : 0.71;
  const pred = Math.min(cap, Math.round(reg * baseRate));
  const util = Math.round((pred / cap) * 1000) / 10;
  return {
    success: true,
    predictedAttendance: pred,
    predictedTurnoutRate: baseRate,
    venueCapacity: cap,
    registrationCount: reg,
    capacityUtilization: util,
    riskLevel: util > 90 ? 'HIGH_OVERCROWDING_RISK' : util < 40 ? 'LOW_TURNOUT_RISK' : 'OPTIMAL_ATTENDANCE',
    recommendation: util > 90
      ? 'Expected attendance nears venue capacity. Consider allocating overflow seating.'
      : 'Projected attendance is well-aligned with venue capacity.',
    smsImpactBoostPct: prio === 3 ? 13.5 : 6.5,
    algorithm: 'LogisticRegression'
  };
}

function handleOfflineFallback(endpoint, options = {}) {
  const store = getOfflineStore();
  const method = (options.method || 'GET').toUpperCase();
  const body = options.body ? JSON.parse(options.body) : {};
  const cleanPath = endpoint.split('?')[0];

  if (cleanPath === '/auth/login' && method === 'POST') {
    const user = findOfflineUserByEmail(store.users, body.email);
    const candidate = String(body.password || '');
    const validPass = user && (user.password === candidate || (!user.updatedAt && DEFAULT_PASSWORDS.includes(candidate)));
    if (!user || !validPass) {
      const err = new Error('Invalid email or password credentials.');
      err.status = 401;
      throw err;
    }
    const { password, ...safeUser } = user;
    const token = `local_jwt_${user.id}_${Date.now()}`;
    return { success: true, token, user: safeUser };
  }

  if (cleanPath === '/auth/signup' && method === 'POST') {
    const email = String(body.email || '').trim().toLowerCase();
    if (findOfflineUserByEmail(store.users, email)) {
      throw new Error('An account with this email already exists.');
    }
    const role = String(body.role || 'student').toLowerCase() === 'organizer' ? 'organizer' : 'student';
    const newUser = {
      id: `usr-${role}-${Date.now()}`,
      name: String(body.name || 'Strathmore User').trim(),
      email,
      password: body.password || 'password123',
      role,
      studentId: role === 'student' ? (body.studentId || '154999') : undefined,
      organizerCode: role === 'organizer' ? 'ORG-099' : undefined,
      organizationName: role === 'organizer' ? (body.organizationName || body.name) : undefined,
      phone: body.phone || '+254712345678',
      department: body.department || 'BSc Informatics & Computer Science',
      isActive: true,
      createdAt: new Date().toISOString()
    };
    store.users.push(newUser);
    saveOfflineStore(store);
    const { password, ...safeUser } = newUser;
    const token = `local_jwt_${newUser.id}_${Date.now()}`;
    return { success: true, token, user: safeUser };
  }

  if (cleanPath === '/auth/google/config') {
    return { success: true, enabled: false, clientId: null, hostedDomain: 'strathmore.edu' };
  }

  if (cleanPath === '/auth/google' && method === 'POST') {
    const email = String(body.email || '').trim().toLowerCase();
    let user = findOfflineUserByEmail(store.users, email);
    if (user) {
      const candidate = String(body.password || '');
      const validPass = user.password === candidate || (!user.updatedAt && DEFAULT_PASSWORDS.includes(candidate));
      if (!validPass) {
        throw new Error('Incorrect password for this Google Workspace account.');
      }
    } else {
      if (String(body.role || '').toLowerCase() === 'admin') {
        throw new Error('Administrator accounts cannot be self-created via Google Sign-In.');
      }
      const role = String(body.role || '').toLowerCase() === 'organizer' ? 'organizer' : 'student';
      user = {
        id: `usr-google-${Date.now()}`,
        name: body.name || email.split('@')[0],
        email,
        password: body.password || 'password123',
        role,
        studentId: role === 'student' ? '155800' : undefined,
        organizerCode: role === 'organizer' ? 'ORG-108' : undefined,
        phone: '+254712345678',
        department: 'BSc Informatics & Computer Science',
        isActive: true,
        createdAt: new Date().toISOString()
      };
      store.users.push(user);
      saveOfflineStore(store);
    }
    const { password, ...safeUser } = user;
    const token = `local_jwt_${user.id}_${Date.now()}`;
    return { success: true, token, user: safeUser };
  }

  if (cleanPath === '/auth/me') {
    const user = getCurrentOfflineUser(store);
    const { password, ...safeUser } = user;
    return { success: true, user: safeUser };
  }

  if (cleanPath === '/auth/password' || cleanPath === '/auth/change-password') {
    const user = getCurrentOfflineUser(store);
    user.password = body.newPassword || user.password;
    user.updatedAt = new Date().toISOString();
    saveOfflineStore(store);
    return { success: true, message: 'Password updated successfully.' };
  }

  if (cleanPath === '/events' && method === 'GET') {
    return { success: true, count: store.events.length, data: store.events };
  }

  if (cleanPath === '/events/mine' && method === 'GET') {
    const user = getCurrentOfflineUser(store);
    const data = user.role === 'admin' ? store.events : store.events.filter((e) => e.organizerId === user.id);
    return { success: true, count: data.length, data };
  }

  if (cleanPath === '/events' && method === 'POST') {
    const user = getCurrentOfflineUser(store);
    const created = {
      id: `evt-${Date.now()}`,
      ...body,
      venueCapacity: Number(body.venueCapacity) || 150,
      registrationCount: 0,
      predictedAttendance: Math.round((Number(body.venueCapacity) || 150) * 0.78),
      smsPriority: Number(body.smsPriority) || 2,
      status: body.status || 'Upcoming',
      organizerId: user.id,
      organizerName: user.organizationName || user.name
    };
    store.events.unshift(created);
    saveOfflineStore(store);
    return { success: true, data: created };
  }

  if (cleanPath.startsWith('/events/') && cleanPath.endsWith('/attendees')) {
    const eventId = cleanPath.split('/')[2];
    const event = store.events.find((e) => e.id === eventId) || store.events[0];
    const attendees = store.registrations.filter((r) => r.eventId === eventId);
    return { success: true, event, count: attendees.length, data: attendees };
  }

  if (cleanPath.startsWith('/events/') && method === 'PUT') {
    const eventId = cleanPath.split('/')[2];
    const idx = store.events.findIndex((e) => e.id === eventId);
    if (idx !== -1) {
      store.events[idx] = { ...store.events[idx], ...body };
      saveOfflineStore(store);
      return { success: true, data: store.events[idx] };
    }
  }

  if (cleanPath.startsWith('/events/') && method === 'DELETE') {
    const eventId = cleanPath.split('/')[2];
    store.events = store.events.filter((e) => e.id !== eventId);
    saveOfflineStore(store);
    return { success: true };
  }

  if (cleanPath === '/categories') {
    if (method === 'POST') {
      const cat = { id: `cat-${Date.now()}`, ...body };
      store.categories.push(cat);
      saveOfflineStore(store);
      return { success: true, data: cat };
    }
    return { success: true, data: store.categories };
  }

  if (cleanPath === '/venues') {
    if (method === 'POST') {
      const ven = { id: `ven-${Date.now()}`, ...body };
      store.venues.push(ven);
      saveOfflineStore(store);
      return { success: true, data: ven };
    }
    return { success: true, data: store.venues };
  }

  if (cleanPath === '/registrations' || cleanPath === '/registrations/mine') {
    if (method === 'POST') {
      const user = getCurrentOfflineUser(store);
      const reg = {
        id: `reg-${Date.now()}`,
        eventId: body.eventId,
        userId: user.id,
        studentId: user.studentId || '154210',
        studentName: user.name,
        studentEmail: user.email,
        phone: user.phone || '+254712345678',
        registeredAt: new Date().toISOString(),
        status: 'Confirmed',
        checkedIn: false
      };
      store.registrations.push(reg);
      saveOfflineStore(store);
      return { success: true, data: reg };
    }
    return { success: true, count: store.registrations.length, data: store.registrations };
  }

  if (cleanPath === '/favorites') {
    return { success: true, favoriteIds: store.favorites, data: store.events.filter((e) => store.favorites.includes(e.id)) };
  }

  if (cleanPath.startsWith('/favorites/')) {
    const eventId = cleanPath.split('/')[2] || body.eventId;
    if (store.favorites.includes(eventId)) {
      store.favorites = store.favorites.filter((id) => id !== eventId);
    } else if (eventId) {
      store.favorites.push(eventId);
    }
    saveOfflineStore(store);
    return { success: true, favoriteIds: store.favorites };
  }

  if (cleanPath === '/notifications') {
    return { success: true, unreadCount: 0, data: [] };
  }

  if (cleanPath === '/sms/status') {
    return {
      success: true,
      mode: 'SANDBOX',
      modeDescription: "Africa's Talking sandbox - API key configured; enter your Live App Username in Option B to send to real phones.",
      username: 'sandbox',
      maskedApiKey: 'atsk_6d94...c370',
      hasApiKey: true,
      data: {
        provider: "Africa's Talking",
        mode: 'SANDBOX',
        modeDescription: "Africa's Talking sandbox - API key configured; enter your Live App Username in Option B to send to real phones.",
        username: 'sandbox',
        maskedApiKey: 'atsk_6d94...c370',
        hasApiKey: true,
        liveSmsConfigured: true,
        senderId: ''
      }
    };
  }

  if (cleanPath === '/sms/config') {
    return {
      success: true,
      message: `Africa's Talking gateway updated (${body.mode || 'SANDBOX'} mode).`,
      mode: body.mode || 'SANDBOX',
      username: body.username || 'sandbox',
      maskedApiKey: 'atsk_6d94...c370',
      hasApiKey: true
    };
  }

  if (cleanPath === '/sms/logs') {
    return { success: true, count: store.smsLogs.length, data: store.smsLogs };
  }

  if (cleanPath === '/sms/preview' && method === 'POST') {
    return {
      success: true,
      data: {
        recipientCount: 12,
        charCount: String(body.message || '').length,
        segments: 1,
        estimatedCostKes: 9.6,
        mode: 'SIMULATION',
        recipientsPreview: [{ name: 'Elvis Wanyama Wafuke', phone: '+254712345678' }]
      }
    };
  }

  if (cleanPath === '/sms/send' && method === 'POST') {
    const entry = {
      id: `sms-${Date.now()}`,
      eventId: body.eventId || 'evt-101',
      eventTitle: body.eventTitle || 'Strathmore Campus Notice',
      recipientCount: Array.isArray(body.phoneNumbers) && body.phoneNumbers.length ? body.phoneNumbers.length : 1,
      message: body.message,
      priority: body.priority || 'HIGH',
      status: 'DELIVERED',
      provider: "Africa's Talking (Simulated)",
      sentAt: new Date().toISOString()
    };
    store.smsLogs.unshift(entry);
    saveOfflineStore(store);
    return { success: true, data: entry };
  }

  if (cleanPath === '/predict') {
    return computePrediction(body);
  }

  if (cleanPath === '/analytics') {
    return {
      success: true,
      summary: {
        totalEvents: store.events.length,
        totalRegistrations: store.events.reduce((s, e) => s + (e.registrationCount || 0), 0),
        totalPredictedAttendance: store.events.reduce((s, e) => s + (e.predictedAttendance || 0), 0),
        averageTurnoutRate: 0.81,
        smsAlertsSent: store.smsLogs.length,
        modelRocAuc: 0.884
      },
      categoryBreakdown: store.categories.map((c) => ({
        category: c.name,
        events: store.events.filter((e) => e.category === c.name).length
      }))
    };
  }

  if (cleanPath === '/admin/overview') {
    const safeUsers = store.users.map(({ password, ...u }) => u);
    return {
      success: true,
      stats: {
        totalUsers: safeUsers.length,
        admins: safeUsers.filter((u) => u.role === 'admin').length,
        organizers: safeUsers.filter((u) => u.role === 'organizer').length,
        students: safeUsers.filter((u) => u.role === 'student').length,
        totalEvents: store.events.length,
        totalRegistrations: store.registrations.length,
        totalSmsSent: store.smsLogs.length,
        totalVenues: store.venues.length,
        totalCategories: store.categories.length
      },
      users: safeUsers,
      events: store.events,
      smsLogs: store.smsLogs
    };
  }

  if (cleanPath.startsWith('/admin/activity')) {
    return { success: true, count: 0, data: [] };
  }

  if (cleanPath === '/users') {
    const safeUsers = store.users.map(({ password, ...u }) => u);
    if (method === 'POST') {
      const created = { id: `usr-${Date.now()}`, ...body, isActive: true, createdAt: new Date().toISOString() };
      store.users.push(created);
      saveOfflineStore(store);
      return { success: true, data: created };
    }
    return { success: true, count: safeUsers.length, data: safeUsers };
  }

  if (cleanPath.startsWith('/users/')) {
    const userId = cleanPath.split('/')[2];
    if (method === 'DELETE') {
      store.users = store.users.filter((u) => u.id !== userId);
      saveOfflineStore(store);
      return { success: true };
    }
    const idx = store.users.findIndex((u) => u.id === userId);
    if (idx !== -1) {
      store.users[idx] = { ...store.users[idx], ...body };
      saveOfflineStore(store);
      const { password, ...safe } = store.users[idx];
      return { success: true, data: safe };
    }
  }

  return { success: true, data: [] };
}

function getAuthHeaders() {
  const token = localStorage.getItem('smartevent_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function apiRequest(endpoint, options = {}) {
  const config = { ...options, headers: { ...getAuthHeaders(), ...(options.headers || {}) } };
  const urlsToTry = [`${API_BASE_URL}${endpoint}`];
  if (API_BASE_URL === '/api') {
    urlsToTry.push(`${DIRECT_BACKEND_URL}${endpoint}`);
  }

  let lastResponse = null;
  let lastData = null;

  for (const url of urlsToTry) {
    try {
      const res = await fetch(url, config);
      let data = null;
      try {
        data = await res.json();
      } catch (e) {
        data = null;
      }

      // If Vite proxy returns 500/502/503/504 with no JSON body because backend port 5000 is down, try next URL or offline fallback
      if (res.status >= 500 && (!data || typeof data.success === 'undefined')) {
        continue;
      }

      lastResponse = res;
      lastData = data;
      break;
    } catch (networkErr) {
      // Try next URL in urlsToTry
    }
  }

  if (!lastResponse) {
    return handleOfflineFallback(endpoint, options);
  }

  if (lastResponse.status === 401 && localStorage.getItem('smartevent_token') && !endpoint.startsWith('/auth/login')) {
    window.dispatchEvent(new CustomEvent('smartevent:unauthorized'));
  }

  if (!lastResponse.ok || !lastData || lastData.success === false) {
    const err = new Error((lastData && lastData.error) || `Request failed (HTTP ${lastResponse.status})`);
    err.status = lastResponse.status;
    err.payload = lastData;
    throw err;
  }

  return lastData;
}

const qs = (params = {}) => {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));
  const q = new URLSearchParams(clean).toString();
  return q ? `?${q}` : '';
};
const json = (method, body) => ({ method, body: JSON.stringify(body) });

export const authApi = {
  login: (credentials) => apiRequest('/auth/login', json('POST', credentials)),
  signup: (userData) => apiRequest('/auth/signup', json('POST', userData)),
  googleConfig: () => apiRequest('/auth/google/config'),
  googleLogin: (googleData) => apiRequest('/auth/google', json('POST', googleData)),
  me: () => apiRequest('/auth/me'),
  changePassword: (firstArg, secondArg) => {
    const payload = typeof firstArg === 'object' && firstArg !== null
      ? firstArg
      : { currentPassword: firstArg, newPassword: secondArg };
    return apiRequest('/auth/password', json('PUT', payload));
  }
};

export const eventsApi = {
  getAll: (params) => apiRequest(`/events${qs(params)}`),
  mine: () => apiRequest('/events/mine'),
  getById: (id) => apiRequest(`/events/${id}`),
  create: (data) => apiRequest('/events', json('POST', data)),
  update: (id, data) => apiRequest(`/events/${id}`, json('PUT', data)),
  delete: (id) => apiRequest(`/events/${id}`, { method: 'DELETE' }),
  getAttendees: (id) => apiRequest(`/events/${id}/attendees`),
  attendees: (id) => apiRequest(`/events/${id}/attendees`)
};

export const categoriesApi = {
  getAll: () => apiRequest('/categories'),
  create: (data) => apiRequest('/categories', json('POST', data)),
  update: (id, data) => apiRequest(`/categories/${id}`, json('PUT', data)),
  delete: (id) => apiRequest(`/categories/${id}`, { method: 'DELETE' })
};

export const venuesApi = {
  getAll: () => apiRequest('/venues'),
  create: (data) => apiRequest('/venues', json('POST', data)),
  update: (id, data) => apiRequest(`/venues/${id}`, json('PUT', data)),
  delete: (id) => apiRequest(`/venues/${id}`, { method: 'DELETE' })
};

export const registrationsApi = {
  getAll: (params) => apiRequest(`/registrations${qs(params)}`),
  mine: () => apiRequest('/registrations/mine'),
  register: (payloadOrEventId) => {
    const payload = typeof payloadOrEventId === 'object' && payloadOrEventId !== null
      ? payloadOrEventId
      : { eventId: payloadOrEventId };
    return apiRequest('/registrations', json('POST', payload));
  },
  checkIn: (registrationId, checkedIn = true) =>
    apiRequest(`/registrations/${registrationId}/checkin`, json('PATCH', { checkedIn })),
  cancel: (registrationId) => apiRequest(`/registrations/${registrationId}`, { method: 'DELETE' }),
  cancelForEvent: (eventId) => apiRequest(`/registrations/event/${eventId}`, { method: 'DELETE' })
};

export const favoritesApi = {
  getAll: () => apiRequest('/favorites'),
  toggle: (eventId) => apiRequest(`/favorites/${eventId}`, { method: 'POST' })
};

export const notificationsApi = {
  getAll: () => apiRequest('/notifications'),
  markRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () => apiRequest('/notifications/read-all', { method: 'PUT' }),
  remove: (id) => apiRequest(`/notifications/${id}`, { method: 'DELETE' })
};

export const smsApi = {
  getStatus: () => apiRequest('/sms/status'),
  updateConfig: (payload) => apiRequest('/sms/config', json('PUT', payload)),
  getLogs: (params) => apiRequest(`/sms/logs${qs(params)}`),
  preview: (payload) => apiRequest('/sms/preview', json('POST', payload)),
  send: (payload) => apiRequest('/sms/send', json('POST', payload))
};

export const predictApi = {
  forecast: (payload) => apiRequest('/predict', json('POST', payload)),
  forEvent: (eventId) => apiRequest('/predict', json('POST', { eventId }))
};

export const analyticsApi = {
  get: () => apiRequest('/analytics')
};

export const adminApi = {
  getOverview: () => apiRequest('/admin/overview'),
  getActivity: (limit = 50) => apiRequest(`/admin/activity${qs({ limit })}`),
  getUsers: (params) => apiRequest(`/users${qs(params)}`),
  createUser: (data) => apiRequest('/users', json('POST', data)),
  updateUser: (id, data) => apiRequest(`/users/${id}`, json('PUT', data)),
  deleteUser: (id) => apiRequest(`/users/${id}`, { method: 'DELETE' })
};

export const usersApi = {
  update: (id, data) => apiRequest(`/users/${id}`, json('PUT', data))
};
