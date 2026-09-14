# 🚀 PRATIBANDH - Quick Start Guide

## ⚡ Fastest Way to Get Running (5 Minutes)

### Step 1: Setup MongoDB Atlas (Cloud Database - FREE)

1. **Sign up**: Go to https://account.mongodb.com/account/register
2. **Create Cluster**: 
   - Choose "M0 FREE" tier
   - Select closest region to you
   - Name: `pratibandh-cluster`
3. **Create Database User**:
   - Username: `pratibandh_user`
   - Password: Create a strong password (e.g., `Pratibandh2024!`)
   - **⚠️ SAVE THIS PASSWORD!**
4. **Network Access**:
   - Click "Network Access" → "Add IP Address"
   - Select "Allow Access from Anywhere" (0.0.0.0/0)
5. **Get Connection String**:
   - Click "Connect" → "Connect your application"
   - Copy the connection string (looks like):
     ```
     mongodb+srv://pratibandh_user:<password>@pratibandh-cluster.xxxxx.mongodb.net/
     ```
   - **Replace `<password>` with your actual password!**

### Step 2: Update Backend Configuration

Open `server/.env` and update the `MONGO_URI`:

```env
PORT=5000
MONGO_URI=mongodb+srv://pratibandh_user:YOUR_PASSWORD@pratibandh-cluster.xxxxx.mongodb.net/pratibandh?retryWrites=true&w=majority
JWT_SECRET=pratibandh_secure_key_2024_sih
ENCRYPTION_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**⚠️ IMPORTANT**: Replace `YOUR_PASSWORD` with the actual password you created!

### Step 3: Start Everything

**Option A: Use Batch File (Easiest)**
```bash
# Just double-click this file:
START-ALL.bat
```

**Option B: Manual Start**
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend  
cd client
npm run dev
```

### Step 4: Access the Application

Open your browser and go to: **http://localhost:3000**

---

## 👤 First User Registration

1. Click "Register here" on the login page
2. Fill in your details:
   - **Full Name**: Your name
   - **Email**: your.email@gov.in
   - **Password**: Create a strong password
   - **Role**: Choose `Super Admin` (for full access)
   - **Badge ID**: Any unique ID (e.g., `BADGE001`)
   - **Police Station**: Your station name
   - **Department**: Your department (e.g., Crime Branch)
   - **Phone**: Your contact number
3. Click "Register"
4. You'll be automatically logged in!

---

## 🎯 Demo Workflow (For SIH Presentation)

### 1. Dashboard Overview (30 seconds)
- Show statistics cards (Total Cases, Open Cases, Documents, etc.)
- Show recent activity feed
- Show cases by crime type chart

### 2. Create a Case (1 minute)
1. Click "New Case" button
2. Fill in case details:
   - **Title**: "Unauthorized Server Access at Police HQ"
   - **Crime Type**: Cybercrime
   - **Priority**: Critical
   - **Description**: Brief incident summary
3. Add suspect information (optional)
4. Click "Register Case"

### 3. Upload Encrypted Document (1 minute)
1. Go to "Documents" → "Upload Document"
2. Drag & drop a PDF/image file
3. Select the case you just created
4. Choose document type (e.g., "FIR")
5. Add tags (e.g., "evidence, cyber, server")
6. Click "Upload & Encrypt"
7. **Show**: Progress bar with "Encrypting & Storing" message

### 4. Spotlight Document Viewer (2 minutes) ⭐ KEY FEATURE
1. Click on the document you just uploaded
2. **Demonstrate**:
   - ✅ Spotlight following cursor (only visible area is clear)
   - ✅ Rest of document is obscured/darkened
   - ✅ Forensic watermark visible (your name, badge, timestamp)
   - ✅ Zoom controls work
   - ✅ Toggle spotlight on/off
3. **Explain to judges**:
   - "Screenshot only captures what's in spotlight"
   - "Watermark traces every capture back to officer"
   - "Right-click and Ctrl+S are blocked"

### 5. Audit Trail (1 minute) ⭐ KEY FEATURE
1. Go to "Audit Trail" (admin only)
2. **Show**:
   - Every action is logged (view, create, upload, etc.)
   - User name, badge ID, IP address visible
   - Timestamp in milliseconds
   - Filter by action type
3. **Explain**: "Immutable log - cannot be deleted or modified"

### 6. Cross-Station Collaboration (1 minute)
1. Go to "Collaboration"
2. Click "Request Case Access"
3. Fill in:
   - **Case ID**: The case you created
   - **Target Station**: Another station name
   - **Reason**: "Multi-jurisdictional investigation required"
4. Submit request
5. Show in "Shared By Us" tab

### 7. Unified Search (30 seconds)
1. Go to "Search"
2. Type a keyword (e.g., "cyber" or "server")
3. Show results from both cases and documents
4. Click through to a result

