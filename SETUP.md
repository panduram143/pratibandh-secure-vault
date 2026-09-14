# 🚀 PRATIBANDH - Complete Setup Guide

## Prerequisites
- Node.js (v16+)
- MongoDB Atlas account OR local MongoDB installation
- Git

## Step 1: MongoDB Setup

### Option A: MongoDB Atlas (Recommended - Cloud)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new cluster (Free tier M0)
4. Click "Connect" on your cluster
5. Add your current IP address to whitelist (or use 0.0.0.0/0 for testing)
6. Create a database user with username and password
7. Get your connection string (looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/`)

### Option B: Local MongoDB
1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Install and start MongoDB service
3. Default connection: `mongodb://127.0.0.1:27017/pratibandh`

## Step 2: Environment Configuration

Update `server/.env` with your MongoDB connection:

```env
PORT=5000
MONGO_URI=YOUR_MONGODB_CONNECTION_STRING_HERE
JWT_SECRET=pratibandh_secure_key_2024_sih
ENCRYPTION_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**For MongoDB Atlas**, replace `YOUR_MONGODB_CONNECTION_STRING_HERE` with:
```
mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/pratibandh?retryWrites=true&w=majority
```

**For Local MongoDB**, use:
```
mongodb://127.0.0.1:27017/pratibandh
```

## Step 3: Start the Application

### Terminal 1 - Backend Server
```bash
cd server
npm run dev
```

You should see:
```
Server running on port 5000
MongoDB connected: cluster0-xxxxx.mongodb.net (or 127.0.0.1)
```

### Terminal 2 - Frontend Client
```bash
cd client
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

## Step 4: Access the Application

Open your browser and navigate to: **http://localhost:5173**

## 🎯 Test User Creation

The application should allow you to:
1. Register a new user (Officer)
2. Login with credentials
3. Create cases
4. Upload documents with spotlight viewer
5. View audit trails

## 🛠️ Troubleshooting

### MongoDB Connection Failed
- **Atlas**: Check your IP whitelist and credentials
- **Local**: Ensure MongoDB service is running (`mongod --version`)

### Port Already in Use
- Backend (5000): Change `PORT` in `server/.env`
- Frontend (5173): Vite will automatically suggest another port

### Dependencies Issues
```bash
# Reinstall dependencies
cd server && rm -rf node_modules package-lock.json && npm install
cd ../client && rm -rf node_modules package-lock.json && npm install
```

## 📝 Default Test Credentials

After registering your first user, you can use those credentials. The system supports:
- **Roles**: Officer, Investigator, Admin, Forensic Analyst
- **Stations**: Multiple police stations for cross-station collaboration

## 🎬 Ready for Demo!

Once both servers are running, you can demonstrate:
1. ✅ Secure document upload with encryption
2. ✅ Spotlight viewer with forensic watermarking
3. ✅ Case management with filtering
4. ✅ Cross-station collaboration requests
5. ✅ Complete audit trail logging
