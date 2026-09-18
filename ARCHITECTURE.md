# 🏛️ PRATIBANDH — Complete System Architecture & Technical Specifications

> **System Name:** PRATIBANDH (Secure Digital Document Management & Investigation Vault)  
> **Problem Statement:** SIH 1690 — Centralized, Encrypted & Forensic-Tracked Legal & Investigation Repository  
> **Statutory Compliance:** Section 65B Indian Evidence Act 1872, Information Technology Act 2000, ISO/IEC 27001, CCTNS Interoperability  
> **Version:** 2.4.0 (Gov-Build)

---

## 📑 Table of Contents
1. [Executive Summary & Core Objectives](#1-executive-summary--core-objectives)
2. [High-Level Architecture Diagram](#2-high-level-architecture-diagram)
3. [Technology Stack Breakdown](#3-technology-stack-breakdown)
4. [Bit-by-Bit Component & Module Specifications](#4-bit-by-bit-component--module-specifications)
   - [4.1 Frontend Presentation Layer (Client)](#41-frontend-presentation-layer-client)
   - [4.2 Backend Application Layer (Server)](#42-backend-application-layer-server)
   - [4.3 Security & Cryptographic Subsystem](#43-security--cryptographic-subsystem)
   - [4.4 AI, OCR & Biometric Computer Vision Pipeline](#44-ai-ocr--biometric-computer-vision-pipeline)
   - [4.5 Database Schemas & Storage Layer](#45-database-schemas--storage-layer)
   - [4.6 Real-Time Communication Layer](#46-real-time-communication-layer)
5. [End-to-End Data Flow & Operational Pipelines](#5-end-to-end-data-flow--operational-pipelines)
6. [Why Each Technology & Design Pattern Was Chosen](#6-why-each-technology--design-pattern-was-chosen)

---

## 1. Executive Summary & Core Objectives

PRATIBANDH is an enterprise-grade digital evidence and case document repository engineered for police departments, investigative agencies, judicial courts, and forensic laboratories.

### Core Problems Solved:
1. **Evidence Leakage & Unauthorized Screen Captures:** Traditional web-based viewers render DOM text that can be easily inspected, copied, or captured in full via high-resolution screenshots.
2. **Untraceable Breaches:** Lack of granular forensic stamping on viewed assets leaves investigators unable to identify the source of leaked photographs or documents.
3. **Evidence Tampering & Broken Chain of Custody:** Documents stored in plaintext or unencrypted storage are vulnerable to unauthorized modification or deletion without an immutable audit trail.
4. **Inter-Jurisdictional Silos:** Inefficient inter-station document sharing creates friction in multi-state and multi-station investigations.

---

## 2. High-Level Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                           CLIENT TIER (React 18 + Vite)                           |
|                                                                                   |
|  +---------------------+  +-------------------------+  +-----------------------+  |
|  |   Government UI     |  |   AI OCR Engine         |  |  Canvas Engine        |  |
|  | - GovHeader (IST)   |  | - Tesseract.js (Wasm)   |  | - Anti-Screenshot     |  |
|  | - GovFooter         |  | - Image Preprocessing   |  | - Spotlight Masking   |  |
|  | - FloatingActions   |  | - RegEx Typo Correction |  | - Forensic Watermark  |  |
|  | - RBAC Sidebar/Nav  |  | - Form/Badge Matching   |  | - Dual-Canvas Render  |  |
|  +---------------------+  +-------------------------+  +-----------------------+  |
|                                     |                                             |
+-------------------------------------|---------------------------------------------+
                                      | HTTPS (Axios) / WSS (Socket.IO)
+-------------------------------------v---------------------------------------------+
|                        APPLICATION SERVER (Node.js + Express)                     |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | Middleware Pipeline: Helmet | CORS | Morgan | BodyParser | Multer           |  |
|  | JWT Authentication (auth.js) & Role-Based Access Control (roleCheck.js)      |  |
|  | Immutable Audit Interceptor (auditLogger.js)                                |  |
|  +-----------------------------------------------------------------------------+  |
|                                                                                   |
|  +--------------------+ +-------------------+ +-------------------+ +----------+  |
|  | Auth & ID Registry | | Cases Controller  | | Docs & Encryption | | Collab   |  |
|  | - /api/auth        | | - /api/cases      | | - /api/documents  | | - /api/  |  |
|  | - /api/registered- | | - Search & Filter | | - AES-256-CBC     | |   collab |  |
|  |   ids              | | - Crime Analytics | | - Upload/Download | | - Share  |  |
|  +--------------------+ +-------------------+ +-------------------+ +----------+  |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | Audit & Analytics Engine: /api/audit (Times Opened, Aggregates, CSV Export)|  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
                                      |
         +----------------------------+----------------------------+
         |                                                         |
+--------v--------------------------------+       +----------------v----------------+
|          DATABASE (MongoDB Atlas)       |       |   ENCRYPTED STORAGE (Disk)      |
|  - Users Collection                     |       |  - server/uploads/*.pdf.enc     |
|  - Cases Collection                     |       |  - server/uploads/idcards/*.enc |
|  - Documents Collection                 |       |  - AES-256 Encrypted Binaries   |
|  - AuditLogs Collection                 |       |  - IV Prepend Buffer            |
|  - RegisteredIDs Collection             |       +---------------------------------+
+-----------------------------------------+
```

---

## 3. Technology Stack Breakdown

| Layer / Component | Technology Used | Version | Purpose in System |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React.js | 18.2.0 | Reactive component architecture, virtual DOM for performant UI state |
| **Frontend Build Tool** | Vite | 5.1.4 | Lightning-fast HMR, ES module bundling, optimized production builds |
| **CSS & Design System** | TailwindCSS | 3.4.1 | Utility-first responsive design, custom Indian Government theme palette |
| **Client-Side Routing** | React Router DOM | 6.22.1 | Declarative client-side routing, protected and role-restricted routes |
| **HTTP Client** | Axios | 1.6.7 | Interceptor-based API communication, automated JWT Bearer header injection |
| **Toast Notifications**| React Hot Toast | 2.4.1 | Lightweight, accessible status and alert toasts |
| **Icons & Insignia** | React Icons | 5.0.1 | Standard Feather (`fi`), FontAwesome (`fa`), and BoxIcons (`bi`) sets |
| **Client OCR Engine** | Tesseract.js | 5.1.0 | Pure WebAssembly optical character recognition on physical ID cards |
| **Backend Runtime** | Node.js | v18+ | Event-driven, asynchronous server execution runtime |
| **Backend Framework** | Express.js | 4.18.2 | REST API endpoints, routing, middleware orchestration |
| **Database & ODM** | MongoDB + Mongoose | 8.0.3 | Document-oriented NoSQL storage, schema validation, indexing, virtuals |
| **Security Headers** | Helmet | 7.1.0 | HTTP security headers (CSP, HSTS, frameguard, XSS filter) |
| **Cross-Origin Control**| CORS | 2.8.5 | Cross-Origin Resource Sharing control for safe multi-client access |
| **File Multipart Engine**| Multer | 1.4.5-lts.1 | Streaming file upload handling with disk storage and type filters |
| **Password Hashing** | BcryptJS | 2.4.3 | Adaptive one-way hashing with salt generation (12 rounds) |
| **Token Authentication**| JSON Web Token | 9.0.2 | Stateless HMAC SHA-256 bearer tokens with 24-hour expiration |
| **Data Encryption** | Node.js Crypto | Native | AES-256-CBC symmetric cipher for physical files and metadata |
| **Real-time Engine** | Socket.IO | 4.7.2 | WebSockets for live notifications, cross-station room collaboration |
| **Dev Tooling** | Nodemon | 3.0.2 | Hot-reloading development server |

---

## 4. Bit-by-Bit Component & Module Specifications

### 4.1 Frontend Presentation Layer (`client/src`)

#### A. Core Application & State Management
- **`App.jsx`**: Main routing tree. Configures `ProtectedRoute` with strict RBAC checking (`super_admin`, `station_admin`, `officer`, etc.) and mounts global toast notifications.
- **`context/AuthContext.jsx`**: Centralized authentication context provider. Manages token persistence in `localStorage`, user state, automated profile loading (`/api/auth/me`), login, logout, and AI ID Card login dispatcher.
- **`utils/api.js`**: Axios instance configured with base URL `/api` and an automatic request interceptor that injects `Authorization: Bearer <token>` into every outgoing HTTP request.

#### B. Government Portal Frame & Common Components
- **`components/Common/GovHeader.jsx`**:
  - *Functionality:* Displays the National Tricolor Ribbon, Ashoka Lion Emblem, Ministry of Home Affairs insignia, "RESTRICTED LAW ENFORCEMENT VAULT" classification tag, real-time live clock synchronized to Indian Standard Time (IST), and quick links to GitHub.
  - *Why Used:* Enforces statutory credibility and standard government design compliance.
- **`components/Common/GovFooter.jsx`**:
  - *Functionality:* Displays legal disclaimers (Section 65B Indian Evidence Act 1872, IT Act 2000, ISO/IEC 27001, CCTNS), national portal links (india.gov.in, cybercrime.gov.in, digitalindia.gov.in, nic.in), and GitHub repository source pointers.
  - *Why Used:* Provides mandatory legal references and institutional transparency.
- **`components/Common/FloatingActions.jsx`**:
  - *Functionality:* Floating speed-dial widget in the bottom-right corner offering instant access to: Scroll to Top, GitHub Repository, Audit Trail & Charts, AI ID Card Scanner, Evidence Document Upload, New Case Creation, and National Helpline modal (1930 Cyber Crime helpline).
  - *Why Used:* Enhances investigator workflow efficiency during critical incident operations.

#### C. Authentication & AI ID Verification
- **`components/Auth/IDVerification.jsx`**:
  - *Functionality:* Physical ID card capture interface supporting live webcams and photo uploads. Employs image preprocessing, OCR extraction of Form Numbers/Registration Numbers and Officer Names. Matches scanned details against pre-seeded officer bio-data in the database and computes a confidence score before issuing an authentication token.
  - *Why Used:* Eliminates credential sharing and password theft by requiring visual, verifiable physical departmental ID verification.
- **`components/Auth/Login.jsx`**:
  - *Functionality:* Fallback credential authentication using Form Number/Email and password with automatic registration sync.
  - *Why Used:* Allows secondary access when camera hardware is unavailable or during terminal maintenance.

#### D. Anti-Screenshot Document Viewer & Forensic Engine
- **`components/Documents/DocumentViewer.jsx`**:
  - *Functionality:*
    1. **Offscreen Canvas Rendering:** Generates the sharp document text and classification headers on a virtual memory canvas.
    2. **Spotlight Masking:** The primary displayed canvas renders a heavily blurred (10px Gaussian blur) version. Only a circular area (radius: 130px) following the officer's cursor is rendered sharp using 2D clipping paths.
    3. **Forensic Watermarking:** Repeated, rotated (-25°) watermarks bearing `CONFIDENTIAL • OFFICER NAME • FORM NO • ISO TIMESTAMP` are baked directly into the canvas pixels.
    4. **Hardware Capture Deterrents:** Disables right-click context menus, intercepts `Ctrl+P`, `Ctrl+S`, `Ctrl+U`, and `PrintScreen` key shortcuts.
    5. **Granular Deletion Control:** Allows only the original uploader or a `super_admin` to permanently delete the document with confirmation modals.
  - *Why Used:* Prevents full-page digital screenshot extraction and makes smartphone photography instantly traceable to the leaking terminal.

#### E. Audit Trail & Analytics
- **`components/AuditTrail/AuditLog.jsx`**:
  - *Functionality:*
    1. **Interactive Activity Bar Chart:** Visualizes access distributions across officers, ranking them by "Times Opened / Accessed", "Doc Views", "Downloads", "Logins", and "Modifications". Features multi-colored segmented progress bars showing proportional behavior.
    2. **Tamper-Evident Record Table:** Tabular listing of each audit event displaying IST timestamps, officer name, Form Number, action badge, target resource, details, and client IP.
    3. **Export Engine:** One-click generation and download of statutory CSV audit reports and browser print formatting.
  - *Why Used:* Fulfills Section 65B Indian Evidence Act admissibility requirements by maintaining an unbroken digital chain of custody.

#### F. Case Management & Collaboration
- **`components/Cases/CaseList.jsx`, `CaseCreate.jsx`, `CaseDetail.jsx`**:
  - *Functionality:* Full lifecycle case file management with auto-generated case IDs (`CASE-YYYY-XXXXX`), crime category tagging (*Murder, Rape, Theft, Cybercrime, Fraud, Kidnapping, etc.*), suspect/victim demographic profiling, priority grading, and status tracking (*Open, Under Investigation, Charge Sheeted, Closed*).
  - *Why Used:* Organizes complex criminal investigations with structured metadata and fast retrieval.
- **`components/Collaboration/SharedCases.jsx`**:
  - *Functionality:* Multi-station request-and-approval workflow for inter-jurisdictional evidence sharing (*Shared With Us* / *Shared By Us*).
  - *Why Used:* Enables seamless inter-agency collaboration while preserving strict access boundaries.

#### G. Admin Personnel Management
- **`components/Admin/ManagePersonnel.jsx`**:
  - *Functionality:* Super Admin dashboard for registering authorized personnel, uploading official physical ID cards, enrolling credentials, setting roles, and activating/deactivating officer accounts.
  - *Why Used:* Centralizes access governance and credentials management.

---

### 4.2 Backend Application Layer (`server/`)

#### A. Server Initialization & Middleware Pipeline (`server.js`)
- **Express App & HTTP Server**: Sets up REST routes and binds HTTP server with Socket.IO.
- **`helmet()`**: Sets secure HTTP response headers to defend against clickjacking, MIME-sniffing, and injection attacks.
- **`cors()`**: Enables secure cross-origin communication between client and server.
- **`morgan('dev')`**: Outputs structured HTTP request logs to stdout for backend observability.
- **`express.json({ extended: true })`**: Parses JSON payloads for API requests.

#### B. Middleware Modules
- **`middleware/auth.js`**:
  - *Functionality:* Extracts JWT from the `Authorization: Bearer <token>` header, decodes the user ID, loads the user document from MongoDB, and attaches it to `req.user`.
  - *Why Used:* Secures private API endpoints against unauthenticated access.
- **`middleware/roleCheck.js`**:
  - *Functionality:* Takes an array of permitted roles (e.g. `['super_admin', 'station_admin']`) and blocks requests from users lacking sufficient privileges with a `403 Forbidden` response.
  - *Why Used:* Enforces Role-Based Access Control across sensitive operations.
- **`middleware/auditLogger.js`**:
  - *Functionality:* Provides the `logAction(userId, action, resourceType, resourceId, details, req)` helper. Captures user identity, client IP address (supporting proxy forwarding), user-agent, action type, and timestamp, immediately creating an immutable document in the `AuditLog` collection.
  - *Why Used:* Guarantees automated, transparent record-keeping across all CRUD and access operations.

#### C. Backend Routes & Controllers
- **`routes/auth.js`**:
  - `POST /api/auth/match-id-card`: AI ID Card OCR text matching & bio-data validation.
  - `POST /api/auth/id-card-login`: Verified ID card scan login and token issuance.
  - `POST /api/auth/login`: Form Number / Email + Password login.
  - `POST /api/auth/register`: Admin-restricted personnel account creation.
  - `GET /api/auth/me` & `PUT /api/auth/me`: Profile retrieval and metadata updates.
- **`routes/registeredIds.js`**:
  - `GET /api/registered-ids/verify/:formNumber`: Public form number validation endpoint.
  - `POST /api/registered-ids/seed-samples`: Sample ID sync endpoint.
  - `GET /api/registered-ids/sample-status`: Check registered personnel count.
  - `POST /api/registered-ids`: Register new officer with encrypted ID card (Admin only).
  - `GET /api/registered-ids`, `GET /:id`, `PUT /:id`, `DELETE /:id`: Admin CRUD endpoints.
- **`routes/cases.js`**:
  - `GET /api/cases`: Filtered case query (by crime type, status, station, dates) with pagination.
  - `POST /api/cases`: Create new investigation case.
  - `GET /api/cases/:id`: Detailed case view with populated officer and sharing references.
  - `PUT /api/cases/:id`: Update case status, evidence, or suspect profiles.
  - `DELETE /api/cases/:id`: Creator/Admin deletion with cascading cleanup of linked encrypted files.
  - `GET /api/cases/by-crime-type`: MongoDB aggregation pipeline grouping cases by crime category.
  - `POST /api/cases/:id/share`: Grant access to another station.
- **`routes/documents.js`**:
  - `POST /api/documents/upload`: Multer file upload, AES-256 file encryption, and metadata storage.
  - `GET /api/documents`: List documents with filters and pagination.
  - `GET /api/documents/:id`: Document metadata retrieval with view logging.
  - `GET /api/documents/:id/download`: On-the-fly decryption to a temporary buffer, streamed download, and auto-cleanup.
  - `DELETE /api/documents/:id`: Uploader/Admin restricted deletion of disk files and database records.
  - `GET /api/documents/search`: Full-text search across document titles and OCR text.
- **`routes/audit.js`**:
  - `GET /api/audit`: Filtered audit logs with date-range, user, and action filters (Admin only).
  - `GET /api/audit/recent`: Recent 10 audit logs for dashboard activity feed.
  - `GET /api/audit/user-stats`: MongoDB aggregation pipeline computing total actions, times opened, views, downloads, logins, and edits grouped per officer.
  - `GET /api/audit/user/:userId`: User-specific audit history.
  - `GET /api/audit/document/:docId`: Document-specific chain-of-custody history.
  - `DELETE /api/audit/reset`: Admin-only reset and permanent purge of all historical audit trail entries.
- **`routes/collaboration.js`**:
  - `GET /api/collaboration/shared-with-us`: Cases shared with current station.
  - `GET /api/collaboration/shared-by-us`: Cases shared by current station to external nodes.
  - `POST /api/collaboration/requests`: Dispatch inter-station sharing request.
  - `PATCH /api/collaboration/requests/:id`: Approve/reject access requests.
- **`routes/dashboard.js`**:
  - `GET /api/dashboard/stats`: Returns count of total cases, open cases, encrypted documents, and pending reviews.
- **`routes/search.js`**:
  - `GET /api/search`: Unified full-text search across cases and documents.

---

### 4.3 Security & Cryptographic Subsystem

#### A. AES-256-CBC File & Text Encryption (`server/utils/encryption.js`)
- **Algorithm:** `aes-256-cbc`
- **Key Size:** 256 bits (32 bytes derived from `process.env.ENCRYPTION_KEY`)
- **Initialization Vector (IV):** 16 cryptographically secure random bytes generated per file via `crypto.randomBytes(16)`.
- **Storage Strategy:** The 16-byte random IV is prepended to the ciphertext buffer: `[ 16 bytes IV ][ Encrypted File Payload ]`.
- **Decryption Workflow:** During authorized file download or access, the 16-byte IV is sliced from the header, a decipher stream is instantiated, and decrypted bytes are written to a temporary ephemeral file that is unlinked immediately after stream transmission.

#### B. Password Cryptography & Token Security
- **Hashing:** `bcryptjs` with 12 salt rounds protects all stored passwords against dictionary and rainbow table attacks.
- **Tokens:** JSON Web Tokens (JWT) signed with a secret key containing only the immutable MongoDB ObjectId and expiring in 24 hours.

---

### 4.4 AI & OCR Vision Pipeline

#### A. Optical Character Recognition (OCR) Engine (`client/src/utils/ocr.js`)
- **Library:** `tesseract.js` (WebAssembly port of Google's Tesseract OCR engine).
- **AI Preprocessing (`preprocessImageForOCR`):**
  1. Upscales input frame to a minimum of 1200px width.
  2. Applies luminosity grayscale conversion: $Y = 0.299R + 0.587G + 0.114B$.
  3. Applies 30% dynamic contrast stretching to maximize contrast between text and background patterns.
- **OCR Typo Normalization & Regex (`extractFormNumber`):** Employs multi-tier regex matching and character normalization ($O \to 0$, $I/l/| \to 1$, $S \to 5$, $B \to 8$, $Z \to 2$) to recover registration numbers and names from noisy camera frames.

---

### 4.5 Database Schemas & Storage Layer (`server/models/`)

#### A. User Model (`models/User.js`)
- `name` (String, required)
- `email` (String, required, unique)
- `password` (String, hashed via bcrypt)
- `role` (Enum: `super_admin`, `station_admin`, `officer`, `court_official`, `forensic_expert`, `viewer`)
- `station` (String — e.g. "OUTR Bhubaneswar")
- `formNumber` / `badgeId` (String, unique, indexed)
- `department` (String)
- `phone` (String)
- `isActive` (Boolean, default: true)
- `lastLogin` (Date)

#### B. Case Model (`models/Case.js`)
- `caseId` (String, unique, format: `CASE-YYYY-XXXXX`)
- `title` (String, required, indexed)
- `description` (String, indexed)
- `crimeType` (Enum: `murder`, `rape`, `theft`, `cybercrime`, `fraud`, `kidnapping`, `assault`, `drug_trafficking`, `corruption`, `other`)
- `status` (Enum: `open`, `under_investigation`, `charge_sheeted`, `closed`, `reopened`)
- `priority` (Enum: `low`, `medium`, `high`, `critical`)
- `suspects` (Array of `{ name, age, gender, description }`)
- `victims` (Array of `{ name, age, gender }`)
- `assignedOfficers` (Array of ObjectId references to `User`)
- `station` (String)
- `courtName` & `judge` (String)
- `sharedWith` (Array of `{ station, accessLevel, grantedBy, grantedAt }`)
- `createdBy` (ObjectId reference to `User`)
- `timestamps` (createdAt, updatedAt)

#### C. Document Model (`models/Document.js`)
- `docId` (String, unique, format: `DOC-YYYY-XXXXX`)
- `title` (String, required, indexed)
- `docType` (Enum: `fir`, `charge_sheet`, `evidence`, `investigation_report`, `court_filing`, `forensic_report`, `witness_statement`, `other`)
- `case` (ObjectId reference to `Case`, required)
- `filePath` (String — path to encrypted `.enc` file)
- `originalName`, `mimeType`, `fileSize` (Number)
- `isEncrypted` (Boolean, default: true)
- `uploadedBy` (ObjectId reference to `User`)
- `tags` (Array of Strings)
- `ocrText` (String, indexed for full-text search)
- `accessRestriction` (Enum: `public`, `restricted`, `confidential`, `top_secret`)

#### D. AuditLog Model (`models/AuditLog.js`)
- `user` (ObjectId reference to `User`, required, indexed)
- `action` (Enum: `login`, `logout`, `view`, `download`, `upload`, `edit`, `delete`, `share`, `print_attempt`, `screenshot_attempt`, `access_denied`)
- `resourceType` (Enum: `document`, `case`, `user`, `system`)
- `resourceId` (String, indexed)
- `details` (String)
- `ipAddress` (String)
- `userAgent` (String)
- `timestamp` (Date, default: `Date.now`, indexed)

#### E. RegisteredID Model (`models/RegisteredID.js`)
- `formNumber` (String, required, unique, indexed)
- `name` (String, required)
- `email` (String, required, unique)
- `role` (Enum)
- `station` & `department` (String)
- `phone` (String)
- `idCardImage` (String — path to encrypted stored photo)
- `addedBy` (ObjectId reference to `User`)
- `isActive` (Boolean)

---

### 4.6 Real-Time Communication Layer

- **Socket.IO Integration (`server.js`):**
  - Handles WebSocket connections for instant inter-station alerts.
  - Client sockets join station rooms via `socket.join(stationName)`.
  - When a collaboration request or case update occurs, server routes emit events directly to connected station rooms without requiring polling.

---

## 5. End-to-End Data Flow & Operational Pipelines

### Pipeline 1: AI ID Card Scan & OCR Login Flow
```
[User presents Physical ID to Camera]
               │
               ▼
[Image Captured & Processed on Canvas (Grayscale & Contrast Boost)]
               │
               ▼
       [Tesseract.js OCR Engine]
    (Extracts Form No / Badge ID / Officer Name)
               │
               ▼
       [POST /api/auth/match-id-card]
               │
               ▼
[Backend matches against RegisteredID Database]
 (Exact Form No -> Typo Corrected -> Name Token Match)
               │
               ▼
     [Success: Match Score Computed (≥95%)]
               │
               ▼
      [POST /api/auth/id-card-login]
               │
               ▼
 [AuditLog Generated: Action = "login"]
               │
               ▼
[JWT Token Issued -> AuthContext -> Dashboard Entry]
```

---

### Pipeline 2: Encrypted Document Upload Flow
```
[Officer selects PDF/Image + Metadata in DocumentUpload.jsx]
               │
               ▼
[FormData multipart transmitted via POST /api/documents/upload]
               │
               ▼
[Multer buffers file to server/uploads/ directory]
               │
               ▼
[encryption.js reads buffer, generates 16-byte random IV, applies AES-256-CBC]
               │
               ▼
[Encrypted ciphertext with IV prepended saved to server/uploads/*.pdf.enc]
               │
               ▼
[Original unencrypted temporary upload deleted via fs.unlinkSync]
               │
               ▼
[Document record created in MongoDB with filePath pointing to .enc]
               │
               ▼
[AuditLog entry created: Action = "upload", Resource = "document"]
```

---

### Pipeline 3: Anti-Screenshot Spotlight Viewing Flow
```
[Officer clicks "View Document" -> Navigates to /documents/:id/view]
               │
               ▼
[GET /api/documents/:id -> Returns metadata + Logs Audit Event: Action = "view"]
               │
               ▼
[DocumentViewer initializes Canvas & Offscreen Canvas]
               │
               ▼
[Offscreen Canvas renders sharp text, government seals, and metadata]
               │
               ▼
[Main Canvas draws blurred version (10px Gaussian blur)]
               │
               ▼
[Officer moves cursor -> Mouse position (X, Y) captured]
               │
               ▼
[Main Canvas clips 130px radius circle at (X, Y) -> Renders sharp offscreen canvas inside]
               │
               ▼
[Rotated forensic watermark baked into canvas pixels with Officer Name, Form No, and IST Timestamp]
               │
               ▼
[Keyboard hooks block PrintScreen, Ctrl+P, Ctrl+S, and context menu]
```

---

## 6. Why Each Technology & Design Pattern Was Chosen

| Technology / Design Decision | Why Chosen Over Alternatives |
| :--- | :--- |
| **HTML5 Canvas over HTML DOM Document Rendering** | Standard DOM text can be inspected, copied, selected, or screenshotted in full with browser developer tools. Canvas renders direct rasterized pixels, preventing DOM inspection and allowing programmatic blur and spotlight masking. |
| **Dual-Canvas Spotlight Rendering** | Limits visible area to a 130px circle around the cursor. Prevents full-page photographic capture via cameras or external screen recorders while remaining readable for the officer. |
| **Dynamic Forensic Pixel Watermarking** | Stamping officer credentials and microsecond timestamps into canvas pixels ensures that even if a photo is captured using a smartphone, the exact leaking terminal and personnel can be traced instantly. |
| **AES-256-CBC with Random Per-File IV** | Industry-standard symmetric cipher recognized by military and government intelligence standards. The random 16-byte IV ensures that two identical documents yield completely different encrypted ciphertexts. |
| **Client-Side WASM OCR Engine** | Running Tesseract.js in WebAssembly on the client browser eliminates server CPU bottlenecks, protects privacy, and provides instantaneous character recognition from video and photo frames. |
| **MongoDB Aggregation Pipelines for Audit Analytics** | Multi-stage aggregation pipelines (`$lookup`, `$unwind`, `$group`, `$sort`) compute real-time statistics (times opened, view counts, edit counts per officer) directly in the database engine with maximum performance. |
| **Statutory 65B Indian Evidence Act Compliance** | Maintains an unalterable chain of custody with IP addresses, timestamps, user IDs, and action categories to ensure digital evidence is admissible in court. |

---

*Authored by the PRATIBANDH Engineering Team • Ministry of Home Affairs Digital Evidence Initiative*