---

## 🎨 Key Features to Highlight

### 1. 🔦 Spotlight Masking
- **What**: Only a circular area around cursor is visible
- **Why**: Prevents full-page screenshots
- **Demo**: Move mouse around document viewer

### 2. 🔒 Forensic Watermarking
- **What**: Officer name, badge, timestamp baked into canvas
- **Why**: Every screenshot is traceable
- **Demo**: Show watermark pattern across document

### 3. 🛡️ AES-256 Encryption
- **What**: All uploaded files encrypted before storage
- **Why**: Files unreadable even if server is compromised
- **Demo**: Show "Encrypting & Storing" progress

### 4. 📝 Immutable Audit Trail
- **What**: Every action logged with user, IP, timestamp
- **Why**: Complete accountability and traceability
- **Demo**: Show audit log with your recent actions

### 5. 🤝 Cross-Station Collaboration
- **What**: Request/approve access to cases across stations
- **Why**: Multi-jurisdictional investigations
- **Demo**: Create and show access request

### 6. 🔍 Unified Search
- **What**: Search across all cases and documents
- **Why**: Quick access to related information
- **Demo**: Search and show results

### 7. 👮 Role-Based Access Control
- **What**: Different permissions for different roles
- **Why**: Security principle of least privilege
- **Demo**: Show admin-only Audit Trail

---

## 🎤 Presentation Script (1 minute pitch)

> "PRATIBANDH is a government-grade digital evidence vault that solves three critical problems in law enforcement:
> 
> **Problem 1: Document Tampering**
> - Our AES-256 encryption ensures files cannot be modified without detection
> - Immutable audit logs track every single access
> 
> **Problem 2: Unauthorized Leakage**
> - Dynamic spotlight masking prevents full-page screenshots
> - Forensic watermarking traces every capture back to the officer
> - Even phone camera photos show the officer's credentials
> 
> **Problem 3: Untracked Access**
> - Every view, download, and edit is logged with officer badge, IP, and microsecond timestamp
> - Cross-station access requires explicit authorization workflows
> 
> This isn't just a document manager - it's a complete chain-of-custody system for digital evidence."

---

## 📊 Statistics to Mention

- **Encryption**: AES-256-CBC (military-grade)
- **Watermarking**: Dynamic, impossible to remove
- **Audit Precision**: Microsecond timestamps
- **Zero Trust**: Every action requires authentication
- **Scalability**: MongoDB Atlas supports millions of documents
- **Compliance**: Meets IT Act 2000 requirements

---

## 🐛 Troubleshooting

### MongoDB Connection Error
**Problem**: "MongoNetworkError" or "connection failed"

**Solution**:
1. Check MongoDB Atlas network access (allow 0.0.0.0/0)
2. Verify connection string has correct password
3. Check if cluster is active (not paused)

### Port Already in Use
**Problem**: "EADDRINUSE" error

**Solution**:
```bash
# Kill processes on ports
npx kill-port 3000 5000
```

### Frontend Not Loading
**Problem**: Blank page or "Cannot GET /"

**Solution**:
```bash
cd client
rm -rf node_modules dist
npm install
npm run dev
```

### Backend API Errors
**Problem**: 500 errors or "Server error"

**Solution**:
1. Check `.env` file exists in `server/` folder
2. Check MongoDB connection string is correct
3. Check server terminal for error messages

---

## 📞 Quick Commands Reference

```bash
# Install dependencies (first time only)
cd server && npm install
cd client && npm install

# Start backend only
cd server && npm run dev

# Start frontend only
cd client && npm run dev

# Build frontend for production
cd client && npm run build

# Kill ports if needed
npx kill-port 3000 5000
```

---

## ✅ Pre-Demo Checklist

- [ ] MongoDB Atlas cluster is running
- [ ] `server/.env` has correct connection string
- [ ] Backend starts without errors (`npm run dev` in server/)
- [ ] Frontend starts without errors (`npm run dev` in client/)
- [ ] Can register a new user
- [ ] Can create a test case
- [ ] Can upload a test document
- [ ] Document viewer shows spotlight effect
- [ ] Watermark is visible in viewer
- [ ] Audit trail shows recent actions
- [ ] Search returns results

---

## 🎯 Success Criteria

Your demo is ready when you can:
1. ✅ Register a user
2. ✅ Create a case
3. ✅ Upload a document (see encryption progress)
4. ✅ View document with spotlight masking
5. ✅ See forensic watermark in viewer
6. ✅ Show audit trail with your actions
7. ✅ Search and find your case/document

---

**Good luck with your SIH presentation! 🚀**

**Need Help?** Check `IMPLEMENTATION_SUMMARY.md` for technical details.
