# 🏛️ PRATIBANDH — Secure Digital Document Management System

> **Problem Statement 1690 (SIH)**  
> **Centralized, Encrypted & Forensic-Tracked Legal & Investigation Repository**

---

## 🌟 Overview & Core Innovations

PRATIBANDH is a government-grade digital evidence and case document repository built for police departments, courts, and forensic laboratories. It solves the critical risks of document tampering, unauthorized leakages, and untracked access through three core pillars

1. **🔦 Dynamic Spotlight Masking**: Documents rendered directly onto an HTML5 Canvas where only an elliptical/circular view radius around the user cursor is unobscured. This neutralizes full-page photographic screen captures.
2. **🔒 Dynamic Forensic Watermarking**: User credentials (Officer Name, Badge ID, IP address, and microsecond-precision timestamps) are repeatedly stamped and baked directly into the canvas pixels. Any captured snippet immediately traces the exact originating terminal.
3. **🛡️ Immutable Audit Trails & Granular RBAC**: Every single view, edit, download, search, or unauthorized attempt is logged with IP, user agent, and timestamp. Multi-station cross-collaboration requests require explicit authorization workflows.

---

## 👥 Team Work Breakdown (6 Members)

| Member | Focus | Key Responsibilities |
| :--- | :--- | :--- |
| **Member 1 (Lead)** | System Architecture & Core Integration | Full-stack wiring, API integration, master demo setup |
| **Member 2** | Frontend & Management Modules | Case listings, case creation, dashboard metrics, filter UI |
| **Member 3** | Security & Canvas Engine | Spotlight viewer, forensic watermark renderer, screen capture deterrents |
| **Member 4** | Backend & Data Pipeline | MongoDB Atlas configuration, AES-256 encryption, Multer file upload, JWT RBAC |
| **Member 5 (Remote)** | Pitch Deck & Research | SIH presentation deck (10-12 slides), crime data stats, architecture flowcharts, demo script |
| **Member 6** | UI Polish & Multi-Station Collab | Government theme consistency, collaboration request/approval modules, QA testing |

---

## 🚀 Quick Start Guide

### 1. Backend Setup
```bash
cd server
npm install
```

Configure your environment file `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/pratibandh?retryWrites=true&w=majority
JWT_SECRET=pratibandh_secure_key_2024_sih
ENCRYPTION_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

Start the backend:
```bash
npm run dev
```

### 2. Frontend Setup
Open a second terminal window:
```bash
cd client
npm install
npm run dev
```

The application will be accessible at: `(https://pratibandh-secure-vault.vercel.app/cases)`

---

## 📑 System Capabilities

- **Categorized Case Vault**: Filtering by Crime Type (*Murder, Rape, Theft, Cybercrime, Fraud, Kidnapping, etc.*), Culprit Demographics (*Age group, Gender, History*), and Status (*Open, Under Investigation, Charge Sheeted, Closed*).
- **Document Classifications**: FIR, Charge Sheet, Evidence Record, Forensic Analysis, Witness Statement, Court Filing.
- **Cross-Station Collaboration**: Station-to-station request/approval pipelines for inter-state and jurisdictional cooperation.
- **Full Traceability**: Comprehensive audit log view with search, filter by officer, date, or action type.

---

## 🛡️ Presentation Tips for Internal Hackathon / SIH Jury

1. **Highlight the Canvas Viewer First**: Show judges how standard screenshot or DOM inspection tools cannot extract the full file text because the text is baked into an HTML Canvas with a moving spotlight cursor.
2. **Demonstrate Traceability**: Show that even if someone takes a photo with a smartphone camera, the forensic watermark with the Officer's Badge and current timestamp is clearly visible across every section.
3. **Showcase Multi-Station Collaboration**: Log in as an Officer from Station A, request access to a case in Station B, log in as Station B Admin, approve the request, and show live access granting.
4. **Point to the Audit Log**: Show that opening the file instantly produced an immutable audit entry recording who viewed it, from which IP, and at what exact time.
