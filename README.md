# 🏛️ PRATIBANDH — Secure Digital Document Management System

> **Problem Statement 1690 (SIH)**  
> **Centralized, Encrypted & Forensic-Tracked Legal & Investigation Repository**

---

## 🌟 Overview & Core Innovations

PRATIBANDH is a government-grade digital evidence and case document repository built for police departments, courts, and forensic laboratories. It solves the critical risks of document tampering, unauthorized leakages, and untracked access through three core pillars:

1. **🔦 Dynamic Spotlight Masking**: Documents rendered directly onto an HTML5 Canvas where only an elliptical/circular view radius around the user cursor is unobscured. This neutralizes full-page photographic screen captures.
2. **🔒 Dynamic Forensic Watermarking**: User credentials (Officer Name, Badge ID, IP address, and microsecond-precision timestamps) are repeatedly stamped and baked directly into the canvas pixels. Any captured snippet immediately traces the exact originating terminal.
3. **🛡️ Immutable Audit Trails & Granular RBAC**: Every single view, edit, download, search, or unauthorized attempt is logged with IP, user agent, and timestamp. Multi-station cross-collaboration requests require explicit authorization workflows.

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

The application will be accessible at: `https://pratibandh-secure-vault.vercel.app/cases`

---

## 📑 System Capabilities

- **Categorized Case Vault**: Filtering by Crime Type (*Murder, Rape, Theft, Cybercrime, Fraud, Kidnapping, etc.*), Culprit Demographics (*Age group, Gender, History*), and Status (*Open, Under Investigation, Charge Sheeted, Closed*).
- **Document Classifications**: FIR, Charge Sheet, Evidence Record, Forensic Analysis, Witness Statement, Court Filing.
- **Cross-Station Collaboration**: Station-to-station request/approval pipelines for inter-state and jurisdictional cooperation.
- **Full Traceability**: Comprehensive audit log view with search, filter by officer, date, or action type.
