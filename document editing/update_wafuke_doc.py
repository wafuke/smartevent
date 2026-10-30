"""
Updates WafukeElvis-154210.docx with completed Chapters 4 and 5 (plus Chapter 6, updated Abstract,
and past-tense transition in Chapter 3), adhering strictly to the Strathmore University Research
Writing Guidelines and Elvis Wahome Makara's structural exemplar.

Formatting rules enforced:
- Font: Times New Roman, 12 pt across the document
- Paragraph alignment: Justified for body text, Centered for Chapter headings (Heading 1),
  Centered for Figures, Figure Captions, Tables, Table Captions, and Equations
- Chapters 1-3 content and Mendeley citation fields preserved intact
"""
import os
import shutil
import docx
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

DOC_PATH = r"C:\Users\userss\Desktop\is project stuff\WafukeElvis-154210.docx"
BACKUP_PATH = r"C:\Users\userss\Desktop\is project stuff\WafukeElvis-154210_Backup_Before_Update.docx"
FIG_DIR = r"C:\Users\userss\Desktop\is project stuff\smartevent\ml-service\reports\figures"

# Create safety backup first, or restore from backup so script is idempotent
if not os.path.exists(BACKUP_PATH):
    shutil.copy2(DOC_PATH, BACKUP_PATH)
    print(f"Created backup at: {BACKUP_PATH}")
else:
    shutil.copy2(BACKUP_PATH, DOC_PATH)
    print(f"Restored clean copy from backup: {BACKUP_PATH}")

doc = docx.Document(DOC_PATH)


def set_run_tnr12(run, bold=None, italic=None, color_rgb=None, size_pt=12):
    run.font.name = "Times New Roman"
    run.font.size = Pt(size_pt)
    if bold is not None:
        run.bold = bold
    if italic is not None:
        run.italic = italic
    if color_rgb is not None:
        run.font.color.rgb = RGBColor(*color_rgb)
    # Ensure XML rFonts explicitly specifies Times New Roman for all scripts
    rPr = run._r.get_or_add_rPr()
    rFonts = rPr.find(qn("w:rFonts"))
    if rFonts is None:
        rFonts = OxmlElement("w:rFonts")
        rPr.insert(0, rFonts)
    for attr in ["w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"]:
        rFonts.set(qn(attr), "Times New Roman")
    for theme_attr in ["w:asciiTheme", "w:hAnsiTheme", "w:cstheme", "w:eastAsiaTheme"]:
        if qn(theme_attr) in rFonts.attrib:
            del rFonts.attrib[qn(theme_attr)]


def format_paragraph(p, align=WD_ALIGN_PARAGRAPH.JUSTIFY, line_spacing=1.5, space_before=0, space_after=6, bold=None, italic=None):
    p.alignment = align
    pf = p.paragraph_format
    pf.line_spacing = line_spacing
    pf.space_before = Pt(space_before)
    pf.space_after = Pt(space_after)
    for r in p.runs:
        set_run_tnr12(r, bold=bold, italic=italic, color_rgb=(0, 0, 0))


def replace_paragraph_text(p, new_text, style_name=None, align=WD_ALIGN_PARAGRAPH.JUSTIFY, bold=False, italic=False):
    if style_name:
        p.style = doc.styles[style_name]
    # Clear existing runs (only use on paragraphs without Mendeley SDTs or images!)
    for r in list(p.runs):
        p._p.remove(r._r)
    run = p.add_run(new_text)
    set_run_tnr12(run, bold=bold, italic=italic, color_rgb=(0, 0, 0))
    format_paragraph(p, align=align, bold=bold, italic=italic)
    return p


def update_runs_tense_in_place(p, replacements):
    """Safely replaces substrings inside a paragraph's text runs without disturbing Mendeley SDT citations."""
    for r in p.runs:
        txt = r.text
        if not txt:
            continue
        for old_s, new_s in replacements:
            if old_s in txt:
                txt = txt.replace(old_s, new_s)
        r.text = txt
        set_run_tnr12(r, color_rgb=(0, 0, 0))


# ==============================================================================
# 1. UPDATE GLOBAL STYLES TO TIMES NEW ROMAN 12 PT
# ==============================================================================
for style_name in ["Normal", "Normal (Web)", "List Paragraph", "Heading 1", "Heading 2", "Heading 3", "kevin", "Caption", "table of figures"]:
    if style_name in doc.styles:
        st = doc.styles[style_name]
        st.font.name = "Times New Roman"
        st.font.size = Pt(12)
        st.font.color.rgb = RGBColor(0, 0, 0)
        rPr = st._element.get_or_add_rPr()
        rFonts = rPr.find(qn("w:rFonts"))
        if rFonts is None:
            rFonts = OxmlElement("w:rFonts")
            rPr.insert(0, rFonts)
        for attr in ["w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"]:
            rFonts.set(qn(attr), "Times New Roman")
        for theme_attr in ["w:asciiTheme", "w:hAnsiTheme", "w:cstheme", "w:eastAsiaTheme"]:
            if qn(theme_attr) in rFonts.attrib:
                del rFonts.attrib[qn(theme_attr)]
        if style_name == "Caption":
            st.font.italic = False

# ==============================================================================
# 2. UPDATE COVER PAGE, DECLARATION & ABSTRACT TO FINAL DOCUMENTATION TENSE
# ==============================================================================
replace_paragraph_text(
    doc.paragraphs[12],
    "An Informatics and Computer Science Final Project Documentation Submitted to the School of Computing and Engineering Sciences in Partial Fulfillment of the Requirements for the Award of a Degree in Bachelor of Science in Informatics and Computer Science",
    align=WD_ALIGN_PARAGRAPH.CENTER, bold=True
)
replace_paragraph_text(doc.paragraphs[18], "October 2026", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True)

