# 🏛️ PRATIBANDH — Master System Architecture & Technical Reference Manual

> **System Name:** PRATIBANDH (National Secure Digital Evidence Vault & Forensic Investigation Repository)  
> **Problem Statement:** SIH 1690 — Centralized, Encrypted & Forensic-Tracked Legal & Investigation Repository  
> **Statutory Compliance:** Section 65B of the Indian Evidence Act 1872, Information Technology Act 2000, ISO/IEC 27001:2022, Interoperable Criminal Justice System (ICJS), CCTNS Architecture  
> **Version:** 3.0.0 (Gov-Build Production Architecture)  
> **Classification:** RESTRICTED • LAW ENFORCEMENT & JUDICIAL FORENSIC REPOSITORY

---

## 📑 Table of Contents

1. [Executive Summary & Statutory Framework](#1-executive-summary--statutory-framework)
2. [File Extensions & Format Standards Encyclopedia](#2-file-extensions--format-standards-encyclopedia)
3. [High-Level System Architecture Diagram](#3-high-level-system-architecture-diagram)
4. [Complete Codebase Directory Tree & Inventory](#4-complete-codebase-directory-tree--inventory)
5. [Bit-by-Bit Frontend Component & Module Architecture (`client/`)](#5-bit-by-bit-frontend-component--module-architecture-client)
6. [Bit-by-Bit Backend Server & Controller Architecture (`server/`)](#6-bit-by-bit-backend-server--controller-architecture-server)
7. [Cryptographic Subsystem & Binary File Security (`.enc`)](#7-cryptographic-subsystem--binary-file-security-enc)
8. [AI-Assisted OCR Vision & Bio-Data Matching Engine](#8-ai-assisted-ocr-vision--bio-data-matching-engine)
9. [Anti-Screenshot Dual-Canvas Rendering Engine](#9-anti-screenshot-dual-canvas-rendering-engine)
10. [Audit Trail, User Activity Chart & Admin Reset Purge Safeguards](#10-audit-trail-user-activity-chart--admin-reset-purge-safeguards)
11. [Database Schemas, Indexing & Storage Layer](#11-database-schemas-indexing--storage-layer)
12. [End-to-End Operational Execution Pipelines](#12-end-to-end-operational-execution-pipelines)
13. [Technology Selection Rationales & Architectural Justifications](#13-technology-selection-rationales--architectural-justifications)

---

## 1. Executive Summary & Statutory Framework

**PRATIBANDH** is a specialized, tamper-evident digital document management repository and forensic tracking platform built for law enforcement agencies (state and central police forces), investigative bodies (CBI, NIA, CID), forensic science laboratories (FSL), and judicial court registries.

### Primary Operational Mandates:
1. **Zero Unencrypted Disk Exposure:** Digital evidence (FIRs, charge sheets, post-mortem reports, ballistics, intercepted media) is stored in encrypted binary format (`.enc`) using AES-256-CBC with dynamically generated random 16-byte Initialization Vectors (IV).
2. **Anti-Extraction Document Viewing:** Digital documents are rendered on offscreen HTML5 canvases with cursor-tracked spotlight masking and baked-in dynamic forensic watermarks (identifying the reviewing officer, station, registration number, and millisecond timestamp), defeating smartphone photography and screen captures.
3. **Statutory Chain of Custody (Section 65B Indian Evidence Act 1872):** Every view, download, modification, and login event is signed and permanently logged in an immutable, searchable audit ledger.
4. **Instant Multi-Tier Verification:** Field personnel authenticate seamlessly using local WebAssembly Optical Character Recognition (OCR) to read physical departmental ID cards and match against verified personnel records.
5. **Admin Master Reset Safeguard:** An exclusive, privileged safeguard allows authorized administrators to reset and clear historical audit ledgers under a two-step validation protocol.

---

## 2. File Extensions & Format Standards Encyclopedia

Every file format used across the PRATIBANDH ecosystem is intentionally selected for performance, type safety, security, or build optimization:

| Extension | Formal Name | What It Means & How It Operates | Role in PRATIBANDH Codebase |
| :--- | :--- | :--- | :--- |
| **`.md`** | **Markdown Document** | Plain-text formatting syntax designed to be converted to HTML. Uses human-readable conventions (`#`, `*`, `[]`, ````). | Serves as system documentation (`ARCHITECTURE.md`, `README.md`). Provides architecture guides, deployment steps, and statutory compliance references. |
| **`.jsx`** | **JavaScript XML** | A React syntax extension allowing HTML-like component templates to be written directly inside JavaScript files. Transpiled by Vite into standard `React.createElement` calls. | Powers all client-side UI components (`Dashboard.jsx`, `AuditLog.jsx`, `DocumentViewer.jsx`, `IDVerification.jsx`, `CaseDetail.jsx`, etc.). |
| **`.js`** | **JavaScript (ES/CJS)** | Standard ECMAScript code. On the server, executed in Node.js via CommonJS (`require`/`module.exports`). On the client, bundled as ES Modules (`import`/`export`). | Powers backend server logic (`server.js`, `routes/*.js`, `models/*.js`, `middleware/*.js`, `encryption.js`) and client utilities (`api.js`, `ocr.js`). |
| **`.json`** | **JavaScript Object Notation** | Lightweight data-interchange format composed of key-value pairs and arrays. Parsed natively across JavaScript and HTTP APIs. | Manages project configurations and dependencies (`package.json`, `package-lock.json`), build settings, and API request/response payloads. |
| **`.enc`** | **Encrypted Binary File** | Proprietary encrypted file format containing an AES-256-CBC ciphertext buffer prepended with a 16-byte random Initialization Vector (IV). | Applied to all uploaded evidentiary PDFs and scanned ID cards in `server/uploads/` to prevent unauthorized disk reading. |
| **`.html`** | **HyperText Markup Language** | The root document structure interpreted by web browsers to load styles, fonts, and script bundles. | `client/index.html` acts as the single-page application (SPA) entry point where Vite mounts the root React virtual DOM tree (`#root`). |
| **`.css`** | **Cascading Style Sheets** | Stylesheet language describing presentation semantics. Enhanced via PostCSS and Tailwind CSS directives (`@tailwind base`, `@tailwind components`, `@tailwind utilities`). | `client/src/index.css` defines the official Indian Government color scheme (Navy `#0b1c3d`, Ashoka Gold `#d4af37`, Tricolor Saffron/Green accents). |
| **`.gitignore`** | **Git Ignore Specification** | Plain-text configuration instructing Git version control to ignore untracked files like local secrets, environment keys, and heavy build artifacts. | Prevents staging `node_modules/`, local `.env` secrets, temporary unencrypted uploads, and production `dist/` builds. |
| **`.lock`** | **Dependency Lockfile** | Detailed manifest capturing exact dependency versions, sub-dependencies, and SHA-512 integrity hashes. | `package-lock.json` guarantees 100% deterministic builds across deployment environments without version drift. |
| **`.svg`** | **Scalable Vector Graphics** | XML-based 2D vector graphics that scale infinitely without loss of resolution. | Used for high-fidelity government crests, Ashoka Lion emblems, and UI icons. |

---

## 3. High-Level System Architecture Diagram

```
+===================================================================================================+
|                                    CLIENT PRESENTATION LAYER                                      |
|                               (React 18 • Vite 5 • TailwindCSS 3.4)                               |
|                                                                                                   |
|  +--------------------------------+  +--------------------------------+  +---------------------+  |
|  |     Government Design System   |  |        AI Vision Engine        |  |  Dual-Canvas Engine |  |
|  | - GovHeader (IST Real-Time)    |  | - Tesseract.js (WASM OCR)      |  | - Offscreen Canvas  |  |
|  | - GovFooter & 65B Disclaimers  |  | - Image Luminosity Preprocess  |  | - Spotlight Masking |  |
|  | - FloatingActions Speed-Dial   |  | - Typo-Correction RegEx Matrix |  | - Pixel Watermarks  |  |
|  | - RBAC Protected Sidebar       |  | - Form Number & Name Extraction|  | - Capture Blockers  |  |
|  +--------------------------------+  +--------------------------------+  +---------------------+  |
|                                   |                                   |                           |
|                      Axios Client | (JWT Bearer Auth)                 | WebSocket (Socket.IO)     |
+===================================|===================================|===========================+
                                    | HTTPS Rest APIs                   | Real-time Alerts
+===================================v===================================v===========================+
|                                   APPLICATION BACKEND SERVER                                      |
|                                    (Node.js 18+ • Express 4.18)                                   |
|                                                                                                   |
|  +---------------------------------------------------------------------------------------------+  |
|  | Middleware Pipeline: Helmet (CSP/HSTS) • CORS • Morgan • BodyParser • Multer Streaming       |  |
|  | Authentication (auth.js) • RBAC Gatekeeper (roleCheck.js) • Audit Interceptor (auditLogger)  |  |
|  +---------------------------------------------------------------------------------------------+  |
|                                                                                                   |
|  +-----------------------+ +----------------------+ +---------------------+ +-----------------+  |
|  | Auth & ID Controller  | | Cases Controller     | | Document Controller | | Inter-Station   |  |
|  | - /api/auth           | | - /api/cases         | | - /api/documents    | |   Collaboration |  |
|  | - /api/registered-ids | | - Criminal Taxonomy  | | - AES-256 Encrypt   | | - /api/collab   |  |
|  | - ID Card Validation  | | - Search & Analytics | | - Ephemeral Stream  | | - Share Approval|  |
|  +-----------------------+ +----------------------+ +---------------------+ +-----------------+  |
|                                                                                                   |
|  +---------------------------------------------------------------------------------------------+  |
|  | Audit & Compliance Engine: /api/audit (Times-Opened Chart, MongoDB Aggregation, Admin Reset)|  |
|  +---------------------------------------------------------------------------------------------+  |
+===================================================================================================+
                                    |                                   |
         +--------------------------+--------------------+                  |
         |                                               |                  |
+--------v-----------------------------------+ +---------v------------------v-----------------------+
|        DATABASE CLUSTER (MongoDB)          | |          ENCRYPTED DISK STORAGE VAULT              |
|  - Users (Credentials, RBAC Roles)         | |  - server/uploads/*.pdf.enc                        |
|  - Cases (FIRs, Suspects, Metadata)        | |  - server/uploads/idcards/*.enc                    |
|  - Documents (Encrypted Pointers, Tags)    | |  - 16-byte Cryptographic IV Prepend Buffer         |
|  - AuditLogs (Immutable Event Ledger)      | |  - Ephemeral Decrypted Buffers Auto-Purged         |
|  - RegisteredIDs (Departmental Bio-Data)   | +----------------------------------------------------+
+--------------------------------------------+
```

---

## 4. Complete Codebase Directory Tree & Inventory

```
PRATIBANDH-ROOT/
├── ARCHITECTURE.md              # Master System Architecture & Reference Specification
├── README.md                    # Project Overview, Setup Instructions & Quick Start
├── package.json                 # Workspace Root Package Configuration
├── .gitignore                   # Version Control Ignore Rules
│
├── client/                      # Frontend Application (React 18 + Vite)
│   ├── index.html               # SPA Entry HTML Template
│   ├── vite.config.js           # Vite Bundler & HMR Configuration
│   ├── tailwind.config.js       # Tailwind CSS Design System & Palette Configuration
│   ├── postcss.config.js        # PostCSS Plugins Pipeline
│   ├── package.json             # Frontend Dependencies & Scripts
│   ├── package-lock.json        # Frontend Deterministic Lockfile
│   └── src/
│       ├── main.jsx             # React Application Bootstrap & DOM Mount
│       ├── App.jsx              # Client Route Tree, Protected Routes & Toast Anchor
│       ├── index.css            # Tailwind Base, Theme Directives & Animations
│       │
│       ├── context/
│       │   └── AuthContext.jsx  # Central Authentication State, Login & Token Sync
│       │
│       ├── utils/
│       │   ├── api.js           # Axios Instance with JWT Request Interceptor
│       │   └── ocr.js           # Tesseract.js OCR Pipeline, Grayscale & Regex Parser
│       │
│       └── components/
│           ├── Common/
│           │   ├── GovHeader.jsx       # National Emblem, Tricolor, IST Live Clock
│           │   ├── GovFooter.jsx       # Statutory Disclaimers, NIC/MHA Portal Links
│           │   └── FloatingActions.jsx # Speed-Dial Floating Menu (Scroll, Help, Scan)
│           │
│           ├── Layout/
│           │   ├── Layout.jsx   # Master Wrapper (Header, Sidebar, Main, Footer)
│           │   ├── Navbar.jsx   # Top Navigation Bar with Officer Profile & Logout
│           │   └── Sidebar.jsx  # Left Navigation Sidebar with Strict Role Filtering
│           │
│           ├── Auth/
│           │   ├── IDVerification.jsx # ID Card Scan & OCR-Driven Login Interface
│           │   └── Login.jsx          # Fallback Registration Number/Password Login
│           │
│           ├── Dashboard/
│           │   └── Dashboard.jsx      # Executive Analytics, Quick Tools & Crime Charts
│           │
│           ├── Cases/
│           │   ├── CaseList.jsx       # Case Catalog, Crime Category Filter & Status
│           │   ├── CaseCreate.jsx     # FIR / Investigation Case Registration Form
│           │   └── CaseDetail.jsx     # Detailed Case Dossier, Suspects & Evidence
│           │
│           ├── Documents/
│           │   ├── DocumentList.jsx   # Evidence Vault Repository & Filter Grid
│           │   ├── DocumentUpload.jsx # Multipart Evidence Upload & Metadata Tagging
│           │   ├── DocumentViewer.jsx # Anti-Screenshot Spotlight Canvas Viewer
│           │   └── DocumentSearch.jsx # Forensic Full-Text & OCR Snippet Search
│           │
│           ├── AuditTrail/
│           │   └── AuditLog.jsx       # Audit Ledger, Activity Bar Chart & Admin Reset
│           │
│           ├── Admin/
│           │   └── ManagePersonnel.jsx # Officer Enrollment & ID Card Management
│           │
│           └── Collaboration/
│               └── SharedCases.jsx    # Inter-Station Case Request & Access Gateway
│
└── server/                      # Backend Application (Node.js + Express + MongoDB)
    ├── server.js                # Express App, Middleware, Routes & Socket.IO Init
    ├── package.json             # Backend Dependencies & Start Scripts
    ├── package-lock.json        # Backend Deterministic Lockfile
    │
    ├── config/
    │   └── db.js                # MongoDB Connection Handler via Mongoose ODM
    │
    ├── models/
    │   ├── User.js              # User Account, Role, Password Hashing Schema
    │   ├── Case.js              # Investigation Case, Crime Taxonomy Schema
    │   ├── Document.js          # Evidence Document, Encryption Pointer Schema
    │   ├── AuditLog.js          # Immutable Access Event & Action Log Schema
    │   └── RegisteredID.js      # Authorized Personnel Departmental Registry Schema
    │
    ├── middleware/
    │   ├── auth.js              # JWT Bearer Token Validation Middleware
    │   ├── roleCheck.js         # Role-Based Access Control (RBAC) Gatekeeper
    │   └── auditLogger.js       # Automatic Audit Event Dispatcher & Formatter
    │
    ├── routes/
    │   ├── auth.js              # Authentication, ID Card Matching & Login Endpoints
    │   ├── registeredIds.js     # Personnel Registration & ID Verification Routes
    │   ├── cases.js             # Investigation Case CRUD, Search & Crime Analytics
    │   ├── documents.js         # Evidence Upload, Decrypted Download & Deletion
    │   ├── audit.js             # Audit Ledger, Per-User Aggregations & Admin Reset
    │   ├── search.js            # Unified Full-Text & Forensic Search API
    │   ├── collaboration.js     # Inter-Station Sharing & Access Request Gateway
    │   └── dashboard.js         # Executive Metric Aggregations API
    │
    └── utils/
        └── encryption.js        # AES-256-CBC Stream Cipher with Random 16-byte IV
```

---

## 5. Bit-by-Bit Frontend Component & Module Architecture (`client/`)

### 5.1 Root Core Modules

- **`client/src/main.jsx`**:
  - *Purpose:* Initial React DOM mounting entry point. Initializes React Strict Mode, attaches the `App` component into the `div#root` container in `index.html`, and attaches `BrowserRouter`.
  - *Libraries:* `react`, `react-dom/client`, `react-router-dom`.
- **`client/src/App.jsx`**:
  - *Purpose:* Defines declarative routing paths and RBAC security gates. Wraps protected routes inside `<ProtectedRoute>` which inspects authentication state and role authorization (`super_admin`, `station_admin`, `officer`, etc.). Mounts the global `<Toaster>` notification container.
  - *Libraries:* `react-router-dom`, `react-hot-toast`.
- **`client/src/context/AuthContext.jsx`**:
  - *Purpose:* React Context Provider managing global authentication state (`user`, `token`, `loading`). Automatically validates saved JWT tokens on startup against `/api/auth/me`. Provides `login()`, `idCardLogin()`, and `logout()` helper dispatchers.
  - *State:* `user` (Object), `token` (String), `loading` (Boolean).
- **`client/src/utils/api.js`**:
  - *Purpose:* Axios HTTP client configured with a base URL of `/api`. Features an automated request interceptor that retrieves the JWT from `localStorage` and injects `Authorization: Bearer <token>` into all outgoing headers.
- **`client/src/utils/ocr.js`**:
  - *Purpose:* Client-side WebAssembly Optical Character Recognition utility. Contains image preprocessing functions (minimum 1200px width scaling, luminosity grayscale conversion, dynamic contrast stretching) and regex extraction matrices for recovering registration numbers and officer names.

### 5.2 Common & Frame Components

- **`components/Common/GovHeader.jsx`**:
  - *Purpose:* Official government banner featuring the National Emblem of India, Ministry of Home Affairs title, National Security classification tag, and an active real-time clock synced to Indian Standard Time (IST).
- **`components/Common/GovFooter.jsx`**:
  - *Purpose:* Institutional footer rendering Section 65B Indian Evidence Act disclaimers, IT Act 2000 references, ISO/IEC 27001 stamps, and authoritative links to `india.gov.in`, `cybercrime.gov.in`, and `nic.in`.
- **`components/Common/FloatingActions.jsx`**:
  - *Purpose:* Fixed bottom-right speed-dial widget offering quick actions: Scroll-to-Top, National 1930 Cyber Crime Helpline Modal, ID Card Verification shortcut, Evidence Document Upload, New Case Creation, and Audit Trail Ledger shortcut.

### 5.3 Authentication & Personnel Management

- **`components/Auth/IDVerification.jsx`**:
  - *Purpose:* Primary authentication portal. Supports capturing physical departmental ID cards via live camera stream or file upload. Preprocesses the image, executes Tesseract.js OCR, matches extracted credentials against the backend bio-data database via `/api/auth/match-id-card`, and logs the officer in upon successful verification.
- **`components/Auth/Login.jsx`**:
  - *Purpose:* Secondary credential login portal allowing entry via Registration/Form Number or Official Email alongside password authentication.
- **`components/Admin/ManagePersonnel.jsx`**:
  - *Purpose:* Admin-only personnel management console. Allows enrolling new officers, uploading encrypted ID card photos, assigning stations/departments/roles, viewing active rosters, and activating/deactivating accounts.

### 5.4 Evidentiary & Investigation Modules

- **`components/Dashboard/Dashboard.jsx`**:
  - *Purpose:* Executive overview featuring key metric cards (Active Cases, Urgent FIRs, Sealed Evidences, Under Review), real-time audit ledger feed, and interactive Crime Category distribution bars.
- **`components/Cases/CaseList.jsx`**:
  - *Purpose:* Searchable and filterable case directory supporting filtering by crime classification (*Murder, Cybercrime, Fraud, Theft, etc.*), status (*Open, Closed, Under Investigation*), and priority (*Low, Medium, High, Critical*).
- **`components/Cases/CaseCreate.jsx`**:
  - *Purpose:* Investigation case authoring form allowing officers to enter FIR numbers, crime categories, suspect profiles, victim demographics, and assigned officers.
- **`components/Cases/CaseDetail.jsx`**:
  - *Purpose:* Full dossier view displaying case chronology, attached digital evidence documents, suspect profiles, and inter-station sharing controls.
- **`components/Documents/DocumentList.jsx`**:
  - *Purpose:* Searchable catalog of digital evidence records showing document IDs, file sizes, AES-256 encryption badges, and direct navigation to view or download.
- **`components/Documents/DocumentUpload.jsx`**:
  - *Purpose:* Multipart file upload interface for sealing digital evidence files (PDFs, forensic reports, images) with document classification tags (*Top Secret, Confidential, Restricted*).
- **`components/Documents/DocumentViewer.jsx`**:
  - *Purpose:* Proprietary anti-screenshot document viewing engine. Renders documents on an offscreen canvas, displays a blurred primary canvas, renders sharp text only within a 130px cursor spotlight circle, bakes dynamic watermarks into canvas pixels, and intercepts screenshot keys.
- **`components/Documents/DocumentSearch.jsx`**:
  - *Purpose:* Deep forensic search engine allowing officers to search across document titles, OCR-extracted text contents, and case metadata.
- **`components/AuditTrail/AuditLog.jsx`**:
  - *Purpose:* Comprehensive audit trail dashboard featuring an interactive activity distribution chart (Times Opened per Name, Views, Downloads, Logins), a searchable ledger table, CSV export, and an admin-only two-step modal to reset and purge audit history.
- **`components/Collaboration/SharedCases.jsx`**:
  - *Purpose:* Multi-station collaboration hub managing inter-agency evidence sharing requests (*Shared With Us* and *Shared By Us*).

---

## 6. Bit-by-Bit Backend Server & Controller Architecture (`server/`)

### 6.1 Server Bootstrap & Middleware

- **`server/server.js`**:
  - *Purpose:* Initializes Express application, connects to MongoDB via `config/db.js`, configures middleware (`helmet`, `cors`, `morgan`, `express.json`), mounts API route endpoints under `/api/*`, and initializes Socket.IO WebSocket server on HTTP port 5000.
- **`server/config/db.js`**:
  - *Purpose:* Handles asynchronous connection to MongoDB using Mongoose, configuring connection pooling and handling reconnection events.
- **`server/middleware/auth.js`**:
  - *Purpose:* Extracts JWT token from `Authorization: Bearer <token>` header, verifies signature using `JWT_SECRET`, retrieves the user document from MongoDB, and populates `req.user`.
- **`server/middleware/roleCheck.js`**:
  - *Purpose:* Higher-order middleware taking an array of permitted roles (e.g. `['super_admin', 'station_admin']`) and returning `403 Forbidden` if `req.user.role` is unauthorized.
- **`server/middleware/auditLogger.js`**:
  - *Purpose:* Exports `logAction(userId, action, resourceType, resourceId, details, req)` which creates an immutable record in the `AuditLog` collection capturing the user, client IP address, action, and timestamp.

### 6.2 REST Controllers & Route Modules

- **`server/routes/auth.js`**:
  - `POST /api/auth/match-id-card`: Matches OCR tokens against registered officer records.
  - `POST /api/auth/id-card-login`: Issues JWT upon successful ID card match.
  - `POST /api/auth/login`: Authenticates user via Registration/Email + Password.
  - `POST /api/auth/register`: Restricted endpoint for registering admin-level accounts.
  - `GET /api/auth/me` & `PUT /api/auth/me`: Retrieves/updates authenticated user profile.
- **`server/routes/registeredIds.js`**:
  - `GET /api/registered-ids/verify/:formNumber`: Public form number verification endpoint.
  - `POST /api/registered-ids/seed-samples`: Synchronizes sample officer cards.
  - `GET /api/registered-ids/sample-status`: Returns counts and items of registered IDs.
  - `POST /api/registered-ids`: Admin endpoint to register officer with encrypted ID card.
  - `GET /api/registered-ids`, `GET /:id`, `PUT /:id`, `DELETE /:id`: Admin CRUD management.
- **`server/routes/cases.js`**:
  - `GET /api/cases`: Filtered case queries with pagination.
  - `POST /api/cases`: Creates new investigation case.
  - `GET /api/cases/:id`: Detailed case retrieval with populated references.
  - `PUT /api/cases/:id`: Updates case metadata, suspects, or evidence.
  - `DELETE /api/cases/:id`: Deletes case and triggers cleanup of linked encrypted files.
  - `GET /api/cases/by-crime-type`: MongoDB aggregation pipeline grouping cases by legal crime type.
  - `POST /api/cases/:id/share`: Grants case access to another station.
- **`server/routes/documents.js`**:
  - `POST /api/documents/upload`: Multer upload, AES-256 encryption, and metadata creation.
  - `GET /api/documents`: List documents with filters and pagination.
  - `GET /api/documents/:id`: Document metadata retrieval with view logging.
  - `GET /api/documents/:id/download`: Decrypts encrypted file on-the-fly to a temporary stream.
  - `DELETE /api/documents/:id`: Restricts deletion to original uploader or super admin.
  - `GET /api/documents/search`: Full-text search across document titles and OCR text.
- **`server/routes/audit.js`**:
  - `GET /api/audit`: Admin endpoint for querying filtered audit logs.
  - `GET /api/audit/recent`: Recent 10 audit logs for dashboard feed.
  - `GET /api/audit/user-stats`: Aggregates total actions, times opened, views, downloads, logins, and edits per officer.
  - `GET /api/audit/user/:userId`: User-specific audit history.
  - `GET /api/audit/document/:docId`: Document-specific chain of custody history.
  - `DELETE /api/audit/reset` & `DELETE /api/audit/clear`: Admin-only reset and purge of all audit history.
- **`server/routes/search.js`**:
  - `GET /api/search`: Unified full-text search across both cases and documents.
- **`server/routes/collaboration.js`**:
  - `GET /api/collaboration/shared-with-us`: Cases shared with current station.
  - `GET /api/collaboration/shared-by-us`: Cases shared by current station.
  - `POST /api/collaboration/requests`: Dispatches inter-station sharing request.
  - `PATCH /api/collaboration/requests/:id`: Approves/rejects sharing requests.
- **`server/routes/dashboard.js`**:
  - `GET /api/dashboard/stats`: Returns count of active cases, open cases, encrypted documents, and pending reviews.

---

## 7. Cryptographic Subsystem & Binary File Security (`.enc`)

### AES-256-CBC Symmetric Encryption Architecture

All evidentiary documents and ID card images stored in `server/uploads/` are secured via `server/utils/encryption.js`:

```
+-------------------------------------------------------------------------+
|                  AES-256-CBC Encrypted File Structure                   |
|                                                                         |
|  +-----------------------------+  +----------------------------------+  |
|  |   16 Bytes Random IV        |  |   AES-256 Ciphertext Payload     |  |
|  |   (crypto.randomBytes(16))  |  |   (Encrypted Evidence Binary)    |  |
|  +-----------------------------+  +----------------------------------+  |
+-------------------------------------------------------------------------+
```

1. **Random IV Generation:** For every file, a distinct 16-byte cryptographically secure random Initialization Vector (IV) is generated via `crypto.randomBytes(16)`.
2. **IV Prepending:** The 16-byte IV is prepended to the ciphertext buffer during encryption. This eliminates static IV vulnerabilities and guarantees that two identical files yield completely different ciphertexts.
3. **On-The-Fly Ephemeral Decryption:** When an authorized user downloads a document:
   - The server reads the `.enc` file.
   - Slices the first 16 bytes to extract the IV.
   - Deciphers the remaining buffer using AES-256-CBC.
   - Writes to a temporary ephemeral file (`.tmp`), streams it to the client response, and unlinks it immediately upon completion.

---

## 8. AI-Assisted OCR Vision & Bio-Data Matching Engine

### Client-Side WASM OCR Pipeline (`client/src/utils/ocr.js`)

```
[Raw Physical ID Card Image]
            │
            ▼
[Image Preprocessing Canvas]
  ├── Minimum 1200px Width Upscaling
  ├── Grayscale Conversion: Y = 0.299R + 0.587G + 0.114B
  └── Dynamic Contrast Boost (+30%)
            │
            ▼
[Tesseract.js WASM Engine]
  └── Optical Character Extraction
            │
            ▼
[RegEx & Typo-Correction Matrix]
  ├── Character Substitutions: O->0, I/l/|->1, S->5, B->8, Z->2
  ├── Form/Registration Number Extraction: /\b(25\d{6}|\d{8})\b/
  └── Officer Name Token Extraction
            │
            ▼
[POST /api/auth/match-id-card]
  └── Backend Database Matching (Form No -> Digits -> Name Tokens)
```

- **Zero Server CPU Bottleneck:** OCR processing runs entirely inside the client browser via WebAssembly, ensuring instant performance without overloading backend resources.
- **Typo-Correction Matrix:** Resolves camera glare and optical noise by automatically testing numeric substitutions for common alphanumeric ambiguities.

---

## 9. Anti-Screenshot Dual-Canvas Rendering Engine

Document viewing inside `client/src/components/Documents/DocumentViewer.jsx` utilizes dual-canvas spotlight rendering to defeat hardware screen recording and unauthorized photography:

```
[Document Metadata & Text Content]
                │
                ▼
    [Offscreen Memory Canvas]
 (Renders 100% Sharp Text & Seals)
                │
                ├────────────────────────────────────────┐
                ▼                                        ▼
      [Main Visible Canvas]                    [Cursor Position (X, Y)]
   (Renders 10px Blurred View)                           │
                │                                        ▼
                └───────────────────────────► [2D Circular Clip Path]
                                              (130px Radius Spotlight)
                                                         │
                                                         ▼
                                            [Sharp Offscreen Canvas Drawn Inside]
                                                         │
                                                         ▼
                                            [Dynamic Forensic Watermark]
                                            - Rotated -25° Diagonal Grid
                                            - Officer Name • Form Number
                                            - Station • ISO Timestamp
```

### Security Deterrents Implemented:
1. **Spotlight Masking:** The document remains heavily blurred; only a 130px circle under the active mouse cursor is rendered sharp.
2. **Forensic Watermarking:** Diagonal watermarks containing the reviewing officer's full name, registration number, and millisecond timestamp are rendered directly into the canvas pixels.
3. **Hardware Key Interception:** Intercepts and suppresses `PrintScreen`, `Ctrl+P`, `Ctrl+S`, `Ctrl+U`, and right-click context menus.

---

## 10. Audit Trail, User Activity Chart & Admin Reset Purge Safeguards

### Statutory Compliance & Admissibility (Section 65B Indian Evidence Act)

Every user interaction creates an unalterable log in the `AuditLog` collection:
- `user`: ObjectId of authenticated officer
- `action`: `view`, `download`, `upload`, `edit`, `delete`, `login`, `share`
- `resourceType`: `document`, `case`, `user`, `system`
- `resourceId`: Identifier of the impacted entity
- `details`: Human-readable summary of the action
- `ipAddress`: Client IPv4/IPv6 address
- `timestamp`: IST timestamp

### Interactive Activity Chart (Times Opened per Name)
`AuditLog.jsx` aggregates audit data to generate multi-segment activity bars ranking personnel by:
- **Times Opened / Accessed** (sum of views, downloads, and logins)
- **Document Views** (blue segment)
- **Evidentiary Downloads** (purple segment)
- **Logins** (green segment)
- **Modifications / Edits** (amber segment)

### Admin-Only Master Reset & Purge Safeguard
- **Endpoint:** `DELETE /api/audit/reset` & `DELETE /api/audit/clear`
- **RBAC Gate:** Restricted to `super_admin`, `station_admin`, or authorized admin badge ID `25110377`.
- **Two-Step Safeguard Modal:** The administrator must confirm intent by explicitly typing **`RESET`** into a modal prompt before `AuditLog.deleteMany({})` is executed.

---

## 11. Database Schemas, Indexing & Storage Layer

### 11.1 User Model (`server/models/User.js`)
- `name` (String, required, trim)
- `email` (String, required, unique, lowercase)
- `password` (String, required, Bcrypt hashed)
- `role` (Enum: `super_admin`, `station_admin`, `officer`, `court_official`, `forensic_expert`, `viewer`)
- `station` (String, default: "OUTR Bhubaneswar")
- `formNumber` / `badgeId` (String, indexed)
- `department` (String)
- `phone` (String)
- `isActive` (Boolean, default: true)
- `lastLogin` (Date)

### 11.2 Case Model (`server/models/Case.js`)
- `caseId` (String, unique, indexed — format `CASE-YYYY-XXXXX`)
- `title` (String, required, indexed)
- `description` (String)
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

### 11.3 Document Model (`server/models/Document.js`)
- `docId` (String, unique, indexed — format `DOC-YYYY-XXXXX`)
- `title` (String, required, indexed)
- `docType` (Enum: `fir`, `charge_sheet`, `evidence`, `investigation_report`, `court_filing`, `forensic_report`, `witness_statement`, `other`)
- `case` (ObjectId reference to `Case`, required, indexed)
- `filePath` (String — path to encrypted `.enc` binary)
- `originalName`, `mimeType`, `fileSize` (Number)
- `isEncrypted` (Boolean, default: true)
- `uploadedBy` (ObjectId reference to `User`)
- `tags` (Array of Strings)
- `ocrText` (String, indexed for full-text search)
- `accessRestriction` (Enum: `public`, `restricted`, `confidential`, `top_secret`)

### 11.4 AuditLog Model (`server/models/AuditLog.js`)
- `user` (ObjectId reference to `User`, required, indexed)
- `action` (Enum: `login`, `logout`, `view`, `download`, `upload`, `edit`, `delete`, `share`, `print_attempt`, `screenshot_attempt`, `access_denied`)
- `resourceType` (Enum: `document`, `case`, `user`, `system`)
- `resourceId` (String, indexed)
- `details` (String)
- `ipAddress` (String)
- `userAgent` (String)
- `timestamp` (Date, default: `Date.now`, indexed)

### 11.5 RegisteredID Model (`server/models/RegisteredID.js`)
- `formNumber` (String, required, unique, indexed, uppercase)
- `name` (String, required, trim)
- `email` (String, required, unique, lowercase)
- `role` (Enum)
- `station` & `department` (String)
- `phone` (String)
- `idCardImage` (String — path to stored encrypted ID photo)
- `addedBy` (ObjectId reference to `User`)
- `isActive` (Boolean, default: true)

---

## 12. End-to-End Operational Execution Pipelines

### Pipeline 1: ID Card Optical Verification & Login
```
[Officer presents ID Card to Camera / Uploads Image]
                         │
                         ▼
[Client Preprocessing Canvas: Scale to 1200px, Grayscale, Contrast Boost]
                         │
                         ▼
[Tesseract.js WASM OCR extracts Form Number & Name tokens]
                         │
                         ▼
[POST /api/auth/match-id-card validates credentials in Database]
                         │
                         ▼
[POST /api/auth/id-card-login generates JWT token & logs audit event]
                         │
                         ▼
[AuthContext updates state -> User lands on Dashboard]
```

### Pipeline 2: Encrypted Document Upload & Ingestion
```
[Officer fills DocumentUpload.jsx & attaches Evidence File]
                         │
                         ▼
[POST /api/documents/upload streams file to Multer temp storage]
                         │
                         ▼
[encryption.js generates 16-byte random IV & executes AES-256-CBC]
                         │
                         ▼
[Encrypted file written to server/uploads/*.pdf.enc]
                         │
                         ▼
[Original temp file deleted via fs.unlinkSync]
                         │
                         ▼
[Document record created in MongoDB & AuditLog event recorded]
```

### Pipeline 3: Anti-Screenshot Spotlight Viewing
```
[Officer opens /documents/:id/view]
                         │
                         ▼
[DocumentViewer fetches metadata & logs 'view' event to AuditLog]
                         │
                         ▼
[Offscreen Canvas renders crisp text & classification seals]
                         │
                         ▼
[Main Canvas renders Gaussian blurred background view]
                         │
                         ▼
[Cursor movement dynamically clips 130px circle revealing sharp text]
                         │
                         ▼
[Forensic watermarks baked across all pixels with Officer ID & Time]
```

---

## 13. Technology Selection Rationales & Architectural Justifications

| Technology Choice | Architectural Justification over Alternatives |
| :--- | :--- |
| **React 18 + Vite** | Provides instantaneous Hot Module Replacement (HMR) during development and builds optimized, tree-shaken static bundles for lightning-fast load times on field laptops and station terminals. |
| **TailwindCSS 3.4** | Enables rapid, utility-first styling with zero runtime CSS overhead, perfectly matching standard Indian Government design frameworks (NIC / MHA color palettes). |
| **Dual-Canvas over DOM Text** | Standard HTML/DOM text can be easily inspected, copied, or captured via full-page screenshot extensions. Canvas rasterization prevents DOM inspection, facilitates dynamic cursor spotlight masking, and bakes watermarks directly into raw pixel data. |
| **AES-256-CBC with Random IV** | Military-grade symmetric encryption standard. Generating a unique 16-byte random IV per file guarantees that identical files produce completely different ciphertexts, preventing pattern analysis attacks. |
| **Client WASM OCR (Tesseract.js)** | Performing optical character recognition locally inside the browser eliminates server CPU bottlenecks, avoids streaming high-resolution images across congested network links, and ensures instant response. |
| **MongoDB Aggregation Pipelines** | MongoDB's native aggregation framework allows computing complex multi-metric statistics (Times Opened per Name, view/download distributions) directly in the database engine with sub-millisecond execution. |
| **Statutory 65B Compliance** | Immutable, timestamped, IP-tagged audit logging ensures that digital evidence maintained within PRATIBANDH is fully admissible in Indian judicial courts under Section 65B of the Indian Evidence Act. |

---

*Authored by the PRATIBANDH Engineering Team • Ministry of Home Affairs Digital Evidence Initiative*
