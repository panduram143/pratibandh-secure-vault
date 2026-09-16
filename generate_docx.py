import os
import sys
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, hex_color):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'''
        <w:tcMar {nsdecls("w")}>
            <w:top w:w="{top}" w:type="dxa"/>
            <w:bottom w:w="{bottom}" w:type="dxa"/>
            <w:left w:w="{left}" w:type="dxa"/>
            <w:right w:w="{right}" w:type="dxa"/>
        </w:tcMar>
    ''')
    tcPr.append(tcMar)

def create_docx(filename="PRATIBANDH_System_Architecture_and_Specifications.docx"):
    doc = Document()

    # Set page margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)

    # Color Palette Constants
    NAVY_HEX = "0A1B38"
    GOLD_HEX = "D4AF37"
    LIGHT_BG = "F1F5F9"
    BORDER_HEX = "CBD5E1"
    NAVY_RGB = RGBColor(10, 27, 56)
    GOLD_RGB = RGBColor(212, 175, 55)
    GRAY_RGB = RGBColor(100, 116, 139)
    DARK_RGB = RGBColor(30, 41, 59)

    # Title / Header Block
    title_p = doc.add_paragraph()
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_emblem = title_p.add_run("GOVERNMENT OF INDIA • MINISTRY OF HOME AFFAIRS\n")
    run_emblem.font.name = "Arial"
    run_emblem.font.size = Pt(10)
    run_emblem.font.bold = True
    run_emblem.font.color.rgb = GOLD_RGB

    run_title = title_p.add_run("PRATIBANDH: SECURE DIGITAL DOCUMENT & EVIDENCE MANAGEMENT SYSTEM\n")
    run_title.font.name = "Arial Black"
    run_title.font.size = Pt(17)
    run_title.font.bold = True
    run_title.font.color.rgb = NAVY_RGB

    run_subtitle = title_p.add_run("Comprehensive System Architecture, Technical Specifications & Component Directory\n")
    run_subtitle.font.name = "Arial"
    run_subtitle.font.size = Pt(11)
    run_subtitle.font.italic = True
    run_subtitle.font.color.rgb = GRAY_RGB

    # Meta banner box
    banner_table = doc.add_table(rows=1, cols=1)
    banner_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    banner_cell = banner_table.rows[0].cells[0]
    set_cell_background(banner_cell, "0A1B38")
    set_cell_margins(banner_cell, top=140, bottom=140, left=200, right=200)

    bp = banner_cell.paragraphs[0]
    bp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    brun = bp.add_run("STATUTORY EVIDENCE VAULT // SEC 65B INDIAN EVIDENCE ACT & IT ACT 2000 COMPLIANT\nProblem Statement: SIH 1690 | Centralized, Encrypted & Forensic-Tracked Repository | Version: 2.4.0")
    brun.font.name = "Arial"
    brun.font.size = Pt(9.5)
    brun.font.bold = True
    brun.font.color.rgb = RGBColor(255, 255, 255)

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # Helper function for Section Headings
    def add_section_heading(title_text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(16)
        h.paragraph_format.space_after = Pt(4)
        run = h.add_run(title_text)
        run.font.name = "Arial Black"
        run.font.size = Pt(13)
        run.font.color.rgb = NAVY_RGB
        # Add decorative line
        p_line = doc.add_paragraph()
        p_line.paragraph_format.space_after = Pt(6)
        r_line = p_line.add_run("―" * 55)
        r_line.font.color.rgb = GOLD_RGB
        r_line.font.size = Pt(8)

    def add_sub_heading(title_text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(10)
        h.paragraph_format.space_after = Pt(3)
        run = h.add_run(title_text)
        run.font.name = "Arial"
        run.font.size = Pt(11)
        run.font.bold = True
        run.font.color.rgb = NAVY_RGB

    def add_body_paragraph(text, bold_prefix=None, italic=False):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_bold = p.add_run(bold_prefix)
            r_bold.font.name = "Arial"
            r_bold.font.size = Pt(9.5)
            r_bold.font.bold = True
            r_bold.font.color.rgb = DARK_RGB
        r_text = p.add_run(text)
        r_text.font.name = "Arial"
        r_text.font.size = Pt(9.5)
        r_text.font.italic = italic
        r_text.font.color.rgb = DARK_RGB
        return p

    def add_bullet(text, bold_prefix=None):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_bold = p.add_run(bold_prefix)
            r_bold.font.name = "Arial"
            r_bold.font.size = Pt(9.5)
            r_bold.font.bold = True
            r_bold.font.color.rgb = DARK_RGB
        r_text = p.add_run(text)
        r_text.font.name = "Arial"
        r_text.font.size = Pt(9.5)
        r_text.font.color.rgb = DARK_RGB

    # --- SECTION 1 ---
    add_section_heading("1. EXECUTIVE SUMMARY & PURPOSE")
    add_body_paragraph("PRATIBANDH is a mission-critical digital evidence repository and case management system architected for police departments, investigative agencies, judicial bodies, and forensic analysis laboratories. The solution directly addresses Problem Statement 1690 (SIH) by neutralizing the core vulnerabilities of evidence leakage, unauthorized photographic capture, insider tampering, and jurisdictional silos.")

    add_body_paragraph("The system is engineered upon four foundational technical pillars:", bold_prefix="Core Security Pillars: ")
    add_bullet(" Dual-canvas rendering engine displaying documents behind a dynamic 10px Gaussian blur. Only a 130px radius aperture around the user cursor is unmasked sharp, defeating full-page photographic capture.", bold_prefix="1. Anti-Screenshot Spotlight Masking:")
    add_bullet(" User credentials (Officer Name, Form/Badge ID, Client IP, and ISO Timestamp) are repeatedly baked directly into canvas pixels at a -25° rotation, rendering any captured snippet immediately traceable.", bold_prefix="2. Dynamic Forensic Pixel Watermarking:")
    add_bullet(" Client-side WebAssembly Optical Character Recognition (Tesseract.js) combined with 128-dimensional facial biometric embedding extraction (@vladmandic/face-api) for tamper-proof officer login.", bold_prefix="3. AI-Powered ID Card & Facial Biometrics:")
    add_bullet(" AES-256-CBC envelope encryption for all stored files, SHA-256 integrity logs, and an unalterable audit ledger in compliance with Section 65B of the Indian Evidence Act.", bold_prefix="4. End-to-End Cryptography & Audit Ledger:")

    # --- SECTION 2 ---
    add_section_heading("2. SYSTEM ARCHITECTURE & DATA FLOW")
    add_body_paragraph("PRATIBANDH follows a modular, 3-tier distributed client-server architecture with an asynchronous event bus and an isolated cryptographic storage layer:")

    arch_box = doc.add_table(rows=1, cols=1)
    arch_box.alignment = WD_TABLE_ALIGNMENT.CENTER
    acell = arch_box.rows[0].cells[0]
    set_cell_background(acell, LIGHT_BG)
    set_cell_margins(acell, top=120, bottom=120, left=150, right=150)
    ap = acell.paragraphs[0]
    arun = ap.add_run("""[ CLIENT TIER : React 18 + Vite SPA ]
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
   - AuditLogs (Indexed Ledger)     - Ephemeral Decryption Buffer Pipeline""")
    arun.font.name = "Consolas"
    arun.font.size = Pt(8)
    arun.font.color.rgb = NAVY_RGB

    # --- SECTION 3 ---
    add_section_heading("3. BIT-BY-BIT TECHNOLOGY STACK & SPECIFICATIONS")
    add_body_paragraph("Every single library, engine, and protocol in PRATIBANDH has been deliberately chosen for performance, security, and statutory compliance:")

    # Technology Table
    table = doc.add_table(rows=1, cols=4)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = ["Component / Layer", "Technology", "Role & Functionality", "Why It Was Chosen"]
    hdr_cells = table.rows[0].cells
    for i, h in enumerate(headers):
        hdr_cells[i].text = h
        set_cell_background(hdr_cells[i], NAVY_HEX)
        set_cell_margins(hdr_cells[i], top=100, bottom=100, left=100, right=100)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.font.name = "Arial"
            r.font.size = Pt(9)
            r.font.bold = True
            r.font.color.rgb = RGBColor(255, 255, 255)

    tech_data = [
        ("Frontend UI", "React 18.2 + Vite 5", "Reactive component architecture, fast HMR, state-driven rendering.", "Virtual DOM allows smooth 60fps canvas cursor tracking without latency."),
        ("Styling & Theme", "TailwindCSS 3.4", "Custom Indian Gov navy (#0a1b38) & gold (#d4af37) palette, responsive grid.", "Utility classes enforce strict aesthetic consistency across all views."),
        ("AI OCR Engine", "Tesseract.js 5.1 (Wasm)", "Client-side character recognition from camera frames & photos.", "Zero server GPU load; extracts Regd/Form Nos directly inside user browser."),
        ("Facial Biometrics", "@vladmandic/face-api", "TinyFaceDetector + 68-point landmarks + 128-d descriptor extraction.", "Privacy-first biometric extraction; video streams never leave client."),
        ("Document Viewer", "HTML5 2D Canvas API", "Dual-canvas pipeline for spotlight masking & forensic pixel watermarks.", "Prevents DOM text inspection; blocks screenshot scraping completely."),
        ("Backend Framework", "Node.js + Express 4.18", "Asynchronous REST API routing, streaming endpoints, middleware pipeline.", "High-throughput non-blocking I/O for concurrent evidence downloads."),
        ("Database & ODM", "MongoDB + Mongoose 8.0", "Document storage with text indexes, virtual aliases, and aggregation pipes.", "Flexible schemas for complex crime metadata and sub-millisecond query speed."),
        ("File Encryption", "Node.js Crypto (AES-256)", "AES-256-CBC cipher with unique 16-byte IV prepended to every file.", "Military-grade file security at rest; raw bytes unreadable if drive is stolen."),
        ("Auth Cryptography", "BcryptJS + JWT 9.0", "Password hashing (12 rounds) & 24h HMAC-SHA256 signed bearer tokens.", "Protects passwords from rainbow table attacks; enables stateless RBAC."),
        ("Real-time Gateway", "Socket.IO 4.7", "WebSocket event bus with station-specific room isolation.", "Instantly pushes case collaboration and sharing alerts between stations."),
        ("HTTP Security", "Helmet 7.1 + CORS", "Applies CSP, HSTS, X-Frame-Options, and cross-origin security rules.", "Mitigates Clickjacking, Cross-Site Scripting (XSS), and MIME sniffing.")
    ]

    for item in tech_data:
        row_cells = table.add_row().cells
        for col_idx, text in enumerate(item):
            row_cells[col_idx].text = text
            set_cell_margins(row_cells[col_idx], top=80, bottom=80, left=90, right=90)
            p = row_cells[col_idx].paragraphs[0]
            for r in p.runs:
                r.font.name = "Arial"
                r.font.size = Pt(8.5)
                r.font.color.rgb = DARK_RGB

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # --- SECTION 4 ---
    add_section_heading("4. BIT-BY-BIT MODULE EXPLANATION & FUNCTIONALITY")

    add_sub_heading("4.1 Anti-Screenshot Spotlight Document Viewer (DocumentViewer.jsx)")
    add_body_paragraph("• Sharp Offscreen Canvas: Draws the official document text, government headers, classification tags, and forensic stamps onto a hidden offscreen canvas in memory.")
    add_body_paragraph("• Blurred Background Canvas: The main visible canvas draws the offscreen canvas with a 10px Gaussian blur filter applied (ctx.filter = 'blur(10px)').")
    add_body_paragraph("• Interactive Spotlight Mask: Tracks cursor coordinates (X, Y). When hovering, ctx.clip() cuts a 130px circular aperture where the sharp offscreen canvas is rendered in pristine clarity.")
    add_body_paragraph("• Pixel Watermark Stamping: Repeatedly stamps rotated (-25°) watermark strings containing the viewing officer's name, badge ID, and current timestamp into the canvas pixels.")
    add_body_paragraph("• Shortcut Interception: Keydown listener blocks Ctrl+P, Ctrl+S, Ctrl+U, PrintScreen, and the right-click context menu.")
    add_body_paragraph("Why Used: Conventional PDF readers allow full-page screenshots and DOM text copying. The spotlight engine ensures only a tiny fraction of the file is readable at any instant, making full-document scraping impossible.", italic=True)

    add_sub_heading("4.2 AI ID Card Verification & Biometric Login (IDVerification.jsx, ocr.js, faceApi.js)")
    add_body_paragraph("• Image Preprocessing (preprocessImageForOCR): Upscales camera frames to a minimum 1200px width, computes luminosity grayscale (Y = 0.299R + 0.587G + 0.114B), and applies +30% contrast stretching.")
    add_body_paragraph("• OCR & Barcode Extraction: Scans physical police/departmental ID cards using Tesseract.js and the native BarcodeDetector API (Code 128, Code 39, QR Code).")
    add_body_paragraph("• 128-d Vector Generation: TinyFaceDetector locates the officer's face; FaceRecognitionNet computes a 128-dimensional embedding vector.")
    add_body_paragraph("• Bio-Data Matcher: Backend route /api/auth/match-id-card matches the extracted registration number and name tokens against the RegisteredID database, calculating a confidence score (≥95%).")
    add_body_paragraph("Why Used: Eliminates password sharing and credential theft. Requires physical, visual departmental ID cards for authentication.", italic=True)

    add_sub_heading("4.3 Statutory Audit Trail & Activity Analytics (AuditLog.jsx, server/routes/audit.js)")
    add_body_paragraph("• Visual Activity Bar Chart: Aggregates total actions per officer and visualizes 'Times Opened', 'Doc Views', 'Downloads', 'Logins', and 'Modifications' with multi-color segmented progress bars.")
    add_body_paragraph("• Tamper-Evident Ledger: Displays chronological audit events with IST timestamps, personnel identity, action badges, target resource, details, and IP address.")
    add_body_paragraph("• Official CSV & Print Export: Exports complete tamper-evident audit history compliant with Section 65B of the Indian Evidence Act.")
    add_body_paragraph("• Aggregation Pipeline (/api/audit/user-stats): Uses MongoDB $lookup, $unwind, and $group stages to compute activity counts directly on the database engine.")
    add_body_paragraph("Why Used: Guarantees legal admissibility of digital evidence in court by proving an unbroken, verifiable chain of custody.", italic=True)

    add_sub_heading("4.4 AES-256-CBC File Encryption Pipeline (server/utils/encryption.js)")
    add_body_paragraph("• Encryption (encryptFile): Reads incoming file buffer, generates a cryptographically random 16-byte IV via crypto.randomBytes(16), encrypts with aes-256-cbc, and prepends the IV to the ciphertext.")
    add_body_paragraph("• Decryption (decryptFile): Slices the first 16 bytes (IV), creates a decipher stream, decrypts to an ephemeral file, streams it to the authorized officer, and deletes the temporary file immediately.")
    add_body_paragraph("Why Used: Ensures that if raw storage drives are breached or stolen, zero plaintext evidence is compromised.", italic=True)

    add_sub_heading("4.5 Case Management & Cross-Station Collaboration (CaseList.jsx, SharedCases.jsx)")
    add_body_paragraph("• Case Dossier Management: Auto-generates unique IDs (CASE-YYYY-XXXXX), tracks crime categories (Murder, Rape, Theft, Cybercrime, Fraud, Kidnapping, etc.), suspects, victims, priority, and assigned officers.")
    add_body_paragraph("• Cross-Station Sharing (/api/collaboration): Dispatches access requests between police stations, enabling inter-agency investigations while maintaining strict access boundaries.")
    add_body_paragraph("Why Used: Eliminates jurisdictional data silos during multi-state criminal investigations.", italic=True)

    add_sub_heading("4.6 Government Frame & Floating Action Hub (GovHeader.jsx, FloatingActions.jsx)")
    add_body_paragraph("• GovHeader: Displays National Tricolor Ribbon, Ashoka Lion Emblem, Ministry of Home Affairs branding, live Indian Standard Time (IST) clock, and classification badge.")
    add_body_paragraph("• FloatingActions: Speed-dial menu providing instant one-click access to GitHub, Audit Charts, AI Scanner, Evidence Upload, Case Creation, and the 1930 Cyber Crime Helpline.")
    add_body_paragraph("Why Used: Enforces statutory credibility and maximizes operational speed during critical incident handling.", italic=True)

    # --- SECTION 5 ---
    add_section_heading("5. DATABASE SCHEMAS & DATA STRUCTURES")

    schema_box = doc.add_table(rows=1, cols=1)
    schema_box.alignment = WD_TABLE_ALIGNMENT.CENTER
    scell = schema_box.rows[0].cells[0]
    set_cell_background(scell, LIGHT_BG)
    set_cell_margins(scell, top=100, bottom=100, left=140, right=140)
    sp = scell.paragraphs[0]
    srun = sp.add_run("""• User Schema (User.js):
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
  - idCardImage (.enc path), faceDescriptor ([128 Numbers]), addedBy [ObjectId -> User], isActive""")
    srun.font.name = "Consolas"
    srun.font.size = Pt(8)
    srun.font.color.rgb = NAVY_RGB

    # --- SECTION 6 ---
    add_section_heading("6. STATUTORY & REGULATORY COMPLIANCE")
    add_body_paragraph("1. Section 65B, Indian Evidence Act (1872): PRATIBANDH produces certified computer-generated evidence audit trails recording originating IP, officer credentials, and exact microsecond timestamps required for court admissibility.")
    add_body_paragraph("2. Information Technology Act (2000): Encrypted storage and RBAC controls comply with Section 43A (compensation for failure to protect sensitive personal data) and Section 69A.")
    add_body_paragraph("3. ISO/IEC 27001 Information Security: Implements strict role-based access, cryptographic key management, and zero-plaintext storage architecture.")
    add_body_paragraph("4. CCTNS Interoperability: Standardized crime classification schemas allow direct integration with national Crime and Criminal Tracking Network & Systems.")

    # Save document
    doc.save(filename)
    print(f"[SUCCESS] Word Document created at: {filename}")
    return filename

if __name__ == "__main__":
    create_docx()