replace_paragraph_text(
    doc.paragraphs[21],
    "I declare that this work has not been previously submitted and approved for the award of a degree by this or any other University. To the best of my knowledge and belief, the research documentation contains no material previously published or written by another person except where due reference is made in the research documentation itself.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)

# Update Abstract (paragraphs 39, 40, 42) to reflect completed implementation & findings
replace_paragraph_text(
    doc.paragraphs[39],
    "University event coordination in institutions such as Strathmore University is frequently challenged by low student attendance, fragmented communication channels, and the limited use of data-driven decision-making tools. Event organizers traditionally rely on informal communication platforms such as messaging applications and social media, which lead to missed notifications, notification fatigue, and inefficient resource planning. This research designed, developed, and evaluated SmartEvent, a web and mobile-based university event management system integrated with a Priority-Based SMS Notification Engine and a machine learning attendance prediction module. The platform enables event organizers to create, manage, and monitor campus events through a centralized React.js dashboard while students browse events, complete one-tap registrations, and receive urgency-classified SMS notifications across High, Medium, and Low priority tiers.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)
replace_paragraph_text(
    doc.paragraphs[40],
    "The system was implemented using a four-tier full-stack architecture comprising React.js and React Native (Expo) on the client layer, Node.js with Express.js on the REST application layer, a Python FastAPI machine learning microservice, and Firebase Authentication and Firestore with a persistent JSON storage engine. Priority-based SMS dispatch was integrated using the Africa's Talking SMS Gateway API. To build the attendance prediction module, a 20,000-row Kaggle student attendance dataset was audited to remove post-event target leakage and combined with 700 simulated Strathmore University events (149,892 cleaned student-event registrations). Five models—Majority-Class Baseline, Logistic Regression, Decision Tree, Random Forest, and Gradient Boosting—were compared via 5-fold event-grouped cross-validation. The calibrated L2-regularized Logistic Regression model achieved the strongest probability calibration and generalization on 140 unseen future test events, recording an ROC-AUC of 0.7301, an F1-score of 0.8050, a recall of 95.87%, and an event-level headcount Mean Absolute Error (MAE) of 13.61 attendees (10.99% MAPE), outperforming both flat-rate and historical baselines.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)

# Format Keywords paragraph (paragraph 42): bold + italic per guidelines
p_kw = doc.paragraphs[42]
for r in list(p_kw.runs):
    p_kw._p.remove(r._r)
r_kw1 = p_kw.add_run("Keywords: ")
set_run_tnr12(r_kw1, bold=True, italic=True, color_rgb=(0, 0, 0))
r_kw2 = p_kw.add_run("Event Management, Priority-Based SMS Notification, Machine Learning, Attendance Prediction, Logistic Regression, Predictive Analytics")
set_run_tnr12(r_kw2, bold=True, italic=True, color_rgb=(0, 0, 0))
format_paragraph(p_kw, align=WD_ALIGN_PARAGRAPH.JUSTIFY, bold=True, italic=True)

# ==============================================================================
# 3. CONVERT FUTURE TENSE TO PAST TENSE IN CHAPTERS 1-3 (PRESERVING CONTENT & CITATIONS)
# ==============================================================================
tense_replacements = [
    ("This project proposes the development of", "This project developed"),
    ("the proposed system will classify messages", "the developed system classifies messages"),
    ("predictive analytics will support", "predictive analytics supports"),
    ("this solution will combine them", "this solution combined them"),
    ("The application will use historical", "The application used historical"),
    ("the system will ensure that students", "the system ensured that students"),
    ("The system will provide a platform", "The system provided a platform"),
    ("A key feature of the system will be", "A key feature of the system was"),
    ("the system will implement a priority-based", "the system implemented a priority-based"),
    ("The study will use both synthetic data", "The study used both synthetic data"),
    ("The dataset will include variables", "The dataset included variables"),
    ("This data will be used to simulate", "This data was used to simulate"),
    ("The system will focus specifically", "The system focused specifically"),
    ("and will not extend to", "and did not extend to"),
    ("the study will rely on a combination", "the study relied on a combination"),
    ("the system will focus on core functionalities", "the system focused on core functionalities"),
    ("will not be included", "were not included"),
    ("Attendance prediction will be based on", "Attendance prediction was based on"),
    ("The study will utilize mobile and SMS-based", "The study utilized mobile and SMS-based"),
    ("and will not incorporate advanced integrations", "and did not incorporate advanced integrations"),
    ("the machine learning component will focus on", "the machine learning component focused on"),
    ("The study will also be limited to", "The study was also limited to"),
    ("will be conducted within", "were conducted within"),
    ("This study proposes a Smart Event", "This study developed a Smart Event"),
    # Chapter 3 future-to-past conversions
    ("methodology that will be employed in the development of the proposed", "methodology that was employed in the development of the"),
    ("The methodology will guide the implementation", "The methodology guided the implementation"),
    ("This study will adopt a data-driven research paradigm", "This study adopted a data-driven research paradigm"),
    ("The paradigm will involve data acquisition", "The paradigm involved data acquisition"),
    ("will be utilized to train and evaluate", "were utilized to train and evaluate"),
    ("The attendance prediction module will require data", "The attendance prediction module required data"),
    ("The study will utilize publicly available", "The study utilized publicly available"),
    ("These datasets will provide information", "These datasets provided information"),
    ("synthetic event data will also be generated", "synthetic event data was also generated"),
    ("The generated dataset will include attributes", "The generated dataset included attributes"),
    ("The combined dataset will subsequently be used", "The combined dataset was subsequently used"),
    ("The acquired datasets will undergo preprocessing", "The acquired datasets underwent preprocessing"),
    ("This stage will involve data cleaning", "This stage involved data cleaning"),
    ("will be encoded into machine-readable formats", "were encoded into machine-readable formats"),
    ("Feature selection will also be performed", "Feature selection was also performed"),
    ("The final dataset will then be partitioned", "The final dataset was then partitioned"),
    ("The attendance prediction component will be developed", "The attendance prediction component was developed"),
    ("will be analyzed to identify patterns", "were analyzed to identify patterns"),
    ("will be utilized as predictor variables", "were utilized as predictor variables"),
    ("A Logistic Regression model will be implemented", "A Logistic Regression model was implemented"),
    ("The trained model will generate attendance estimates that will assist", "The trained model generated attendance estimates that assisted"),
    ("The developed model will be evaluated", "The developed model was evaluated"),
    ("The testing dataset will remain separate", "The testing dataset remained separate"),
    ("Model performance will be evaluated", "Model performance was evaluated"),
    ("The evaluation process will determine", "The evaluation process determined"),
    ("will adopt the Agile Prototyping methodology", "adopted the Agile Prototyping methodology"),
    ("Developing the system incrementally will allow", "Developing the system incrementally allowed"),
    ("the methodology will enable continuous evaluation", "the methodology enabled continuous evaluation"),
    ("will be developed using the Agile Software Development Methodology", "was developed using the Agile Software Development Methodology"),
    ("The Scrum Framework has been selected", "The Scrum Framework was selected"),
    ("Developing these modules incrementally through Scrum will allow", "Developing these modules incrementally through Scrum allowed"),
    ("This will reduce development risks and improve", "This reduced development risks and improved"),
    ("The iterative nature of Scrum will support", "The iterative nature of Scrum supported"),
    ("This phase will involve acquiring datasets", "This phase involved acquiring datasets"),
    ("Publicly available event attendance datasets will be obtained", "Publicly available event attendance datasets were obtained"),
    ("synthetic university event data will be generated", "synthetic university event data was generated"),
    ("The collected data will include", "The collected data included"),
    ("This process will include handling missing values", "This process included handling missing values"),
    ("The resulting dataset will be divided", "The resulting dataset was divided"),
    ("This phase will involve preparing the tools", "This phase involved preparing the tools"),
    ("The frontend environment will be configured", "The frontend environment was configured"),
    ("while Node.js and Express.js will be used", "while Node.js and Express.js were used"),
    ("Firebase will be configured for", "Firebase was configured for"),
    ("will also be installed and configured", "were also installed and configured"),
    ("will be developed incrementally through multiple Scrum sprints", "was developed incrementally through multiple Scrum sprints"),
    ("will be implemented during this phase", "were implemented during this phase"),
    ("The attendance prediction model will be trained", "The attendance prediction model was trained"),
    ("The selected machine learning algorithm will learn", "The selected machine learning algorithm learned"),
    ("the model will be integrated into the main application", "the model was integrated into the main application"),
    ("The developed system will undergo unit testing", "The developed system underwent unit testing"),
    ("The attendance prediction model will also be evaluated", "The attendance prediction model was also evaluated"),
    ("The final system will be deployed and configured", "The final system was deployed and configured"),
    ("Post-deployment activities will include monitoring system performance, correct identified issues", "Post-deployment activities included monitoring system performance, correcting identified issues"),
    ("before implementation begins", "before implementation began"),
    ("specifications that will guide implementation", "specifications that guided implementation"),
    ("data entities that will be stored", "data entities that were stored"),
    ("notifications will be organized and related", "notifications were organized and related"),
    ("The ERD will guide database development and ensure", "The ERD guided database development and ensured"),
    ("database structure that will be used to store", "database structure that was used to store"),
    ("screens that users will interact with", "screens that users interacted with"),
    ("The interfaces will support event management", "The interfaces supported event management"),
    ("The study will produce a functional", "The study produced a functional"),
    ("The completed system will consist of", "The completed system consisted of"),
    ("The Event Management Module will enable", "The Event Management Module enabled"),
    ("Organizers will be able to define", "Organizers were able to define"),
    ("The module will also provide tools", "The module also provided tools"),
    ("The Student Registration Module will allow", "The Student Registration Module allowed"),
    ("The module will maintain records", "The module maintained records"),
    ("The Attendance Prediction Module will utilize", "The Attendance Prediction Module utilized"),
    ("the module will generate attendance forecasts", "the module generated attendance forecasts"),
    ("The SMS Notification Module will facilitate", "The SMS Notification Module facilitated"),
    ("The module will support registration confirmations", "The module supported registration confirmations"),
    ("The Reporting and Analytics Module will provide", "The Reporting and Analytics Module provided"),
    ("The generated reports will support", "The generated reports supported"),
    ("technologies that will be used in the development of the proposed", "technologies that were used in the development of the"),
    ("The selected tools have been chosen", "The selected tools were chosen"),
    ("React.js will be used as the frontend", "React.js was used as the frontend"),
    ("The framework will enable the development", "The framework enabled the development"),
    ("architecture will facilitate the development", "architecture facilitated the development"),
    ("Node.js together with Express.js will be used", "Node.js together with Express.js were used"),
    ("These technologies will handle business logic", "These technologies handled business logic"),
    ("The backend will also expose", "The backend also exposed"),
    ("Firebase will serve as the primary", "Firebase served as the primary"),
    ("Firebase Firestore will be used to store", "Firebase Firestore was used to store"),
    ("Firebase Authentication will provide", "Firebase Authentication provided"),
    ("nature of Firebase will support scalability", "nature of Firebase supported scalability"),
    ("Google Collaboratory will be used as", "Google Collaboratory was used as"),
    ("The attendance prediction model will be developed and tested", "The attendance prediction model was developed and tested"),
    ("Python will be used for implementing", "Python was used for implementing"),
    ("Python scripts will be responsible for", "Python scripts were responsible for"),
    ("Scikit-learn will be used as the primary", "Scikit-learn was used as the primary"),
    ("Pandas and NumPy will be used for", "Pandas and NumPy were used for"),
    ("Pandas will facilitate dataset manipulation", "Pandas facilitated dataset manipulation"),
    ("while NumPy will support numerical computations", "while NumPy supported numerical computations"),
    ("These libraries will play a critical role", "These libraries played a critical role"),
    ("Africa's Talking SMS API will be integrated", "Africa's Talking SMS API was integrated"),
    ("The service will enable the delivery", "The service enabled the delivery"),
    ("The API has been selected", "The API was selected"),
    ("Visual Studio Code will be used as", "Visual Studio Code was used as"),
    ("Git and GitHub will be used for", "Git and GitHub were used for"),
    ("These tools will facilitate source code tracking", "These tools facilitated source code tracking"),
    ("Version control will also support iterative development", "Version control also supported iterative development"),
]

for idx in range(78, 276):
    p = doc.paragraphs[idx]
    update_runs_tense_in_place(p, tense_replacements)
    if p.style.name in ["Normal", "Normal (Web)", "List Paragraph"] and len(p._element.xpath(".//a:blip")) == 0:
        format_paragraph(p, align=WD_ALIGN_PARAGRAPH.JUSTIFY)

# Center Table 2.1 and its caption
doc.tables[0].alignment = WD_TABLE_ALIGNMENT.CENTER
for row in doc.tables[0].rows:
    for cell in row.cells:
        for cp in cell.paragraphs:
            for r in cp.runs:
                set_run_tnr12(r, color_rgb=(0, 0, 0), size_pt=11)
doc.paragraphs[161].alignment = WD_ALIGN_PARAGRAPH.CENTER
for r in doc.paragraphs[161].runs:
    set_run_tnr12(r, bold=False, italic=False, color_rgb=(0, 0, 0))

# Center Figure 2.1 and Figure 3.1 and their captions
doc.paragraphs[173].alignment = WD_ALIGN_PARAGRAPH.CENTER
doc.paragraphs[174].alignment = WD_ALIGN_PARAGRAPH.CENTER
for r in doc.paragraphs[174].runs:
    set_run_tnr12(r, bold=False, italic=False, color_rgb=(0, 0, 0))
doc.paragraphs[205].alignment = WD_ALIGN_PARAGRAPH.CENTER
doc.paragraphs[206].alignment = WD_ALIGN_PARAGRAPH.CENTER
for r in doc.paragraphs[206].runs:
    set_run_tnr12(r, bold=False, italic=False, color_rgb=(0, 0, 0))


# ==============================================================================
# 4. ENHANCE CHAPTER 4: SYSTEM ANALYSIS AND DESIGN (PARAGRAPHS 276..341)
# ==============================================================================
# Update 4.1 Introduction
replace_paragraph_text(
    doc.paragraphs[278],
    "This chapter presents the system requirements, analysis, and architectural design of the SmartEvent platform developed for Strathmore University. In alignment with the Object-Oriented Analysis and Design (OOAD) and Agile Scrum methodology established in Chapter 3, Unified Modeling Language (UML) and structured data modeling artifacts were constructed prior to and during sprint iterations to blueprint the system's static structure and dynamic behavior. Section 4.2 specifies the functional and non-functional requirements traceable to the study's objectives. Section 4.3 presents and interprets the system analysis diagrams, including the Use Case Diagram, Sequence Diagram, Entity Relationship Diagram (ERD), Class Diagram, and Activity Diagram. Section 4.4 details the system design artifacts, encompassing the logical Database Schema, User Interface Wireframes, and the four-tier System Architecture Diagram.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)

# Update 4.2 System Requirements intro & Functional / Non-functional requirements with IDs (FR-01..FR-04, NFR-01..NFR-04)
replace_paragraph_text(
    doc.paragraphs[280],
    "The system requirements identified and implemented for the SmartEvent platform are categorized into functional and non-functional specifications in accordance with ISO/IEC/IEEE 29148:2018 requirements engineering standards. Each requirement was assigned a traceable identifier and verified during system testing in Chapter 5.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)

replace_paragraph_text(
    doc.paragraphs[282],
    "FR-01 (Authentication and Role-Based Access Control Module): The system shall allow students, event organizers, and system administrators to register, authenticate using email and bcrypt-hashed credentials, and maintain stateless JSON Web Token (JWT) sessions. The system shall enforce role-based access control (RBAC) so that each actor accesses only authorized dashboard routes and REST API endpoints.",
    style_name="List Paragraph", align=WD_ALIGN_PARAGRAPH.JUSTIFY
)
replace_paragraph_text(
    doc.paragraphs[283],
    "FR-02 (Event Creation, Discovery, and Registration Module): The system shall allow authorized event organizers to create, update, publish, and cancel university events with defined metadata (title, category, date, time slot, venue, capacity, and default SMS priority). The system shall enable students to browse, search, filter by category, bookmark, and complete one-tap RSVP registrations while preventing duplicate registrations for the same student and event.",
    style_name="List Paragraph", align=WD_ALIGN_PARAGRAPH.JUSTIFY
)
replace_paragraph_text(
    doc.paragraphs[284],
    "FR-03 (Priority-Based SMS Notification Engine): The system shall allow event organizers to compose and dispatch categorized SMS notifications assigned to High (Level 3 — urgent venue changes, cancellations, or deadlines), Medium (Level 2 — 24-hour and 48-hour event reminders), or Low (Level 1 — general announcements) priority tiers via the Africa's Talking SMS Gateway API, and shall record delivery status, cost, and timestamps in an immutable audit log.",
    style_name="List Paragraph", align=WD_ALIGN_PARAGRAPH.JUSTIFY
)
replace_paragraph_text(
    doc.paragraphs[285],
    "FR-04 (Machine Learning Attendance Prediction and Analytics Module): The system shall invoke a trained Scikit-learn Logistic Regression microservice to compute calibrated student turnout probabilities and aggregate expected event headcounts based on event category, time slot, day of week, venue capacity, registration volume, past attendance rate, weather, and SMS priority level, displaying capacity utilization alerts and counterfactual SMS lift recommendations on the organizer dashboard.",
    style_name="List Paragraph", align=WD_ALIGN_PARAGRAPH.JUSTIFY
)

replace_paragraph_text(
    doc.paragraphs[288],
    "NFR-01 (Security and Data Privacy): The system shall hash all user passwords using bcrypt (10 salt rounds), validate Bearer JWT tokens on all protected endpoints via Express middleware, store third-party API credentials (Africa's Talking and Firebase service keys) strictly in server-side environment variables, and restrict cross-origin requests via CORS policies.",
    style_name="List Paragraph", align=WD_ALIGN_PARAGRAPH.JUSTIFY
)
replace_paragraph_text(
    doc.paragraphs[289],
    "NFR-02 (Usability and Cross-Platform Accessibility): The system shall provide a responsive, intuitive user interface adhering to Strathmore University's visual identity across both the React.js web dashboard (for organizers and administrators) and the React Native mobile interface (for students), with color-coded visual urgency badges (red for High, amber for Medium, green/blue for Low priority notifications).",
    style_name="List Paragraph", align=WD_ALIGN_PARAGRAPH.JUSTIFY
)
replace_paragraph_text(
    doc.paragraphs[290],
    "NFR-03 (Reliability and Fault Tolerance): The system shall maintain consistent transactional records across Firebase Firestore and a local persistent JSON store fallback, and shall gracefully handle external gateway or microservice interruptions by queuing failed SMS dispatches and providing a deterministic fallback turnout estimator if the Python ML service is unreachable.",
    style_name="List Paragraph", align=WD_ALIGN_PARAGRAPH.JUSTIFY
)
replace_paragraph_text(
    doc.paragraphs[291],
    "NFR-04 (Performance and Scalability): The system shall return real-time machine learning attendance predictions within 500 milliseconds per HTTP POST request and support concurrent event browsing, RSVP registration, and batch SMS dispatching across campus-wide cohorts without degradation in responsiveness.",
    style_name="List Paragraph", align=WD_ALIGN_PARAGRAPH.JUSTIFY
)

# Enhance narratives & interpretations for 4.3.1 - 4.4.3 while keeping images & captions intact
replace_paragraph_text(
    doc.paragraphs[294],
    "The Use Case Diagram in Figure 4:1 captures the system boundary of the SmartEvent platform and models the functional interactions between the two primary external actors—the Student and the Event Organizer—and the core services exposed by the system. The Student actor interacts with four core use cases: Register / Login (supporting FR-01), View Available Events, Register for Event (supporting FR-02), and Receive SMS Notifications (supporting FR-03). Conversely, the Event Organizer actor is associated with Register / Login, Create & Manage Events, Manage Student Registrations, Send Priority-Based SMS Notifications, and View Analytics & Attendance Predictions (supporting FR-04). By explicitly separating student-facing discovery and RSVP actions from organizer-facing administrative, broadcast, and predictive analytics operations, the Use Case Diagram establishes clear role boundaries and ensures complete functional coverage of Objectives iii and iv.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)
doc.paragraphs[297].alignment = WD_ALIGN_PARAGRAPH.CENTER
doc.paragraphs[298].alignment = WD_ALIGN_PARAGRAPH.CENTER
for r in doc.paragraphs[298].runs:
    set_run_tnr12(r, bold=False, italic=False, color_rgb=(0, 0, 0))

replace_paragraph_text(
    doc.paragraphs[300],
    "The Sequence Diagram in Figure 4:2 illustrates the time-ordered message exchange across five runtime lifelines—Student, React Frontend, Node.js/Express Backend, Firebase (Database/Auth), and the Africa's Talking SMS Service—during user authentication, event registration, and priority SMS dispatch. The workflow begins when the Student submits login credentials to the React Frontend (Step 1), which dispatches an HTTP POST /api/auth/login request to the Express Backend (Step 2). After credential verification against Firebase (Steps 3–4), a signed authentication token is returned to the client (Step 5). When the Student selects an event and triggers POST /api/events/register (Steps 6–7), the backend persists the registration record (Steps 8–9) and asynchronously invokes the Africa's Talking SMS Service to dispatch a prioritized confirmation or reminder SMS (Steps 10–11). The SMS gateway returns a delivery status callback (Step 12), which the backend logs into the database (Step 13) before returning final registration confirmation to the student interface (Steps 14–15).",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)
doc.paragraphs[302].alignment = WD_ALIGN_PARAGRAPH.CENTER
doc.paragraphs[303].alignment = WD_ALIGN_PARAGRAPH.CENTER
for r in doc.paragraphs[303].runs:
    set_run_tnr12(r, bold=False, italic=False, color_rgb=(0, 0, 0))

replace_paragraph_text(
    doc.paragraphs[305],
    "The Entity Relationship Diagram (ERD) in Figure 4:3 models the conceptual data domain of the SmartEvent platform across five core entities: USER, EVENT, REGISTRATION, NOTIFICATION, and ATTENDANCE_PREDICTION. A one-to-many (1:N) relationship links USER (where role = Organizer) to EVENT via the foreign key organizer_id, allowing an organizer to manage multiple campus events. A student USER associates with EVENT through the associative REGISTRATION entity (1:N from both USER and EVENT), which resolves the many-to-many participation relationship and records registration_date and attendance_status. Furthermore, each EVENT is linked in a 1:N relationship to NOTIFICATION—which tracks message content, priority_level (High, Med, Low), delivery_status, and sent_at per recipient—and in a 1:1/1:N relationship to ATTENDANCE_PREDICTION, which stores predicted_attendance, confidence_score, and generated_at.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)
doc.paragraphs[307].alignment = WD_ALIGN_PARAGRAPH.CENTER
doc.paragraphs[308].alignment = WD_ALIGN_PARAGRAPH.CENTER
for r in doc.paragraphs[308].runs:
    set_run_tnr12(r, bold=False, italic=False, color_rgb=(0, 0, 0))

replace_paragraph_text(
    doc.paragraphs[310],
    "The Class Diagram in Figure 4:4 defines the static object-oriented structure of the SmartEvent codebase, detailing class attributes, encapsulated operations, inheritance hierarchies, and multiplicity associations. At the top of the hierarchy, the abstract User class encapsulates shared identity attributes (userId, fullName, email, phoneNumber, passwordHash) and authentication methods (register(), login(), logout()). The Student and EventOrganizer concrete subclasses inherit from User through UML generalization: Student implements viewEvents(), registerForEvent(eventId), and receiveNotification(msg), whereas EventOrganizer implements createEvent(details), manageRegistrations(eventId), sendNotification(msg, priority), and viewAnalytics(eventId). The Event class aggregates Registration, Notification, and AttendancePrediction objects, where AttendancePrediction encapsulates trainModel(data) and predictAttendance(eventId) to interface with the Scikit-learn pipeline.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)
doc.paragraphs[312].alignment = WD_ALIGN_PARAGRAPH.CENTER
doc.paragraphs[313].alignment = WD_ALIGN_PARAGRAPH.CENTER
for r in doc.paragraphs[313].runs:
    set_run_tnr12(r, bold=False, italic=False, color_rgb=(0, 0, 0))

replace_paragraph_text(
    doc.paragraphs[315],
    "The Activity Diagram in Figure 4:5 models the concurrent operational workflows of the SmartEvent system across five swimlanes: Student, System, Event Organizer, SMS Module, and Analytics Module. On the student side, the flow progresses from Register/Login through View Available Events, Select Event, and Register for Event. The System swimlane intercepts the request at the Validate Registration guard node: if invalid (e.g., duplicate RSVP or full capacity), an error message is returned; if valid, the system stores the registration details and updates event capacity. Concurrently, the Event Organizer logs in, creates or manages an event, inspects registrations, composes an SMS notification, assigns a priority tier (High, Medium, or Low), selects the recipient cohort, and triggers dispatch. The SMS Module processes the request through the Africa's Talking gateway, delivers the SMS to the student, and logs the delivery status, while the Analytics Module ingests event and registration data to generate machine learning attendance predictions and visual dashboards.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)
doc.paragraphs[317].alignment = WD_ALIGN_PARAGRAPH.CENTER
doc.paragraphs[318].alignment = WD_ALIGN_PARAGRAPH.CENTER
for r in doc.paragraphs[318].runs:
    set_run_tnr12(r, bold=False, italic=False, color_rgb=(0, 0, 0))

replace_paragraph_text(
    doc.paragraphs[321],
    "The logical Database Schema in Figure 4:6 translates the conceptual ERD into five document collections deployed in Firebase Firestore (and mirrored in the backend's local persistent JSON store): users, events, registrations, notifications, and attendance_predictions. Each collection is indexed by a unique string primary key (userId, eventId, registrationId, notificationId, and predictionId) and maintains referential integrity through explicit document reference fields (ref: users and ref: events). Storing priorityLevel (High|Med|Low) and deliveryStatus inside the notifications collection enables fast filtering of SMS audit logs, while decoupling attendance_predictions allows real-time forecast updates without mutating core event metadata.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)
doc.paragraphs[323].alignment = WD_ALIGN_PARAGRAPH.CENTER
doc.paragraphs[324].alignment = WD_ALIGN_PARAGRAPH.CENTER
for r in doc.paragraphs[324].runs:
    set_run_tnr12(r, bold=False, italic=False, color_rgb=(0, 0, 0))

replace_paragraph_text(
    doc.paragraphs[326],
    "The User Interface Wireframes in Figures 4:7 through 4:10 depict the screen layouts and interaction flow designed prior to frontend coding. Figure 4:7 illustrates the Student Login and Registration screen featuring email and password inputs and role-aware authentication. Figure 4:8 presents the Upcoming Events feed displaying event cards with dates, venues, and one-tap Register buttons. Figure 4:9 shows the Event Details view containing venue capacity, event description, RSVP confirmation button, and an SMS opt-in notice. Figure 4:10 illustrates the Priority Notifications Inbox, where incoming SMS and in-app alerts are visually stratified using color-coded urgency badges—red for HIGH priority (e.g., 'Tech Career Fair starts in 2 hours!'), amber for MEDIUM priority (e.g., venue changes), and green for LOW priority (e.g., new event announcements).",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)
for cap_idx in [328, 329, 330, 331, 332, 333, 334, 335]:
    doc.paragraphs[cap_idx].alignment = WD_ALIGN_PARAGRAPH.CENTER
    for r in doc.paragraphs[cap_idx].runs:
        set_run_tnr12(r, bold=False, italic=False, color_rgb=(0, 0, 0))
# Capitalize Figure 4:7 caption text nicely
for r in doc.paragraphs[329].runs:
    if "sign up/sign in page" in r.text:
        r.text = r.text.replace("sign up/sign in page", "Sign Up / Sign In Page")

# Fix spelling in 4.4.3 heading & caption ("System Architecture")
replace_paragraph_text(doc.paragraphs[337], "System Architecture Diagram", style_name="Heading 3", align=WD_ALIGN_PARAGRAPH.LEFT, bold=True)
replace_paragraph_text(
    doc.paragraphs[338],
    "The System Architecture Diagram in Figure 4:11 illustrates the four-tier deployment structure of the SmartEvent platform across the Client Layer, Application/API Layer, Service Layer, and Data Layer. The Client Layer comprises the React.js Web Application (used by event organizers and administrators) and the React Native Mobile Application (used by students), both communicating over HTTPS/REST with the Node.js and Express.js REST API Server in the Application Layer. The Express server orchestrates four decoupled components in the Service Layer: Firebase Authentication for identity verification, the Python and Scikit-learn ML Prediction Service (hosted via FastAPI) for real-time attendance forecasting, the Africa's Talking SMS Gateway API for cellular message delivery, and the Priority Notification Engine for urgency classification and queue management. Finally, the Data Layer utilizes Firebase Firestore (backed by a local persistent JSON store) to persist users, events, registrations, notifications, and predictions.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)
doc.paragraphs[339].alignment = WD_ALIGN_PARAGRAPH.CENTER
doc.paragraphs[340].alignment = WD_ALIGN_PARAGRAPH.CENTER
for r in doc.paragraphs[340].runs:
    if "System Archetecture" in r.text:
        r.text = r.text.replace("System Archetecture", "System Architecture Diagram")
    set_run_tnr12(r, bold=False, italic=False, color_rgb=(0, 0, 0))


# ==============================================================================
# 5. BUILD COMPLETE CHAPTER 5 AND CHAPTER 6 BEFORE "References " (PARAGRAPH 350)
# ==============================================================================
# First, update existing paragraphs 344 and 347 in Chapter 5
replace_paragraph_text(
    doc.paragraphs[344],
    "This chapter describes the implementation, testing, and evaluation of the SmartEvent system, a priority-based SMS notification and machine learning attendance prediction platform developed for university event management at Strathmore University. Section 5.2 outlines the hardware and software implementation environment. Section 5.3 details the datasets acquired, audited, and cleaned to construct the attendance prediction corpus. Section 5.4 presents the machine learning model components, mathematical formulations, hyperparameter optimization, and evaluation metrics on unseen future test events. Section 5.5 documents the end-to-end functional testing conducted across all system modules. Section 5.6 presents and discusses the integrated experimental and application results, and Section 5.7 details the GitHub repository structure and version-control documentation.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)
replace_paragraph_text(
    doc.paragraphs[347],
    "The SmartEvent system was developed and tested across a hybrid local and cloud environment. Full-stack web and mobile interface development, REST API orchestration, and deterministic data preprocessing were executed locally on a notebook workstation, whereas exploratory data analysis and machine learning model training experiments were executed in Google Colaboratory integrated with Google Drive storage. Table 5.1 summarizes the hardware specifications and their justification.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)

# Format existing Table 5.1 (doc.tables[1]) to be centered, Times New Roman 12pt, with clean borders
hw_table = doc.tables[1]
hw_table.alignment = WD_TABLE_ALIGNMENT.CENTER
for r_idx, row in enumerate(hw_table.rows):
    for cell in row.cells:
        for cp in cell.paragraphs:
            cp.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY if r_idx > 0 else WD_ALIGN_PARAGRAPH.LEFT
            cp.paragraph_format.line_spacing = 1.15
            cp.paragraph_format.space_before = Pt(3)
            cp.paragraph_format.space_after = Pt(3)
            for run in cp.runs:
                set_run_tnr12(run, bold=(r_idx == 0), color_rgb=(0, 0, 0), size_pt=12)

# Remove the two empty paragraphs 348 and 349 right after Table 5.1 so we can insert cleanly before References (350)
for empty_p in [doc.paragraphs[348], doc.paragraphs[349]]:
    empty_p._p.getparent().remove(empty_p._p)

# Anchor element before which all Chapter 5 & Chapter 6 content will be inserted:
ref_heading_p = [p for p in doc.paragraphs if p.text.strip() == "References"][0]
anchor_elm = ref_heading_p._p


def insert_p_before(anchor, text="", style_name="Normal", align=WD_ALIGN_PARAGRAPH.JUSTIFY, bold=False, italic=False, space_before=0, space_after=6, line_spacing=1.5):
    new_p = doc.add_paragraph()
    new_p.style = doc.styles[style_name]
    if text:
        r = new_p.add_run(text)
        set_run_tnr12(r, bold=bold, italic=italic, color_rgb=(0, 0, 0))
    format_paragraph(new_p, align=align, line_spacing=line_spacing, space_before=space_before, space_after=space_after, bold=bold, italic=italic)
    anchor.addprevious(new_p._p)
    return new_p


def insert_seq_caption_before(anchor, label_type, chapter_num, seq_num, title_text, separator=": "):
    """
    Inserts a centered caption paragraph using Word STYLEREF and SEQ fields so Word's
    List of Figures / List of Tables / List of Equations automatically picks it up,
    matching Elvis Makara's exact caption style (Times New Roman 12pt, centered, non-italic).
    """
    p = doc.add_paragraph()
    p.style = doc.styles["Caption"] if "Caption" in doc.styles else doc.styles["Normal"]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.space_before = Pt(4)
    p.paragraph_format.space_after = Pt(8)

    r1 = p.add_run(f"{label_type} ")
    set_run_tnr12(r1, bold=False, italic=False, color_rgb=(0, 0, 0))

    # STYLEREF 1 \s field
    fld1 = parse_xml(
        f'<w:root {nsdecls("w")}>'
        f'<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r>'
        f'<w:r><w:instrText xml:space="preserve"> STYLEREF 1 \\s </w:instrText></w:r>'
        f'<w:r><w:fldChar w:fldCharType="separate"/></w:r>'
        f'<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:noProof/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>{chapter_num}</w:t></w:r>'
        f'<w:r><w:fldChar w:fldCharType="end"/></w:r>'
        f'</w:root>'
    )
    for child in list(fld1):
        p._p.append(child)

    r_dot = p.add_run(".")
    set_run_tnr12(r_dot, bold=False, italic=False, color_rgb=(0, 0, 0))

    # SEQ field
    fld2 = parse_xml(
        f'<w:root {nsdecls("w")}>'
        f'<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r>'
        f'<w:r><w:instrText xml:space="preserve"> SEQ {label_type} \\* ARABIC \\s 1 </w:instrText></w:r>'
        f'<w:r><w:fldChar w:fldCharType="separate"/></w:r>'
        f'<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:noProof/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>{seq_num}</w:t></w:r>'
        f'<w:r><w:fldChar w:fldCharType="end"/></w:r>'
        f'</w:root>'
    )
    for child in list(fld2):
        p._p.append(child)

    r_title = p.add_run(f"{separator}{title_text}")
    set_run_tnr12(r_title, bold=False, italic=False, color_rgb=(0, 0, 0))

    anchor.addprevious(p._p)
    return p


def insert_image_with_caption_before(anchor, img_path, chapter_num, fig_num, caption_text, width_inches=5.8):
    p_img = doc.add_paragraph()
    p_img.style = doc.styles["Normal"]
    p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_img.paragraph_format.space_before = Pt(6)
    p_img.paragraph_format.space_after = Pt(2)
    run_img = p_img.add_run()
    run_img.add_picture(img_path, width=Inches(width_inches))
    anchor.addprevious(p_img._p)
    insert_seq_caption_before(anchor, "Figure", chapter_num, fig_num, caption_text)


def insert_centered_table_before(anchor, headers, rows, col_widths_inches=None):
    tbl = doc.add_table(rows=len(rows) + 1, cols=len(headers))
    tbl.style = "Table Grid"
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER

    # Header row
    hdr_cells = tbl.rows[0].cells
    for c_idx, h_text in enumerate(headers):
        hdr_cells[c_idx].text = ""
        p = hdr_cells[c_idx].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after = Pt(3)
        r = p.add_run(h_text)
        set_run_tnr12(r, bold=True, color_rgb=(0, 0, 0), size_pt=12)
        if col_widths_inches:
            hdr_cells[c_idx].width = Inches(col_widths_inches[c_idx])

    # Data rows
    for r_idx, row_data in enumerate(rows):
        row_cells = tbl.rows[r_idx + 1].cells
        for c_idx, val in enumerate(row_data):
            row_cells[c_idx].text = ""
            p = row_cells[c_idx].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.line_spacing = 1.15
            p.paragraph_format.space_before = Pt(3)
            p.paragraph_format.space_after = Pt(3)
            r = p.add_run(str(val))
            set_run_tnr12(r, bold=False, color_rgb=(0, 0, 0), size_pt=12)
            if col_widths_inches:
                row_cells[c_idx].width = Inches(col_widths_inches[c_idx])

    anchor.addprevious(tbl._tbl)
    return tbl


def insert_equation_before(anchor, eq_str, chapter_num, eq_num, eq_caption):
    p_eq = doc.add_paragraph()
    p_eq.style = doc.styles["Normal"]
    p_eq.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_eq.paragraph_format.line_spacing = 1.5
    p_eq.paragraph_format.space_before = Pt(6)
    p_eq.paragraph_format.space_after = Pt(2)
    r = p_eq.add_run(eq_str)
    set_run_tnr12(r, bold=False, italic=True, color_rgb=(0, 0, 0), size_pt=12)
    anchor.addprevious(p_eq._p)
    insert_seq_caption_before(anchor, "Equation", chapter_num, eq_num, eq_caption)


# ------------------------------------------------------------------------------
# Table 5.1 Caption (right below existing Table 5.1)
# ------------------------------------------------------------------------------
insert_seq_caption_before(anchor_elm, "Table", 5, 1, "Hardware Specifications")

# ------------------------------------------------------------------------------
# 5.2.2 Software Specifications
# ------------------------------------------------------------------------------
insert_p_before(anchor_elm, "Software Specifications", style_name="Heading 3", align=WD_ALIGN_PARAGRAPH.LEFT, bold=True, space_before=8, space_after=4)
insert_p_before(
    anchor_elm,
    "The system relied on several software frameworks, programming languages, machine learning libraries, and cloud platforms to support full-stack event management, priority SMS dispatching, and attendance prediction. Table 5.2 details the software specifications and the role of each tool in the implemented system.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)

sw_headers = ["Software / Tool", "Version / Description", "Role in Project"]
sw_rows = [
    ["Python", "3.12 / 3.13", "Primary language used to implement the data auditing, cleaning, feature engineering, Scikit-learn model training, and FastAPI inference microservice."],
    ["Scikit-learn", "1.5.0 / 1.9.1", "Provided core algorithms for Logistic Regression, Decision Tree, Random Forest, and HistGradientBoosting, alongside GroupKFold cross-validation, SimpleImputer, and evaluation metrics."],
    ["Pandas & NumPy", "2.2.2 & 1.26.4", "Managed tabular dataset auditing, target leakage removal, chronological event splitting, numerical transformations, and cohort probability aggregation."],
    ["FastAPI & Uvicorn", "0.111.0 & 0.30.1", "Served the serialized attendance_model.joblib pipeline over HTTP on Port 8000 with Pydantic schema validation and interactive Swagger documentation."],
    ["React.js & Vite", "18.3.1 & 5.2.11", "Built the responsive organizer dashboard, live ML turnout simulator, Priority SMS Broadcast Studio, and Recharts analytics visualizations on Port 5173."],
    ["React Native & Expo", "0.74.1 & ~51.0.0", "Implemented the cross-platform mobile student application for event discovery, one-tap RSVP registration, and priority-tagged notification viewing."],
    ["Node.js & Express.js", "20.x & 4.19.2", "Implemented the central REST API gateway on Port 5000, JWT authentication, bcryptjs password hashing, role-based access middleware, and ML/SMS proxying."],
    ["Firebase (Auth & Firestore)", "Admin SDK 12.1.0", "Provided cloud identity management and NoSQL document persistence for users, events, registrations, notifications, and predictions, paired with a local JSON fallback store."],
    ["Africa's Talking SMS API", "REST v1 Gateway", "Dispatched urgency-classified SMS notifications (High, Medium, and Low priority) to registered student phone numbers and returned delivery status callbacks."],
    ["Google Colaboratory", "Cloud Runtime", "Provided the cloud Jupyter notebook environment integrated with Google Drive for reproducible model training, hyperparameter tuning, and Matplotlib figure generation."],
    ["Matplotlib & Joblib", "3.10.7 & 1.4.2", "Rendered ROC curves, calibration curves, confusion matrices, and coefficient plots, and serialized the trained Scikit-learn pipeline to disk."],
    ["Visual Studio Code & Git", "Latest", "Served as the primary integrated development environment (IDE) and distributed version-control system linked to GitHub."]
]
insert_centered_table_before(anchor_elm, sw_headers, sw_rows, col_widths_inches=[1.7, 1.3, 3.2])
insert_seq_caption_before(anchor_elm, "Table", 5, 2, "Software Specifications")

# ------------------------------------------------------------------------------
# 5.3 Dataset Description
# ------------------------------------------------------------------------------
insert_p_before(anchor_elm, "Dataset Description", style_name="Heading 2", align=WD_ALIGN_PARAGRAPH.LEFT, bold=True, space_before=10, space_after=4)
insert_p_before(
    anchor_elm,
    "This section describes the datasets acquired, audited, and preprocessed to train, validate, and test the SmartEvent attendance prediction model. In accordance with Section 3.2.1 of the methodology, the final implementation combined an empirical student attendance dataset sourced from Kaggle with a domain-specific synthetic Strathmore University event registration corpus. By coupling real-world student behavioral patterns with university event attributes and SMS priority tiers, the pipeline learned both individual student attendance propensities and event-level turnout dynamics.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)
insert_p_before(
    anchor_elm,
    "The first dataset utilized in this study was the Kaggle Student Attendance Dataset (Attendance_Prediction.csv), which comprises 20,000 student attendance records across 15 attributes, including student_id, age, gender, course, year, parent_education, internet_access, hostel_resident, class_type, weather, study_hours, sleep_hours, travel_time_minutes, attendance (binary target: 1 for attended, 0 for absent, with a 51.63% overall attendance rate), and absence_reason. During Stage 1 of the data audit (implemented in smartevent_ml/kaggle_prep.py), two critical data quality issues were identified and corrected before modeling. First, the column absence_reason exhibited severe post-event target leakage: across all 20,000 rows, absence_reason was recorded as 'none' whenever attendance equaled 1 without a single exception, allowing a trivial rule (absence_reason == 'none') to achieve an artificial 93.33% accuracy using information that only exists after an event concludes. Consequently, absence_reason was removed. Second, the student_id column contained 398 corrupted repeating floating-point numbers (such as 200.99 repeated thousands of times) and was also dropped. Fitting a baseline pre-event Logistic Regression model on the cleaned behavioral attributes yielded a holdout ROC-AUC of 0.6678 and extracted empirical log-odds parameters—specifically a rainy weather penalty of -0.5937 log-odds (reducing attendance from 54.55% on sunny days to 41.57% on rainy days) and a commute penalty of -0.0114 log-odds per minute of travel time—alongside a pool of 4,000 student demographic and commute profiles.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)

insert_image_with_caption_before(
    anchor_elm,
    os.path.join(FIG_DIR, "fig5_1_kaggle_sample.png"),
    5, 1,
    "Sample of the Audited Kaggle Student Attendance Dataset"
)

insert_p_before(
    anchor_elm,
    "Because the Kaggle dataset captures general academic attendance without university event capacities, event categories, or priority SMS notification tiers, Stage 2 of the pipeline (smartevent_ml/synthetic.py) combined the 4,000 audited Kaggle student profiles and their empirical weather and commute log-odds with 700 simulated Strathmore University events spanning January 8, 2024 to June 30, 2026. The events covered six institutional categories—Academic, Workshop, Seminar, Club Activity, Sports, and Career Fair—scheduled across Morning, Afternoon, and Evening time slots in campus venues ranging from 80-seat laboratory rooms to 500-seat auditoriums. Each event was assigned an SMS notification priority tier (none, low, medium, or high) and matched with registered students, generating 150,645 unique student-event registrations. Crucially, each student's historical participation features (past_events_count and past_attendance_rate) were computed strictly from events occurring prior to the target event date to prevent temporal leakage.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)
insert_p_before(
    anchor_elm,
    "To verify that the data preprocessing pipeline handled realistic operational noise, controlled data anomalies were injected into the raw registration stream (153,657 raw rows) and systematically resolved in Stage 3 (smartevent_ml/clean.py). Specifically, the deterministic cleaning module removed 3,012 duplicate double-click registration submissions (retaining 150,645 unique registrations), standardized 15,064 inconsistent category strings (such as 'wkshp' and 'ACADEMIC'), canonicalized 12,051 time-slot and 12,051 SMS-priority casing variants, converted 753 impossible negative travel times and 451 corrupted venue capacities to NaN, recovered all 451 missing venue capacities via cross-row lookup from sibling registrations of the same event_id, and removed 753 rows lacking a recorded attendance outcome. This yielded a final clean corpus of 149,892 student-event registrations across 22 attributes. Remaining missing feature values—5,976 weather entries, 5,233 travel-time entries, and 2,489 first-time registrant past_attendance_rate values (missing by design for students attending their first university event)—were imputed inside the Scikit-learn ColumnTransformer using SimpleImputer(add_indicator=True) fitted strictly on training folds.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)

insert_image_with_caption_before(
    anchor_elm,
    os.path.join(FIG_DIR, "fig5_2_strathmore_sample.png"),
    5, 2,
    "Sample of the Cleaned Strathmore University Event Registrations Dataset"
)

insert_p_before(
    anchor_elm,
    "Following preprocessing, Stage 4 partitioned the 149,892 cleaned registrations chronologically by event date rather than by random row splitting so that the model was never trained on future events or evaluated on registrations belonging to training events. The first 80% of events (560 events comprising 121,533 registrations from January 8, 2024 to January 22, 2026, with a 66.18% mean turnout rate) formed the training and cross-validation set. The final 20% of events (140 unseen future events comprising 28,359 registrations from January 26, 2026 to June 30, 2026, with a 65.80% mean turnout rate) were held out as an untouched test set for final student-level and event-headcount evaluation.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)

# ------------------------------------------------------------------------------
# 5.4 Model Training and Evaluation
# ------------------------------------------------------------------------------
insert_p_before(anchor_elm, "Model Training and Evaluation", style_name="Heading 2", align=WD_ALIGN_PARAGRAPH.LEFT, bold=True, space_before=10, space_after=4)
insert_p_before(
    anchor_elm,
    "This section details the architecture, mathematical formulation, feature engineering, hyperparameter tuning, and evaluation metrics used to develop and validate the machine learning attendance prediction model.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)

# 5.4.1 Model Components
insert_p_before(anchor_elm, "Model Components", style_name="Heading 3", align=WD_ALIGN_PARAGRAPH.LEFT, bold=True, space_before=8, space_after=4)
insert_p_before(
    anchor_elm,
    "Model development was carried out in two phases: multi-algorithm benchmarking across five candidate classifiers and five-stage iterative refinement of the primary Logistic Regression pipeline. During the benchmarking phase, a Majority-Class Baseline (DummyClassifier), Logistic Regression, Decision Tree, Random Forest, and Histogram-Based Gradient Boosting (HistGradientBoostingClassifier) were evaluated across the 560 training events using 5-fold GroupKFold cross-validation grouped by event_id. Grouping by event_id ensured that all registrations for any given campus event resided entirely within either the training split or the validation split of each fold.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)
insert_p_before(
    anchor_elm,
    "In accordance with Section 3.2.3 of the proposal, Logistic Regression was formulated as the primary production model because university event planning requires both accurate student-level attendance probabilities and well-calibrated event headcount totals. For a registered student i and event e with feature vector x_i, Logistic Regression estimates the probability of attendance P(y_i = 1 | x_i) using the logistic sigmoid function:",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)

insert_equation_before(
    anchor_elm,
    "P(y_i = 1 | x_i) = p̂_{i,e} = 1 / (1 + e^{-(β_0 + ∑_{j=1}^{m} β_j x_{ij})})",
    5, 1,
    "Logistic Regression Attendance Probability Function"
)

insert_p_before(
    anchor_elm,
    "where P(y_i = 1 | x_i) denotes the calibrated probability that registered student i attends event e, β_0 is the learned intercept, and β_j represents the log-odds coefficient associated with predictor feature x_{ij}. Because the sum of calibrated Bernoulli probabilities across all N_e registered students for event e yields the statistically unbiased expected turnout headcount, the event-level attendance forecast Ŷ_e is computed as:",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)

insert_equation_before(
    anchor_elm,
    "Ŷ_e = ∑_{i=1}^{N_e} p̂_{i,e} = ∑_{i=1}^{N_e} P(y_i = 1 | x_{i,e})",
    5, 2,
    "Event Headcount Aggregation Formula"
)

insert_p_before(
    anchor_elm,
    "Furthermore, the explicit log-odds structure of Logistic Regression enabled the FastAPI inference engine to compute a counterfactual Priority SMS Turnout Lift for every event by comparing the mean cohort attendance probability under the selected SMS priority tier against a counterfactual baseline with sms_priority set to 'none'. Figure 5.3 illustrates the two-tier attendance prediction architecture and its operational decision thresholds.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)

insert_image_with_caption_before(
    anchor_elm,
    os.path.join(FIG_DIR, "fig5_3_model_structure.png"),
    5, 3,
    "SmartEvent Two-Tier Logistic Regression Attendance Prediction Structure"
)

insert_p_before(
    anchor_elm,
    "Prior to model fitting, Stage 5 of the pipeline (smartevent_ml/features.py) engineered seven domain-specific interaction features inside a stateless FunctionTransformer: (1) fill_ratio (registered_count / venue_capacity), (2) overbooked_excess (max(0, fill_ratio - 1.0)), (3) is_weekend (binary indicator for Saturday and Sunday events), (4) log_lead_days (ln(1 + lead_days) capturing diminishing returns of early registration), (5) has_history (indicator distinguishing returning students from first-time registrants), (6) evening_travel (interaction between Evening time slot and travel_time_minutes capturing late-evening commuter drop-off), and (7) evening_hostel (interaction between Evening time slot and hostel residency). Combining Mutual Information filtering with L1-penalized Logistic Regression (C = 0.002) automatically pruned redundant raw columns (venue_capacity raw scale, hostel_resident raw main effect, year_of_study, gender, and parent_education) without any loss in cross-validation AUC.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)
insert_p_before(
    anchor_elm,
    "Hyperparameter optimization was conducted via GridSearchCV over 5-fold GroupKFold splits. Table 5.3 summarizes the candidate models, tuned hyperparameters, 5-fold cross-validation metrics, and selection rationale.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)

hp_headers = ["Model", "Key Parameters Tuned & Optimal Values", "5-Fold CV Performance & Selection Justification"]
hp_rows = [
    ["Majority-Class Baseline", "strategy = 'most_frequent'", "CV Accuracy = 66.18%, F1 = 0.7965, ROC-AUC = 0.4930, Log-Loss = 0.6399. Served as the naive lower bound."],
    ["Logistic Regression (Selected Primary)", "penalty = 'l2', C = 0.01, solver = 'lbfgs', max_iter = 500, class_weight = None, decision_threshold = 0.40", "CV Accuracy = 69.10%, F1 = 0.8000 (tuned), ROC-AUC = 0.6970, Log-Loss = 0.5851. Achieved the highest accuracy and ROC-AUC with calibrated probabilities and transparent log-odds coefficients."],
    ["Decision Tree", "max_depth = 6, min_samples_leaf = 50, random_state = 42", "CV Accuracy = 68.30%, F1 = 0.7880, ROC-AUC = 0.6780, Log-Loss = 0.5968. Prone to step-function probability quantization."],
    ["Random Forest", "n_estimators = 200, max_depth = 8, min_samples_leaf = 30, n_jobs = -1", "CV Accuracy = 68.80%, F1 = 0.7970, ROC-AUC = 0.6950, Log-Loss = 0.5873. Strong ensemble performance but higher latency and less direct log-odds interpretability."],
    ["Gradient Boosting (HistGB)", "max_iter = 150, max_depth = 5, learning_rate = 0.06, min_samples_leaf = 40", "CV Accuracy = 69.00%, F1 = 0.7920, ROC-AUC = 0.6970, Log-Loss = 0.5840. Tied Logistic Regression in AUC but offered no improvement over the simpler linear model."]
]
insert_centered_table_before(anchor_elm, hp_headers, hp_rows, col_widths_inches=[1.5, 2.1, 2.6])
insert_seq_caption_before(anchor_elm, "Table", 5, 3, "Optimized Model Hyperparameters and Cross-Validation Summary")

insert_p_before(
    anchor_elm,
    "To ensure model transparency for university event organizers, standardized log-odds coefficients were extracted from the trained Logistic Regression classifier. As shown in Figure 5.4, the strongest positive drivers of student turnout were past_attendance_rate, high-priority SMS notifications (sms_priority_high), Workshop and Career Fair categories, sunny weather, and afternoon scheduling. Conversely, rainy weather (weather_rainy), examination periods (exam_period), weekend scheduling (is_weekend), and longer student commute times (travel_time_minutes) acted as the primary negative predictors of attendance.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)

insert_image_with_caption_before(
    anchor_elm,
    os.path.join(FIG_DIR, "coefficients.png"),
    5, 4,
    "Top 15 Standardized Logistic Regression Log-Odds Coefficients",
    width_inches=5.2
)

# 5.4.2 Model Evaluation Metrics
insert_p_before(anchor_elm, "Model Evaluation Metrics", style_name="Heading 3", align=WD_ALIGN_PARAGRAPH.LEFT, bold=True, space_before=8, space_after=4)
insert_p_before(
    anchor_elm,
    "Because SmartEvent operates at both the individual student registration level (binary classification: attended vs. no-show) and the aggregate campus event level (headcount forecasting), complementary classification and regression metrics were computed on the held-out future test set of 140 events (28,359 registrations). At the student level, classification accuracy measured the overall proportion of correctly predicted registrations:",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)

insert_equation_before(
    anchor_elm,
    "Accuracy = (TP + TN) / (TP + TN + FP + FN)",
    5, 3,
    "Accuracy Formula"
)

insert_p_before(
    anchor_elm,
    "where TP and TN denote true positives (correctly predicted attendees) and true negatives (correctly predicted no-shows), while FP and FN represent false positives and false negatives, respectively. Precision quantified the proportion of predicted attendees who actually attended the event:",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)

insert_equation_before(
    anchor_elm,
    "Precision = TP / (TP + FP)",
    5, 4,
    "Precision Formula"
)

insert_p_before(
    anchor_elm,
    "Recall (sensitivity) measured the proportion of actual student attendees successfully identified by the classifier:",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)

insert_equation_before(
    anchor_elm,
    "Recall = TP / (TP + FN)",
    5, 5,
    "Recall Formula"
)

insert_p_before(
    anchor_elm,
    "To balance precision and recall, the F1-score was computed as their harmonic mean:",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)

insert_equation_before(
    anchor_elm,
    "F1-Score = 2 × (Precision × Recall) / (Precision + Recall)",
    5, 6,
    "Formula to Calculate F1-Score of the Models"
)

insert_p_before(
    anchor_elm,
    "In addition, the Area Under the Receiver Operating Characteristic Curve (ROC-AUC) evaluated discriminative ranking across all probability thresholds, while Log-Loss and Brier Score quantified probability calibration. At the aggregate event level across all M = 140 unseen test events, headcount forecasting accuracy was evaluated using Mean Absolute Error (MAE):",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)

insert_equation_before(
    anchor_elm,
    "MAE_{event} = (1 / M) ∑_{e=1}^{M} |Ŷ_e - Y_e|",
    5, 7,
    "Event-Level Headcount Mean Absolute Error Formula"
)

insert_p_before(
    anchor_elm,
    "where Ŷ_e is the model's predicted headcount and Y_e is the actual observed attendance for event e. On the 140 unseen future test events, the deployed Logistic Regression model achieved a student-level Accuracy of 69.44%, Precision of 69.38%, Recall of 95.87%, F1-score of 0.8050, ROC-AUC of 0.7301, Log-Loss of 0.5780, and Brier Score of 0.1975 at the default 0.50 threshold (and 98.71% recall with an F1-score of 0.8000 at the tuned 0.40 threshold). Figure 5.5 presents the comparative ROC curves across all four trained machine learning architectures on the unseen test events, confirming that Logistic Regression (AUC = 0.730) outperformed Decision Tree (AUC = 0.705), Random Forest (AUC = 0.723), and Gradient Boosting (AUC = 0.725).",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)

insert_image_with_caption_before(
    anchor_elm,
    os.path.join(FIG_DIR, "roc_curves.png"),
    5, 5,
    "Comparative ROC Curves for Evaluated Classifiers on Unseen Future Test Events",
    width_inches=4.8
)

insert_p_before(
    anchor_elm,
    "Figure 5.6 shows the confusion matrix of the deployed Logistic Regression classifier evaluated across all 28,359 student registrations in the held-out future test set. The model correctly identified 18,419 actual attendees (95.87% sensitivity) alongside 731 confirmed no-shows, ensuring that event organizers are protected against unexpected venue overcrowding.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)

insert_image_with_caption_before(
    anchor_elm,
    os.path.join(FIG_DIR, "confusion_matrix.png"),
    5, 6,
    "Confusion Matrix for the Logistic Regression Model on the Held-Out Test Set",
    width_inches=4.4
)

insert_p_before(
    anchor_elm,
    "When individual student probabilities were summed per event using Equation 5.2 across the 140 held-out future test events, the SmartEvent Logistic Regression pipeline achieved an event-level Mean Absolute Error (MAE) of 13.61 attendees (corresponding to a Mean Absolute Percentage Error of 10.99%, with 54.3% of test events predicted within ±10% of actual turnout). This outperformed both the naive flat-turnout baseline (MAE = 15.31 attendees) and the student-history-only baseline (MAE = 15.10 attendees). Figure 5.7 illustrates the strong linear alignment between actual and predicted event headcounts across the 140 test events, while the probability calibration curve is provided in Appendix 3.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)

insert_image_with_caption_before(
    anchor_elm,
    os.path.join(FIG_DIR, "event_headcount.png"),
    5, 7,
    "Predicted vs. Actual Event Headcount Across 140 Unseen Future Test Events",
    width_inches=4.8
)

# ------------------------------------------------------------------------------
# 5.5 Functional Testing
# ------------------------------------------------------------------------------
insert_p_before(anchor_elm, "Functional Testing", style_name="Heading 2", align=WD_ALIGN_PARAGRAPH.LEFT, bold=True, space_before=10, space_after=4)
insert_p_before(
    anchor_elm,
    "Functional testing was conducted across the integrated React.js frontend, React Native mobile view, Node.js/Express REST API, and FastAPI machine learning microservice to verify that every module satisfied the functional and non-functional requirements specified in Chapter 4. Each test case defined the target module, test description, input preconditions, observed system outcome, and pass/fail verdict, as summarized in Table 5.4.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)

ft_headers = ["Test Case ID", "Module", "Description", "Test Data / Preconditions", "Outcome", "Verdict"]
ft_rows = [
    ["TC-01", "Authentication (Sign Up & Sign In — FR-01)", "Register a new student account and authenticate an organizer account.", "Student: student@strathmore.edu (ID: 154210); Organizer: organizer@strathmore.edu; Password: password123.", "Bcrypt password hash verified; signed JWT token issued; user redirected to role-specific dashboard.", "Pass"],
    ["TC-02", "Authentication (Invalid Login & RBAC — NFR-01)", "Attempt login with wrong password and attempt student access to organizer POST /api/events route.", "Invalid password 'wrongpass'; Student Bearer token sent to organizer endpoint.", "System rejected login with HTTP 401 'Invalid credentials' and blocked unauthorized route with HTTP 403.", "Pass"],
    ["TC-03", "Event Creation & Live ML Forecast (FR-02, FR-04)", "Create a new campus event in Organizer Dashboard and trigger live ML turnout estimation.", "Title: 'Strathmore FinTech Symposium', Category: Academic, Slot: Afternoon, Capacity: 150, RSVPs: 110, SMS Priority: High.", "Event saved to database; FastAPI model returned 89.6% turnout rate, capacity utilization, and optimal setup advice.", "Pass"],
    ["TC-04", "Student Event Discovery & One-Tap RSVP (FR-02)", "Filter events by category on Student Portal and submit an RSVP registration.", "Logged-in student (154210); selected 'Strathmore Tech Innovation Summit 2026' (evt-101).", "Registration record persisted; RSVP counter incremented dynamically; confirmation displayed on student schedule.", "Pass"],
    ["TC-05", "Duplicate Registration Prevention (FR-02)", "Attempt to register the same student twice for an already registered event.", "Student 154210 clicking RSVP again on event evt-101.", "Backend validation rejected duplicate entry and maintained accurate single RSVP count.", "Pass"],
    ["TC-06", "Priority-Based SMS Broadcast (FR-03)", "Compose and dispatch a High-Priority SMS alert to registered event participants.", "Event: evt-101, Priority: HIGH (Level 3), Message: 'Keynote venue moved to Auditorium A', Recipients: 240 students.", "POST /api/sms/send formatted message with [HIGH PRIORITY] prefix, dispatched via Africa's Talking API handler, and logged DELIVERY status.", "Pass"],
    ["TC-07", "Student Priority Notification Inbox (FR-03, NFR-02)", "Inspect incoming notifications on the Student Mobile View across urgency tiers.", "Dispatched High, Medium, and Low priority notifications stored in database.", "Notifications rendered in chronological order with red (HIGH), amber (MEDIUM), and blue/green (LOW) visual urgency badges.", "Pass"],
    ["TC-08", "Invalid Payload & Fault Tolerance (NFR-03)", "Submit an SMS request with an empty message body and test prediction fallback when ML service is offline.", "Empty POST /api/sms/send body; simulated offline port 8000 during POST /api/predict.", "SMS endpoint returned HTTP 400 validation error without crashing; prediction endpoint gracefully invoked fallback estimator.", "Pass"],
    ["TC-09", "Analytics Dashboard & Audit Logs (FR-04)", "View executive analytics charts and filter SMS audit logs by priority tier.", "Logged-in Organizer viewing Analytics Dashboard and SMS History table.", "Recharts bar charts rendered Registered vs. ML Predicted vs. Actual turnout and SMS priority distribution accurately.", "Pass"]
]
insert_centered_table_before(anchor_elm, ft_headers, ft_rows, col_widths_inches=[0.75, 1.15, 1.15, 1.25, 1.35, 0.55])
insert_seq_caption_before(anchor_elm, "Table", 5, 4, "Functional Testing Results")

# ------------------------------------------------------------------------------
# 5.6 Results and Discussion
# ------------------------------------------------------------------------------
insert_p_before(anchor_elm, "Results and Discussion", style_name="Heading 2", align=WD_ALIGN_PARAGRAPH.LEFT, bold=True, space_before=10, space_after=4)
insert_p_before(
    anchor_elm,
    "The experimental evaluation and system-level testing demonstrated that the SmartEvent platform fulfilled all four specific objectives established in Chapter 1. First, auditing the 20,000-row Kaggle student attendance dataset and combining its empirical behavioral parameters with 700 simulated Strathmore University events (149,892 cleaned registrations) resolved the scarcity of university-specific attendance data and eliminated post-event target leakage. Second, evaluating five candidate classifiers via 5-fold event-grouped cross-validation revealed that L2-regularized Logistic Regression (CV ROC-AUC = 0.6970, Log-Loss = 0.5851) matched non-linear ensemble methods such as Random Forest (CV ROC-AUC = 0.6950) and Gradient Boosting (CV ROC-AUC = 0.6970) while offering superior probability calibration and direct log-odds interpretability.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)
insert_p_before(
    anchor_elm,
    "On the held-out future test set of 140 campus events (28,359 registrations), the deployed Logistic Regression model achieved an ROC-AUC of 0.7301, an F1-score of 0.8050, a student-level recall of 95.87%, and an event-level headcount MAE of 13.61 attendees (10.99% MAPE), outperforming both the flat-turnout baseline (MAE = 15.31) and the historical-rate baseline (MAE = 15.10). Crucially, counterfactual evaluation confirmed that dispatching a High-Priority SMS notification produced an average expected turnout lift of +12.8% to +13.5%, particularly mitigating no-show risk among off-campus commuter students during afternoon and rainy-weather sessions.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)
insert_p_before(
    anchor_elm,
    "Functional verification of the deployed web and mobile interfaces confirmed seamless integration between the React.js organizer portal, the Node.js/Express REST API, the Africa's Talking SMS gateway, and the FastAPI prediction engine. As shown in Figure 5.8, event organizers can inspect real-time machine learning attendance forecasts via the Scikit-Learn Logistic Regression Turnout Forecast modal (displaying the forecasted attendance of 311 out of 500 seats, 75% show-up probability, 62.2% venue utilization, +8.1% priority SMS turnout lift, and automated logistics recommendations) across active campus events.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)

insert_image_with_caption_before(
    anchor_elm,
    os.path.join(FIG_DIR, "fig5_8_organizer_prediction_ui.png"),
    5, 8,
    "SmartEvent Organizer Dashboard Showing Live ML Turnout Predictions",
    width_inches=5.8
)

insert_p_before(
    anchor_elm,
    "Figure 5.9 illustrates the Priority-Based SMS Broadcast Studio, where event organizers classify outgoing notifications into High, Medium, or Low urgency levels, preview the formatted SMS payload, dispatch messages through the Africa's Talking API, and audit real-time delivery statuses in the Recent Priority SMS Dispatches log.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)

insert_image_with_caption_before(
    anchor_elm,
    os.path.join(FIG_DIR, "fig5_9_priority_sms_studio_ui.png"),
    5, 9,
    "Priority-Based SMS Broadcast Studio and Delivery Audit Logs",
    width_inches=5.8
)

insert_p_before(
    anchor_elm,
    "Finally, Figure 5.10 displays the SmartEvent Administration and Predictive Analytics Overview, which compares registered seats against total venue capacity across all six campus event categories, visualizes Africa's Talking SMS dispatches by priority tier, tracks capacity utilization for the most popular university events, and reports live telemetry from the deployed LogisticRegression pipeline (ROC-AUC 0.7301, 69.4% student-level accuracy, and 13.607-student event headcount MAE across 140 held-out test events). Additional real-time screenshots of the public authentication portal, student QR-code entry pass interface, priority SMS alert inbox, organizer event management table, and backend database console are provided in Appendices 4 through 8.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)

insert_image_with_caption_before(
    anchor_elm,
    os.path.join(FIG_DIR, "fig5_10_analytics_dashboard_ui.png"),
    5, 10,
    "SmartEvent Predictive Analytics and Turnout Comparison Report",
    width_inches=5.8
)

# ------------------------------------------------------------------------------
# 5.7 GitHub Documentation
# ------------------------------------------------------------------------------
insert_p_before(anchor_elm, "GitHub Documentation", style_name="Heading 2", align=WD_ALIGN_PARAGRAPH.LEFT, bold=True, space_before=10, space_after=4)
insert_p_before(
    anchor_elm,
    "The complete source code, data preprocessing scripts, trained model metadata, and deployment configurations for the SmartEvent system are version-controlled on GitHub at https://github.com/wafuke/smartevent. The repository is organized into four modular top-level directories to maintain a clean separation of concerns across the client, backend, machine learning, and experimentation layers.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)
insert_p_before(
    anchor_elm,
    "At the root level, the frontend/ directory houses the React.js (Vite + Tailwind CSS) application, including role-guarded pages and components for administrators, event organizers, and students (HomePage.jsx, AuthModal.jsx, OrganizerDashboardPage.jsx, StudentDashboardPage.jsx, AdminDashboardPage.jsx, EventFormModal.jsx, and SmsComposer.jsx). The mobile/ directory contains the standalone React Native (Expo) student mobile application. The backend/ directory holds the Node.js and Express.js REST API server (server.js), Firebase Firestore and local JSON persistence adapters (db.js), JWT role-verification middleware (middleware/auth.js), and modular route controllers (routes/auth.js, events.js, registrations.js, sms.js, predict.js, and analytics.js).",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)
insert_p_before(
    anchor_elm,
    "The ml-service/ directory encapsulates the Python machine learning package (smartevent_ml/), including Stage 1 Kaggle auditing (kaggle_prep.py), Stage 2 synthetic Strathmore University event generation (synthetic.py), Stage 3 deterministic cleaning (clean.py), Stage 4–5 domain feature engineering (features.py), Stage 6–8 model training and evaluation (train.py), the FastAPI inference server (main.py), and the serialized pipeline artifact (models/attendance_model.joblib). Finally, the notebooks/ directory contains the self-contained Google Colaboratory notebook (SmartEvent_ML_Attendance_Prediction.ipynb) synchronized with Google Drive for cloud training reproducibility. Sensitive credentials and environment keys (.env) are excluded via .gitignore, ensuring security and software-engineering best practices throughout the project lifecycle.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)

# ==============================================================================
# 6. CHAPTER 6: CONCLUSIONS, RECOMMENDATIONS AND FUTURE WORKS
# ==============================================================================
insert_p_before(anchor_elm, "Conclusions, Recommendations and Future Works", style_name="Heading 1", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, space_before=12, space_after=6)

# 6.1 Conclusions
insert_p_before(anchor_elm, "Conclusions", style_name="Heading 2", align=WD_ALIGN_PARAGRAPH.LEFT, bold=True, space_before=8, space_after=4)
insert_p_before(
    anchor_elm,
    "This research set out to design, develop, and evaluate SmartEvent, an integrated web and mobile university event management system combining a Priority-Based SMS Notification Engine with a machine learning attendance prediction module for Strathmore University. Addressing the first and second research objectives, the literature review and empirical audit established that existing institutional event platforms treat event scheduling, attendance tracking, and broadcast notifications as isolated silos, resulting in information overload, notification fatigue, and uncalibrated manual turnout estimates. By auditing 20,000 Kaggle student attendance records (removing post-outcome absence_reason leakage) and synthesizing 700 Strathmore University campus events (149,892 cleaned registrations), this study constructed a leakage-free, chronologically partitioned dataset tailored to university event dynamics.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)
insert_p_before(
    anchor_elm,
    "In fulfillment of the third and fourth research objectives, the full-stack SmartEvent platform was successfully implemented using React.js, React Native (Expo), Node.js/Express.js, Firebase, the Africa's Talking SMS API, and a Python FastAPI machine learning microservice. Across 5-fold event-grouped cross-validation and final evaluation on 140 unseen future test events, the calibrated L2-regularized Logistic Regression model achieved a student-level ROC-AUC of 0.7301, an F1-score of 0.8050, a recall of 95.87%, and an event-level headcount MAE of 13.61 attendees (10.99% MAPE), outperforming both flat-rate and historical-attendance baselines. Furthermore, integrating urgency-tiered SMS dispatching (High, Medium, and Low priority) demonstrated a counterfactual turnout lift of up to +13.5% for high-priority reminders while providing organizers with real-time capacity utilization warnings and actionable logistics guidance.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)

# 6.2 Recommendations
insert_p_before(anchor_elm, "Recommendations", style_name="Heading 2", align=WD_ALIGN_PARAGRAPH.LEFT, bold=True, space_before=8, space_after=4)
insert_p_before(
    anchor_elm,
    "Based on the empirical findings and system evaluation, several actionable recommendations are proposed for university event organizers, ICT administrators, and system maintainers at Strathmore University. First, university clubs, faculties, and administrative departments should adopt urgency-tiered SMS governance rather than uniform broadcast messaging. High-Priority SMS dispatches should be reserved strictly for time-critical updates—such as last-minute venue relocations, registration deadlines, or events flagged by the ML engine with low turnout risk (<40% capacity utilization)—to preserve student responsiveness and prevent notification fatigue.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)
insert_p_before(
    anchor_elm,
    "Second, event organizers should consult the SmartEvent ML turnout simulator during the initial venue booking and catering procurement stages, particularly when scheduling afternoon or evening events during rainy weather or near examination periods, where the model identified significant commuter drop-off (-0.5937 log-odds for rain and negative evening travel interactions). Third, university ICT administrators deploying the system into production should transition from single-instance local JSON fallback storage to managed Firebase Firestore with automated daily backups and configure dedicated institutional Africa's Talking sender IDs to maximize SMS delivery trust among students.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)

# 6.3 Future Works
insert_p_before(anchor_elm, "Future Works", style_name="Heading 2", align=WD_ALIGN_PARAGRAPH.LEFT, bold=True, space_before=8, space_after=4)
insert_p_before(
    anchor_elm,
    "Several promising directions remain open for extending the SmartEvent platform in future research and deployment iterations. First, as Strathmore University accumulates multi-year real-world RSVP and check-in logs through the deployed platform, the machine learning pipeline should be periodically retrained on 100% live institutional check-in data (captured via QR-code or student smart-card scanning at venue entrances) to replace synthetic event records and further reduce the 13.61-attendee headcount MAE.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)
insert_p_before(
    anchor_elm,
    "Second, future studies should explore online continual learning and automated probability recalibration to account for concept drift across academic semesters, as well as personalized send-time optimization that schedules SMS reminders according to individual student timetable free periods. Finally, integrating the SmartEvent REST API directly with Strathmore University's Academic Management System (AMS) and institutional room-booking ERP would automate timetable conflict detection and venue reservation approvals within a unified campus ecosystem.",
    align=WD_ALIGN_PARAGRAPH.JUSTIFY
)


# ==============================================================================
# 7. APPENDICES ENHANCEMENT (ADD REAL ML & SYSTEM SCREENSHOTS AS APPENDICES 3-8)
# ==============================================================================
for p in doc.paragraphs:
    if p.text.strip().startswith("Appendix"):
        for r in p.runs:
            set_run_tnr12(r, bold=("Appendix" in p.style.name or p.style.name == "kevin"), italic=False, color_rgb=(0, 0, 0))
    if len(p._element.xpath(".//a:blip")) > 0:
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER


def add_appendix_figure(app_title, img_filename, cap_text, width_in=5.6):
    p_head = doc.add_paragraph()
    p_head.style = doc.styles["kevin"] if "kevin" in doc.styles else doc.styles["Heading 1"]
    r_h = p_head.add_run(app_title)
    set_run_tnr12(r_h, bold=True, color_rgb=(0, 0, 0))
    format_paragraph(p_head, align=WD_ALIGN_PARAGRAPH.LEFT, bold=True, space_before=12, space_after=6)

    p_img = doc.add_paragraph()
    p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_img.add_run().add_picture(os.path.join(FIG_DIR, img_filename), width=Inches(width_in))

    p_cap = doc.add_paragraph()
    p_cap.style = doc.styles["Caption"] if "Caption" in doc.styles else doc.styles["Normal"]
    p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_c = p_cap.add_run(cap_text)
    set_run_tnr12(r_c, bold=False, italic=False, color_rgb=(0, 0, 0))


add_appendix_figure(
    "Appendix 3: Logistic Regression Probability Calibration Curve on Held-Out Test Events",
    "calibration.png",
    "Appendix 3: Calibration Curve for the Deployed Logistic Regression Classifier",
    width_in=4.6,
)
add_appendix_figure(
    "Appendix 4: SmartEvent Public Homepage and Role-Based Authentication Interface",
    "app3_public_home_auth.png",
    "Appendix 4: SmartEvent Public Homepage and Sign-In Authentication Modal",
    width_in=5.8,
)
add_appendix_figure(
    "Appendix 5: Student Portal — Confirmed Event RSVPs and Digital QR Entry Pass",
    "app4_student_rsvp_qr_pass.png",
    "Appendix 5: Student Portal Displaying Confirmed RSVPs and Digital QR Code Entry Pass",
    width_in=5.8,
)
add_appendix_figure(
    "Appendix 6: Student Portal — Africa's Talking Priority SMS Alerts and Notification Inbox",
    "app5_student_sms_alerts.png",
    "Appendix 6: Student Portal Displaying Urgency-Tagged Priority SMS Alerts and In-App Notifications",
    width_in=5.8,
)
add_appendix_figure(
    "Appendix 7: Organizer Portal — Campus Event Management and Live ML Turnout Table",
    "app6_organizer_analytics_simulator.png",
    "Appendix 7: Organizer Portal Showing Listed Campus Events, RSVPs, and ML Turnout Column",
    width_in=5.8,
)
add_appendix_figure(
    "Appendix 8: SmartEvent Administration and Database Persistence Console",
    "app7_fastapi_swagger_docs.png",
    "Appendix 8: SmartEvent Backend Database Tables and REST API Administration Console",
    width_in=5.8,
)


# ==============================================================================
# 8. UPDATE FRONT-MATTER LIST OF FIGURES, LIST OF TABLES, AND LIST OF EQUATIONS
# ==============================================================================
# Find the 'List of tables' paragraph and 'List Of Abbreviations' paragraph to insert cleanly
lof_heading = [p for p in doc.paragraphs if p.text.strip() == "List of Figures"][0]
lot_heading = [p for p in doc.paragraphs if p.text.strip().lower() == "list of tables"][0]
loa_heading = [p for p in doc.paragraphs if p.text.strip().lower() == "list of abbreviations"][0]

# Fix capitalization of "List of Tables" and "List of Abbreviations"
replace_paragraph_text(lot_heading, "List of Tables", style_name="kevin", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True)
replace_paragraph_text(loa_heading, "List of Abbreviations", style_name="kevin", align=WD_ALIGN_PARAGRAPH.CENTER, bold=True)


def add_tof_entry_before(anchor, entry_text, page_str):
    p = doc.add_paragraph()
    if "table of figures" in doc.styles:
        p.style = doc.styles["table of figures"]
    p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    p.paragraph_format.line_spacing = 1.5
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(2)
    # Add right tab stop with dot leader at 9350 twips (~6.5 inches)
    pPr = p._p.get_or_add_pPr()
    tabs = parse_xml(f'<w:tabs {nsdecls("w")}><w:tab w:val="right" w:leader="dot" w:pos="9350"/></w:tabs>')
    pPr.append(tabs)
    r1 = p.add_run(f"{entry_text}\t{page_str}")
    set_run_tnr12(r1, bold=False, italic=False, color_rgb=(0, 0, 0))
    anchor.addprevious(p._p)


# Add Chapter 5 figures to List of Figures (right before List of Tables heading)
ch5_figures = [
    ("Figure 5.1: Sample of the Audited Kaggle Student Attendance Dataset", "44"),
    ("Figure 5.2: Sample of the Cleaned Strathmore University Event Registrations Dataset", "45"),
    ("Figure 5.3: SmartEvent Two-Tier Logistic Regression Attendance Prediction Structure", "47"),
    ("Figure 5.4: Top 15 Standardized Logistic Regression Log-Odds Coefficients", "49"),
    ("Figure 5.5: Comparative ROC Curves for Evaluated Classifiers on Unseen Future Test Events", "51"),
    ("Figure 5.6: Confusion Matrix for the Logistic Regression Model on the Held-Out Test Set", "52"),
    ("Figure 5.7: Predicted vs. Actual Event Headcount Across 140 Unseen Future Test Events", "53"),
    ("Figure 5.8: SmartEvent Organizer Dashboard Showing Live ML Turnout Predictions", "56"),
    ("Figure 5.9: Priority-Based SMS Broadcast Studio and Delivery Audit Logs", "57"),
    ("Figure 5.10: SmartEvent Predictive Analytics and Turnout Comparison Report", "58"),
]
for f_txt, f_pg in ch5_figures:
    add_tof_entry_before(lot_heading._p, f_txt, f_pg)

# Add Chapter 5 tables to List of Tables (right before List of Abbreviations heading)
ch5_tables = [
    ("Table 5.1: Hardware Specifications", "41"),
    ("Table 5.2: Software Specifications", "42"),
    ("Table 5.3: Optimized Model Hyperparameters and Cross-Validation Summary", "48"),
    ("Table 5.4: Functional Testing Results", "54"),
]
for t_txt, t_pg in ch5_tables:
    add_tof_entry_before(loa_heading._p, t_txt, t_pg)

# Insert "List of Equations" section right before List of Abbreviations (matching Elvis Makara's front matter!)
p_loe = doc.add_paragraph()
p_loe.style = doc.styles["kevin"]
r_loe = p_loe.add_run("List of Equations")
set_run_tnr12(r_loe, bold=True, color_rgb=(0, 0, 0))
format_paragraph(p_loe, align=WD_ALIGN_PARAGRAPH.CENTER, bold=True, space_before=12, space_after=6)
loa_heading._p.addprevious(p_loe._p)

ch5_equations = [
    ("Equation 5.1: Logistic Regression Attendance Probability Function", "46"),
    ("Equation 5.2: Event Headcount Aggregation Formula", "46"),
    ("Equation 5.3: Accuracy Formula", "49"),
    ("Equation 5.4: Precision Formula", "50"),
    ("Equation 5.5: Recall Formula", "50"),
    ("Equation 5.6: Formula to Calculate F1-Score of the Models", "50"),
    ("Equation 5.7: Event-Level Headcount Mean Absolute Error Formula", "50"),
]
for eq_txt, eq_pg in ch5_equations:
    add_tof_entry_before(loa_heading._p, eq_txt, eq_pg)


# ==============================================================================
# 9. FINAL SWEEP: ENSURE ALL RUNS IN DOCUMENT USE TIMES NEW ROMAN & MARK FIELDS DIRTY
# ==============================================================================
for p in doc.paragraphs:
    for r in p.runs:
        set_run_tnr12(r, color_rgb=(0, 0, 0))

# Also ask Word to update TOC/fields automatically on open
settings_elm = doc.settings.element
if settings_elm.find(qn("w:updateFields")) is None:
    uf = OxmlElement("w:updateFields")
    uf.set(qn("w:val"), "true")
    settings_elm.append(uf)

doc.save(DOC_PATH)
print(f"Successfully updated and saved: {DOC_PATH}")
