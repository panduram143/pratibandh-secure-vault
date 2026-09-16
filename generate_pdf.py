import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()

        # National Tricolor top stripe
        self.setFillColor(colors.HexColor('#FF9933'))
        self.rect(54, 750, 168, 3, stroke=0, fill=1)
        self.setFillColor(colors.HexColor('#FFFFFF'))
        self.rect(222, 750, 168, 3, stroke=0, fill=1)
        self.setFillColor(colors.HexColor('#138808'))
        self.rect(390, 750, 168, 3, stroke=0, fill=1)

        # Header Text (Pages > 1)
        if self._pageNumber > 1:
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(colors.HexColor('#0A1B38'))
            self.drawString(54, 758, "PRATIBANDH — Secure Digital Document & Evidence Management System")
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor('#64748B'))
            self.drawRightString(558, 758, "GOVERNMENT OF INDIA • MHA")

            self.setStrokeColor(colors.HexColor('#CBD5E1'))
            self.setLineWidth(0.5)
            self.line(54, 754, 558, 754)

        # Footer
        self.setStrokeColor(colors.HexColor('#CBD5E1'))
        self.setLineWidth(0.5)
        self.line(54, 45, 558, 45)

        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor('#0A1B38'))
        self.drawString(54, 32, "RESTRICTED // STATUTORY EVIDENCE VAULT — SEC 65B INDIAN EVIDENCE ACT COMPLIANT")

        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor('#64748B'))
        self.drawRightString(558, 32, f"Page {self._pageNumber} of {page_count}")

        self.restoreState()

