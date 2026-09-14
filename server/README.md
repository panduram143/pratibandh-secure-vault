# PRATIBANDH Backend

Secure Digital Document Management System for Legal/Investigation Documents (SIH Hackathon Project)

## Setup

1. Install dependencies:
```bash
cd server
npm install
```

2. Configure MongoDB Atlas:
   - Create a MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
   - Create a new cluster
   - Get your connection string
   - Update `.env` file with your credentials

3. Update `.env` file:
```
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/pratibandh?retryWrites=true&w=majority
JWT_SECRET=pratibandh_secure_key_2024_sih
ENCRYPTION_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

4. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/me` - Update profile

### Cases
- `POST /api/cases` - Create new case
- `GET /api/cases` - List cases (with filters)
- `GET /api/cases/:id` - Get single case
- `PUT /api/cases/:id` - Update case
- `DELETE /api/cases/:id` - Close case (admin only)
- `POST /api/cases/:id/share` - Share case with another station
- `GET /api/cases/search` - Search cases

### Documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents` - List documents
- `GET /api/documents/:id` - Get document details
- `GET /api/documents/:id/download` - Download document
- `DELETE /api/documents/:id` - Delete document (admin only)
- `GET /api/documents/search` - Search documents

### Audit Logs
- `GET /api/audit` - List audit logs (admin only)
- `GET /api/audit/user/:userId` - Get user actions
- `GET /api/audit/document/:docId` - Get document history

## Features

- User authentication with JWT
- Role-based access control
- File encryption (AES-256)
- Document version tracking
- Case management
- Inter-station case sharing
- Comprehensive audit logging
- Real-time notifications (Socket.IO)
- Full-text search
- Secure file uploads

## User Roles

- `super_admin` - Full system access
- `station_admin` - Station-level administration
- `officer` - Police officer
- `court_official` - Court staff
- `forensic_expert` - Forensic personnel
- `viewer` - Read-only access

## Tech Stack

- Node.js + Express
- MongoDB Atlas (Cloud Database)
- JWT Authentication
- Socket.IO (Real-time)
- Multer (File uploads)
- bcryptjs (Password hashing)
- crypto (File encryption)
