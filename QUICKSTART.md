# 🚀 MongoDB Installation & PRATIBANDH Startup Guide

## Current Status
✅ Backend dependencies installed
✅ Frontend dependencies installed  
✅ Environment file configured for local MongoDB
⏳ MongoDB installation in progress...

## After MongoDB Installation Completes

### Step 1: Create MongoDB Data Directory
MongoDB needs a directory to store data. Run this in PowerShell **as Administrator**:

```powershell
mkdir C:\data\db
```

### Step 2: Start MongoDB Service

**Option A: Using Windows Service (Recommended)**
```bash
net start MongoDB
```

**Option B: Run MongoDB Manually**
```bash
"C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe" --dbpath="C:\data\db"
```

Or simply double-click: **`start-mongodb.bat`**

### Step 3: Start PRATIBANDH Application

#### Terminal 1 - Backend Server
Double-click: **`start-server.bat`**

Or manually:
```bash
cd server
npm run dev
```

Expected output:
```
Server running on port 5000
MongoDB connected: 127.0.0.1
```

#### Terminal 2 - Frontend Client  
Double-click: **`start-client.bat`**

Or manually:
```bash
cd client
npm run dev
```

Expected output:
```
➜  Local:   http://localhost:5173/
```

### Step 4: Access Application
Open browser: **http://localhost:5173**

---

## 🎯 Quick Testing Checklist

1. **Register First User**
   - Name: Test Officer
   - Badge ID: OFF001
   - Email: officer@test.com
   - Password: Test@123
   - Role: Officer
   - Station: Station A

2. **Create a Case**
   - Title: Test Murder Case
   - Crime Type: Murder
   - Description: Test case for demo

3. **Upload Document**
   - Upload any PDF/image
   - Select document type (FIR, Evidence, etc.)
   - Test the spotlight viewer

4. **Check Audit Trail**
   - Navigate to Audit Logs
   - See all actions recorded

---

## 🛠️ Troubleshooting

### MongoDB Won't Start
```bash
# Check if MongoDB is installed
mongod --version

# Create data directory if missing
mkdir C:\data\db

# Try starting manually
"C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe" --dbpath="C:\data\db"
```

### Port Already in Use
```bash
# Check what's using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual number)
taskkill /PID <PID> /F
```

### Backend Can't Connect to MongoDB
- Ensure MongoDB service is running
- Check `.env` file has: `MONGO_URI=mongodb://127.0.0.1:27017/pratibandh`

---

## 📋 Project Structure

```
pratibandh/
├── client/                 # React Frontend (Vite)
│   ├── src/
│   │   ├── components/    # All UI components
│   │   ├── context/       # Auth context
│   │   └── utils/         # API utilities
│   └── package.json
│
├── server/                # Node.js Backend (Express)
│   ├── config/           # Database config
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API endpoints
│   ├── middleware/       # Auth & logging
│   ├── utils/            # Encryption utilities
│   └── server.js         # Entry point
│
├── start-mongodb.bat     # Quick MongoDB starter
├── start-server.bat      # Quick backend starter
├── start-client.bat      # Quick frontend starter
├── SETUP.md             # Detailed setup guide
└── README.md            # Project overview
```

---

## 🎬 Demo Script for SIH Presentation

1. **Login Demo** (30 sec)
   - Show secure login with JWT authentication

2. **Case Management** (1 min)
   - Create case → Add details → Filter by crime type

3. **Document Upload & Spotlight Viewer** (2 min)
   - Upload FIR document
   - Show spotlight masking effect
   - Point out forensic watermark with officer details

4. **Audit Trail** (1 min)
   - Show every action logged
   - Filter by user/time

5. **Cross-Station Collaboration** (1 min)
   - Request access from another station
   - Show approval workflow

---

## 🔒 Security Features Highlight

- 🔐 AES-256 encryption for stored documents
- 🔦 Canvas-based spotlight rendering (prevents screenshots)
- 💧 Dynamic forensic watermarking
- 📝 Immutable audit logging
- 🎫 JWT-based authentication
- 🛡️ Role-based access control (RBAC)

---

**Next Step**: Wait for MongoDB installation to complete, then follow steps above! 🚀