def create_pdf(filename="PRATIBANDH_System_Architecture_and_Specifications.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    # Custom Color Palette
    NAVY = colors.HexColor('#0A1B38')
    GOLD = colors.HexColor('#D4AF37')
    DARK = colors.HexColor('#1E293B')
    GRAY = colors.HexColor('#64748B')
    LIGHT_BG = colors.HexColor('#F8FAFC')
    BORDER_COLOR = colors.HexColor('#E2E8F0')

    # Custom Typography Styles
    style_ministry = ParagraphStyle(
        'MinistryHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        alignment=1, # Center
        textColor=GOLD,
        spaceAfter=3
    )

    style_title = ParagraphStyle(
        'MainTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        alignment=1,
        textColor=NAVY,
        spaceAfter=3
    )

    style_sub = ParagraphStyle(
        'SubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=10,
        leading=13,
        alignment=1,
        textColor=GRAY,
        spaceAfter=10
    )

    style_h1 = ParagraphStyle(
        'SectionH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=NAVY,
        spaceBefore=12,
        spaceAfter=4,
        keepWithNext=True
    )

    style_h2 = ParagraphStyle(
        'SectionH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=NAVY,
        spaceBefore=8,
        spaceAfter=3,
        keepWithNext=True
    )

    style_body = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=DARK,
        spaceAfter=4
    )

    style_body_italic = ParagraphStyle(
        'CustomBodyItalic',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor('#334155'),
        spaceAfter=5
    )

    style_code = ParagraphStyle(
        'CodeBlock',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.5,
        leading=9.5,
        textColor=NAVY
    )

    style_th = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white,
        alignment=1
    )

    style_td = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.5,
        textColor=DARK
    )

    style_td_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=NAVY
    )

    story = []

    # 1. Header & Title Block
    story.append(Paragraph("GOVERNMENT OF INDIA • MINISTRY OF HOME AFFAIRS", style_ministry))
    story.append(Paragraph("PRATIBANDH: SECURE DIGITAL DOCUMENT & EVIDENCE VAULT", style_title))
    story.append(Paragraph("Comprehensive System Architecture, Technical Specifications & Component Directory", style_sub))

    # Meta Banner
    meta_data = [[
        Paragraph(
            "<font color='#D4AF37'><b>STATUTORY EVIDENCE VAULT</b></font> | <b>Section 65B Indian Evidence Act & IT Act 2000 Compliant</b><br/>"
            "Problem Statement: SIH 1690 (Centralized Encrypted Forensic Repository) | Build Version: 2.4.0 (Gov-Release)",
            ParagraphStyle('MetaBanner', parent=styles['Normal'], fontName='Helvetica', fontSize=8, leading=11, alignment=1, textColor=colors.white)
        )
    ]]
    meta_table = Table(meta_data, colWidths=[504])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), NAVY),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('CORNERPAD', (0,0), (-1,-1), 4),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 8))

    # --- SECTION 1 ---
    story.append(Paragraph("1. EXECUTIVE SUMMARY & CORE OBJECTIVES", style_h1))
    story.append(HRFlowable(width="100%", thickness=1, color=GOLD, spaceAfter=6, spaceBefore=1))
    story.append(Paragraph(
        "<b>PRATIBANDH</b> is a government-grade digital evidence and case document repository built for police departments, courts, and forensic laboratories. "
        "It solves the critical operational risks of document tampering, unauthorized screen scraping, untracked access, and inter-jurisdictional data silos through four core pillars:",
        style_body
    ))

    p1 = "<b>1. Dynamic Spotlight Masking:</b> Documents are rendered onto an HTML5 Canvas behind a 10px Gaussian blur. Only a 130px circular aperture following the cursor is rendered sharp in real time, defeating full-page photographic capture."
    p2 = "<b>2. Forensic Pixel Watermarking:</b> Officer identity (Name, Form/Badge ID, IP address, and ISO timestamp) is repeatedly baked directly into canvas pixels at -25°, making any smartphone photo capture traceable to the exact terminal."
    p3 = "<b>3. AI-Powered ID Card & Facial Biometrics:</b> Client-side WebAssembly OCR (Tesseract.js) and 128-dimensional facial biometric embedding neural nets (@vladmandic/face-api) for tamper-proof officer authentication."
    p4 = "<b>4. AES-256-CBC Cryptography & Statutory Audit Ledger:</b> Zero plaintext files at rest; immutable record-by-record ledger compliant with Section 65B of the Indian Evidence Act."

    for p in [p1, p2, p3, p4]:
        story.append(Paragraph(f"• {p}", style_body))
    story.append(Spacer(1, 6))

    # --- SECTION 2 ---
    story.append(Paragraph("2. HIGH-LEVEL ARCHITECTURE & DATA FLOW", style_h1))
    story.append(HRFlowable(width="100%", thickness=1, color=GOLD, spaceAfter=6, spaceBefore=1))

    arch_text = """[ CLIENT TIER : React 18 + Vite SPA ]
├── Presentation: GovHeader (IST clock), GovFooter, FloatingActions Hub, RBAC Sidebar
├── Security Engine: Dual-Canvas HTML5 Spotlight Renderer + Pixel Watermark Stamping
└── AI Computer Vision: Tesseract.js OCR (Wasm) + vladmandic/face-api (128-d vectors)
                          │ HTTPS REST (Axios) / WSS (Socket.IO)
                          ▼
[ APPLICATION SERVER TIER : Node.js + Express.js ]
├── Middleware Pipeline: Helmet (CSP/HSTS) | CORS | Morgan | Multer Multipart
├── Auth & RBAC: JWT Bearer Verification + roleCheck (super_admin, station_admin, officer)
├── Controllers: Auth, RegisteredIDs, Cases, Documents, Collaboration, Audit, Dashboard
└── Audit Interceptor: Immutable capture of action, resource, IP, user-agent, timestamp
                          │
         ┌────────────────┴────────────────┐
         ▼                                 ▼
[ DATABASE : MongoDB Atlas ]     [ CRYPTOGRAPHIC STORAGE : Disk ]
- Users & RegisteredIDs          - AES-256-CBC Encrypted Files (*.pdf.enc)
- Cases & Evidence Records       - 16-byte Random IV Buffer Header
- AuditLogs (Indexed Ledger)     - Ephemeral Decryption Buffer Pipeline"""

    arch_data = [[Paragraph(f"<pre>{arch_text}</pre>", style_code)]]
    arch_table = Table(arch_data, colWidths=[504])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), LIGHT_BG),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(arch_table)
    story.append(Spacer(1, 8))

    # --- SECTION 3 ---
    story.append(Paragraph("3. BIT-BY-BIT TECHNOLOGY STACK & JUSTIFICATION", style_h1))
    story.append(HRFlowable(width="100%", thickness=1, color=GOLD, spaceAfter=6, spaceBefore=1))

    tech_table_data = [
        [
            Paragraph("Layer / Area", style_th),
            Paragraph("Technology", style_th),
            Paragraph("Role & Functionality", style_th),
            Paragraph("Why It Was Chosen", style_th)
        ],
        [
            Paragraph("Frontend UI", style_td_bold),
            Paragraph("React 18 + Vite 5", style_td),
            Paragraph("Reactive SPA component architecture, fast HMR, state-driven rendering.", style_td),
            Paragraph("Virtual DOM allows smooth 60fps canvas cursor tracking without lag.", style_td)
        ],
        [
            Paragraph("Styling & Theme", style_td_bold),
            Paragraph("TailwindCSS 3.4", style_td),
            Paragraph("Custom Indian Gov navy (#0a1b38) & gold (#d4af37) palette, responsive grid.", style_td),
            Paragraph("Utility classes enforce strict aesthetic consistency across all views.", style_td)
        ],
        [
            Paragraph("AI OCR Engine", style_td_bold),
            Paragraph("Tesseract.js 5.1 (Wasm)", style_td),
            Paragraph("Client-side character recognition from camera frames & photos.", style_td),
            Paragraph("Zero server GPU load; extracts Regd/Form Nos directly inside user browser.", style_td)
        ],
        [
            Paragraph("Facial Biometrics", style_td_bold),
            Paragraph("@vladmandic/face-api", style_td),
            Paragraph("TinyFaceDetector + 68 landmarks + 128-d descriptor extraction.", style_td),
            Paragraph("Privacy-first biometric extraction; video streams never leave client.", style_td)
        ],
        [
            Paragraph("Document Viewer", style_td_bold),
            Paragraph("HTML5 2D Canvas API", style_td),
            Paragraph("Dual-canvas pipeline for spotlight masking & forensic pixel watermarks.", style_td),
            Paragraph("Prevents DOM text inspection; blocks screenshot scraping completely.", style_td)
        ],
        [
            Paragraph("Backend API", style_td_bold),
            Paragraph("Node.js + Express 4.18", style_td),
            Paragraph("Asynchronous REST API routing, streaming endpoints, middleware pipeline.", style_td),
            Paragraph("High-throughput non-blocking I/O for concurrent evidence downloads.", style_td)
        ],
        [
            Paragraph("Database & ODM", style_td_bold),
            Paragraph("MongoDB + Mongoose", style_td),
            Paragraph("Document storage with text indexes, virtual aliases, and aggregation pipes.", style_td),
            Paragraph("Flexible schemas for complex crime metadata and sub-millisecond query speed.", style_td)
        ],
        [
            Paragraph("File Encryption", style_td_bold),
            Paragraph("Node Crypto (AES-256)", style_td),
            Paragraph("AES-256-CBC cipher with unique 16-byte IV prepended to every file.", style_td),
            Paragraph("Military-grade file security at rest; raw bytes unreadable if drive is stolen.", style_td)
        ],
        [
            Paragraph("Auth Security", style_td_bold),
            Paragraph("BcryptJS + JWT 9.0", style_td),
            Paragraph("Password hashing (12 rounds) & 24h HMAC-SHA256 signed bearer tokens.", style_td),
            Paragraph("Protects passwords from rainbow table attacks; enables stateless RBAC.", style_td)
        ],
        [
            Paragraph("Real-time Gateway", style_td_bold),
            Paragraph("Socket.IO 4.7", style_td),
            Paragraph("WebSocket event bus with station-specific room isolation.", style_td),
            Paragraph("Instantly pushes case collaboration and sharing alerts between stations.", style_td)
        ],
        [
            Paragraph("HTTP Security", style_td_bold),
            Paragraph("Helmet 7.1 + CORS", style_td),
            Paragraph("Applies CSP, HSTS, X-Frame-Options, and cross-origin security rules.", style_td),
            Paragraph("Mitigates Clickjacking, Cross-Site Scripting (XSS), and MIME sniffing.", style_td)
        ]
    ]

    tech_table = Table(tech_table_data, colWidths=[70, 95, 175, 164])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), NAVY),
        ('ALIGN', (0,0), (-1,0), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, LIGHT_BG])
    ]))
    story.append(tech_table)
    story.append(Spacer(1, 8))

    # --- SECTION 4 ---
    story.append(Paragraph("4. BIT-BY-BIT MODULE EXPLANATION & FUNCTIONALITY", style_h1))
    story.append(HRFlowable(width="100%", thickness=1, color=GOLD, spaceAfter=6, spaceBefore=1))

    # 4.1
    story.append(Paragraph("4.1 Anti-Screenshot Spotlight Document Viewer (DocumentViewer.jsx)", style_h2))
    story.append(Paragraph("• <b>Dual-Canvas Pipeline:</b> The component instantiates an offscreen in-memory canvas where sharp document text, classification stamps, and case seals are drawn.", style_body))
    story.append(Paragraph("• <b>Spotlight Masking:</b> The primary visible canvas draws the offscreen canvas with a 10px Gaussian blur (<code>ctx.filter = 'blur(10px)'</code>). When hovering, <code>ctx.clip()</code> cuts a 130px circular aperture at cursor position (X, Y) rendering the sharp version.", style_body))
    story.append(Paragraph("• <b>Forensic Pixel Stamping:</b> Rotated (-25°) watermark lines containing <code>CONFIDENTIAL • OFFICER NAME • FORM NO • IST TIMESTAMP</code> are repeatedly stamped directly into canvas pixels.", style_body))
    story.append(Paragraph("• <b>Hardware Capture Interception:</b> Keydown listeners block <code>Ctrl+P</code>, <code>Ctrl+S</code>, <code>Ctrl+U</code>, <code>PrintScreen</code>, and the right-click context menu.", style_body))
    story.append(Paragraph("<i>Why Used: Standard HTML text viewers allow full-page screenshots and DOM text scraping. Canvas spotlighting restricts visibility to an un-scrapable 130px aperture while stamping traceable forensic credentials into every pixel.</i>", style_body_italic))

    # 4.2
    story.append(Paragraph("4.2 AI ID Card Verification & Biometric Login (IDVerification.jsx, ocr.js, faceApi.js)", style_h2))
    story.append(Paragraph("• <b>Image Preprocessing:</b> Upscales camera frames to &ge; 1200px, computes luminosity grayscale (Y = 0.299R + 0.587G + 0.114B), and applies +30% contrast stretching for maximum OCR character clarity.", style_body))
    story.append(Paragraph("• <b>OCR & Barcode Extraction:</b> Tesseract.js (Wasm) and native <code>BarcodeDetector</code> API extract Form Number and personnel name tokens.", style_body))
    story.append(Paragraph("• <b>128-d Biometric Descriptors:</b> TinyFaceDetector locates the face on the ID card; FaceRecognitionNet computes a 128-dimensional floating point vector embedding.", style_body))
    story.append(Paragraph("• <b>Bio-Data Matcher:</b> Backend route <code>/api/auth/match-id-card</code> matches extracted registration numbers and tokens against the database, calculating confidence scores (&ge; 95%).", style_body))
    story.append(Paragraph("<i>Why Used: Eliminates password sharing and stolen credential attacks by requiring visual, verifiable physical departmental ID verification.</i>", style_body_italic))

    # 4.3
    story.append(Paragraph("4.3 Statutory Audit Trail & Activity Analytics (AuditLog.jsx, server/routes/audit.js)", style_h2))
    story.append(Paragraph("• <b>Visual Activity Bar Chart:</b> Ranks officers by 'Times Opened', 'Doc Views', 'Downloads', 'Logins', and 'Modifications' with multi-colored segmented proportional bars.", style_body))
    story.append(Paragraph("• <b>Tamper-Evident Ledger:</b> Tabular historical audit list showing IST timestamps, officer identity, Form Number, action badge, target resource, details, and IP address.", style_body))
    story.append(Paragraph("• <b>CSV & Print Export:</b> One-click generation and download of official CSV audit logs compliant with Section 65B of the Indian Evidence Act.", style_body))
    story.append(Paragraph("• <b>Database Aggregation:</b> Endpoint <code>/api/audit/user-stats</code> utilizes MongoDB <code>$lookup</code>, <code>$unwind</code>, and <code>$group</code> pipelines to aggregate activity counts directly on the database engine.", style_body))
    story.append(Paragraph("<i>Why Used: Guarantees digital evidence admissibility in court by proving an unbroken, certified digital chain of custody.</i>", style_body_italic))

    # 4.4
    story.append(Paragraph("4.4 AES-256-CBC File Encryption Pipeline (server/utils/encryption.js)", style_h2))
    story.append(Paragraph("• <b>Encryption (encryptFile):</b> Reads uploaded file buffer, generates a random 16-byte IV via <code>crypto.randomBytes(16)</code>, encrypts payload using <code>aes-256-cbc</code>, and prepends IV to the ciphertext buffer.", style_body))
    story.append(Paragraph("• <b>Decryption (decryptFile):</b> Slices first 16 bytes (IV), decrypts payload to a temporary file, streams to authorized officer, and immediately deletes temporary file via <code>fs.unlinkSync</code>.", style_body))
    story.append(Paragraph("<i>Why Used: Ensures that if server hard drives or backups are physically stolen, zero unencrypted evidence is compromised.</i>", style_body_italic))

    # 4.5
    story.append(Paragraph("4.5 Case Management & Collaboration (CaseList.jsx, SharedCases.jsx)", style_h2))
    story.append(Paragraph("• <b>Case Dossier Management:</b> Auto-generates unique IDs (CASE-YYYY-XXXXX), tracks crime categories (Murder, Rape, Theft, Cybercrime, Fraud, etc.), suspects, victims, priority, and assigned officers.", style_body))
    story.append(Paragraph("• <b>Cross-Station Sharing:</b> Dispatches inter-station access requests (<code>/api/collaboration</code>), enabling multi-jurisdictional collaboration across police stations.", style_body))
    story.append(Paragraph("<i>Why Used: Eliminates jurisdictional silos during multi-state criminal investigations.</i>", style_body_italic))

    # 4.6
    story.append(Paragraph("4.6 Government Frame & Floating Action Hub (GovHeader.jsx, FloatingActions.jsx)", style_h2))
    story.append(Paragraph("• <b>GovHeader & GovFooter:</b> Displays National Tricolor Ribbon, Ashoka Lion Emblem, Ministry of Home Affairs branding, live Indian Standard Time (IST) clock, and 1930 Cyber Crime Helpline.", style_body))
    story.append(Paragraph("• <b>FloatingActions:</b> Speed-dial menu offering one-click navigation to GitHub, Audit Charts, AI Scanner, Evidence Upload, and Case Creation.", style_body))
    story.append(Paragraph("<i>Why Used: Enforces statutory credibility and maximizes operational speed during critical incident handling.</i>", style_body_italic))
    story.append(Spacer(1, 6))

    # --- SECTION 5 ---
    story.append(Paragraph("5. DATABASE SCHEMAS & STORAGE ARCHITECTURE", style_h1))
    story.append(HRFlowable(width="100%", thickness=1, color=GOLD, spaceAfter=6, spaceBefore=1))

    schema_text = """• User Schema (User.js):
  - name, email (unique), password (bcrypt hash, 12 rounds), role (super_admin, station_admin, officer, etc.)
  - station, department, formNumber/badgeId (unique, indexed), phone, isActive, lastLogin

• Case Schema (Case.js):
  - caseId (unique: CASE-YYYY-XXXXX), title, description, crimeType (enum), status, priority
  - suspects [{name, age, gender, description}], victims [{name, age, gender}]
  - assignedOfficers [ObjectId -> User], station, courtName, judge, sharedWith [{station, accessLevel}]
  - createdBy [ObjectId -> User], timestamps (createdAt, updatedAt)

• Document Schema (Document.js):
  - docId (unique: DOC-YYYY-XXXXX), title, docType (fir, charge_sheet, evidence, forensic_report, etc.)
  - case [ObjectId -> Case], filePath (encrypted .enc path), originalName, mimeType, fileSize
  - isEncrypted (Boolean), uploadedBy [ObjectId -> User], tags [String], ocrText, accessRestriction

• AuditLog Schema (AuditLog.js):
  - user [ObjectId -> User], action (view, download, upload, edit, delete, login, share)
  - resourceType (document, case, user, system), resourceId, details, ipAddress, userAgent, timestamp

• RegisteredID Schema (RegisteredID.js):
  - formNumber (unique, indexed), name, email, role, station, department, phone
  - idCardImage (.enc path), faceDescriptor ([128 Numbers]), addedBy [ObjectId -> User], isActive"""

    schema_data = [[Paragraph(f"<pre>{schema_text}</pre>", style_code)]]
    schema_table = Table(schema_data, colWidths=[504])
    schema_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), LIGHT_BG),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(schema_table)
    story.append(Spacer(1, 8))

    # --- SECTION 6 ---
    story.append(Paragraph("6. STATUTORY & REGULATORY COMPLIANCE", style_h1))
    story.append(HRFlowable(width="100%", thickness=1, color=GOLD, spaceAfter=6, spaceBefore=1))

    c1 = "<b>1. Section 65B, Indian Evidence Act (1872):</b> Produces certified computer-generated evidence audit trails recording originating IP, officer credentials, and exact microsecond timestamps required for court admissibility."
    c2 = "<b>2. Information Technology Act (2000):</b> Encrypted storage and RBAC controls comply with Section 43A (compensation for failure to protect sensitive data) and Section 69A."
    c3 = "<b>3. ISO/IEC 27001 Information Security:</b> Implements strict role-based access, cryptographic key management, and zero-plaintext storage architecture."
    c4 = "<b>4. CCTNS Interoperability:</b> Standardized crime classification schemas allow direct integration with national Crime and Criminal Tracking Network & Systems."

    for c in [c1, c2, c3, c4]:
        story.append(Paragraph(f"• {c}", style_body))

    # Build PDF
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[SUCCESS] PDF Document created at: {filename}")
    return filename

if __name__ == "__main__":
    create_pdf()
