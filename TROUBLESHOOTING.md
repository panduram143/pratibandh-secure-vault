# 🔧 PRATIBANDH - Troubleshooting Guide

## Common Issues & Solutions

**Last Updated**: September 14, 2026

---

## 🗄️ Database Issues

### Issue 1: "MongoNetworkError: connect ECONNREFUSED"

**Symptoms**:
```
MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27017
```

**Causes**:
- Local MongoDB not running
- Wrong connection string
- MongoDB not installed

**Solutions**:

**Option A: Use MongoDB Atlas (Recommended)**
1. Go to https://account.mongodb.com/account/register
2. Create free cluster
3. Get connection string
4. Update `server/.env`:
```env
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/pratibandh
```

**Option B: Start Local MongoDB**
```bash
# Windows
net start MongoDB

# Or start manually
mongod --dbpath C:\data\db
```

**Option C: Install MongoDB**
```bash
winget install MongoDB.Server
mkdir C:\data\db
```

---

### Issue 2: "Authentication failed"

**Symptoms**:
```
MongoServerError: Authentication failed
```

**Causes**:
- Wrong username/password in connection string
- User not created in MongoDB Atlas

**Solutions**:
1. Check connection string format:
```
mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/pratibandh
```
2. Verify password doesn't contain special characters that need URL encoding
3. In MongoDB Atlas, check "Database Access" → verify user exists
4. If password has special chars, URL encode them:
   - `@` → `%40`
   - `#` → `%23`
   - `$` → `%24`

---

### Issue 3: "Network access denied"

**Symptoms**:
- Connection times out
- No error message, just hangs

**Solutions**:
1. In MongoDB Atlas, go to "Network Access"
2. Click "Add IP Address"
3. Choose "Allow Access from Anywhere" (0.0.0.0/0)
4. Wait 2-3 minutes for changes to take effect

---

## 🌐 Port Issues

### Issue 4: "EADDRINUSE: address already in use"

**Symptoms**:
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Causes**:
- Server already running in another terminal
- Another application using the port

**Solutions**:

**Option A: Kill the port**
```bash
# Windows
npx kill-port 5000
npx kill-port 3000

# Or manually
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Option B: Change the port**
In `server/.env`:
```env
PORT=5001
```

In `client/vite.config.js`:
```js
proxy: {
  '/api': {
    target: 'http://localhost:5001',
    changeOrigin: true,
  },
}
```

---

## 🔑 Authentication Issues

### Issue 5: "Invalid credentials" on login

**Symptoms**:
- Correct email/password doesn't work
- Error: "Invalid credentials"

**Causes**:
- User not registered
- Password doesn't match
- User account deactivated

**Solutions**:
1. Try registering a new account
2. Check if user exists in MongoDB:
```bash
# MongoDB Shell
use pratibandh
db.users.find({ email: "your@email.com" })
```
3. Check `isActive` field is `true`

---

### Issue 6: Automatic logout / "Token expired"

**Symptoms**:
- Redirected to login page unexpectedly
- Session doesn't persist

**Causes**:
- JWT token expired (24h default)
- Token not stored correctly
- Server restarted with different JWT_SECRET

**Solutions**:
1. Login again (normal if 24h passed)
2. Check localStorage in browser DevTools:
   - Should see `token` key
3. Ensure `JWT_SECRET` in `.env` doesn't change
4. Clear browser cache and localStorage:
```js
// Browser console
localStorage.clear()
```

---

### Issue 7: "Authorization header required"

**Symptoms**:
- 401 errors on protected routes
- "Authorization header required"

**Causes**:
- Token not being sent in requests
- Token format incorrect

**Solutions**:
1. Check browser DevTools → Network → Request Headers
2. Should see: `Authorization: Bearer <token>`
3. Verify `client/src/utils/api.js` interceptor is working
4. Try logout and login again

---

## 📦 Installation Issues

### Issue 8: "npm install" fails

**Symptoms**:
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solutions**:
```bash
# Clear cache
npm cache clean --force

# Delete node_modules and lock file
rm -rf node_modules package-lock.json

# Reinstall
npm install

# If still fails, use --legacy-peer-deps
npm install --legacy-peer-deps
```

---

### Issue 9: "Module not found"

**Symptoms**:
```
Error: Cannot find module 'express'
```

**Causes**:
- Dependencies not installed
- Wrong directory

**Solutions**:
```bash
# Make sure you're in the right directory
cd server  # or cd client
npm install

# Verify node_modules exists
ls node_modules
```

---

## 🖥️ Frontend Issues

### Issue 10: Blank page / "Cannot GET /"

**Symptoms**:
- Browser shows blank page
- Console shows no errors

**Causes**:
- Vite dev server not running
- Wrong URL

**Solutions**:
1. Check terminal - should see:
```
VITE v5.x.x  ready in XXX ms
➜  Local:   http://localhost:3000/
```
2. Make sure using correct URL: `http://localhost:3000`
3. Check browser console for errors (F12)
4. Try hard refresh: `Ctrl + Shift + R`

---

### Issue 11: "Proxy error" or API calls fail

**Symptoms**:
```
[vite] http proxy error: ECONNREFUSED
```

**Causes**:
- Backend not running
- Wrong proxy configuration

**Solutions**:
1. Start backend first: `cd server && npm run dev`
2. Wait for "Server running on port 5000"
3. Then start frontend: `cd client && npm run dev`
4. Check `client/vite.config.js` proxy target matches backend port

---

### Issue 12: Styles not loading / looks broken

**Symptoms**:
- No colors, plain HTML appearance
- Tailwind classes not working

**Causes**:
- Tailwind not configured
- CSS not imported

**Solutions**:
1. Check `client/src/index.css` is imported in `main.jsx`
2. Rebuild:
```bash
cd client
rm -rf dist node_modules
npm install
npm run dev
```

---

## 📤 File Upload Issues

### Issue 13: "File type not allowed"

**Symptoms**:
- Upload fails with file type error

**Causes**:
- File extension not in allowed list

**Solutions**:
1. Allowed types: `.pdf`, `.doc`, `.docx`, `.jpg`, `.jpeg`, `.png`, `.tiff`, `.txt`
2. Check file extension is correct
3. To add more types, edit `server/routes/documents.js`:
```js
const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.tiff', '.txt', '.mp4'];
```

---

### Issue 14: "File too large"

**Symptoms**:
- Upload fails for large files

**Causes**:
- File exceeds 50MB limit

**Solutions**:
1. Compress the file
2. To increase limit, edit `server/routes/documents.js`:
```js
limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
```

---

### Issue 15: Encryption fails / "Server error" on upload

**Symptoms**:
- File uploads but returns error
- Console shows encryption error

**Causes**:
- `ENCRYPTION_KEY` not set or wrong length
- Disk space full

**Solutions**:
1. Check `server/.env` has `ENCRYPTION_KEY` (32 characters)
2. Check disk space:
```bash
# Windows
dir C:\
```
3. Check server logs for specific error

---

## 👁️ Document Viewer Issues

### Issue 16: Document viewer shows blank canvas

**Symptoms**:
- Viewer loads but canvas is white/blank
- No document content visible

**Causes**:
- Document data not loading
- Canvas rendering error

**Solutions**:
1. Check browser console for errors
2. Check Network tab - verify `/api/documents/:id` returns data
3. Try different document
4. Check if zoom is too high/low
5. Refresh page

---

### Issue 17: Spotlight effect not working

**Symptoms**:
- Entire document visible
- No spotlight mask

**Causes**:
- Spotlight disabled
- JavaScript error

**Solutions**:
1. Click "Spotlight On" toggle button
2. Move mouse over canvas
3. Check browser console for errors
4. Try different browser (Chrome/Edge recommended)

---

### Issue 18: Watermark not visible

**Symptoms**:
- No user credentials shown on document

**Causes**:
- User data not loaded
- Canvas layer issue

**Solutions**:
1. Verify you're logged in
2. Check user has `name` and `badgeId`
3. Watermark is semi-transparent - look closely
4. Try zooming in

---

## 🔍 Search Issues

### Issue 19: Search returns no results

**Symptoms**:
- Search always shows "No results found"

**Causes**:
- No data in database
- Text indexes not created

**Solutions**:
1. Create some test cases/documents first
2. Check MongoDB text indexes exist:
```bash
# MongoDB Shell
use pratibandh
db.cases.getIndexes()
db.documents.getIndexes()
```
3. If no text index, restart server (indexes auto-create on model load)

---

### Issue 20: Search is slow

**Symptoms**:
- Search takes > 5 seconds

**Causes**:
- Large database without indexes
- MongoDB Atlas free tier limits

**Solutions**:
1. Verify text indexes exist (see above)
2. Upgrade MongoDB Atlas tier if needed
3. Add pagination to reduce result count

---

## 🔐 Security Issues

### Issue 21: "CORS error" in browser console

**Symptoms**:
```
Access to fetch at 'http://localhost:5000/api/...' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Causes**:
- CORS not configured correctly

**Solutions**:
1. Backend should already have `app.use(cors())`
2. If still happening, set specific origin:
```js
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

---

### Issue 22: Screenshot prevention not working

**Symptoms**:
- Can take full screenshots
- PrintScreen key works

**Causes**:
- Browser extensions override
- OS-level screenshot tools

**Solutions**:
1. The prevention is best-effort:
   - Blocks keyboard shortcuts
   - Canvas makes it harder
   - Watermark traces source
2. For demo, emphasize:
   - Spotlight limits what's visible
   - Watermark traces any capture
   - Audit log records all views

---

## 🚀 Performance Issues

### Issue 23: Application is slow

**Symptoms**:
- Pages take long to load
- Actions feel laggy

**Causes**:
- Slow internet connection
- MongoDB Atlas in distant region
- Too many console logs

**Solutions**:
1. Choose MongoDB Atlas region closest to you
2. Check network speed
3. In production, remove `console.log` statements
4. Enable browser cache

---

### Issue 24: Backend memory leak

**Symptoms**:
- Server slows down over time
- Eventually crashes with "Out of memory"

**Causes**:
- File uploads not cleaned up
- Too many connections

**Solutions**:
1. Restart server regularly
2. Clean up temp files periodically:
```bash
# Clean temp decrypted files
rm server/uploads/*.tmp
```
3. Use PM2 for production with auto-restart:
```bash
npm install -g pm2
pm2 start server/server.js
```

---

## 🧪 Development Issues

### Issue 25: Hot reload not working

**Symptoms**:
- Changes don't appear without manual refresh

**Causes**:
- Vite HMR issue
- File watcher limit reached

**Solutions**:
1. Check console for HMR errors
2. Restart dev server:
```bash
# Stop (Ctrl+C) and restart
npm run dev
```
3. Increase file watcher limit (Linux/Mac):
```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

### Issue 26: Environment variables not loading

**Symptoms**:
- `process.env.VARIABLE` is undefined
- Features using env vars don't work

**Causes**:
- `.env` file missing or in wrong location
- Server not restarted after .env change

**Solutions**:
1. Verify `.env` is in `server/` directory
2. Check `.env` format (no spaces around `=`):
```env
PORT=5000
MONGO_URI=mongodb://...
```
3. Restart server after any `.env` changes
4. Check `.env` is not `.env.txt` (wrong extension)

---

## 📱 Browser Compatibility

### Issue 27: Features not working in certain browsers

**Symptoms**:
- Canvas rendering broken
- Styles look different
- Features missing

**Supported Browsers**:
- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ❌ Internet Explorer (not supported)

**Solutions**:
1. Use Chrome or Edge for best experience
2. Update browser to latest version
3. Clear browser cache: `Ctrl + Shift + Delete`
4. Disable browser extensions that might interfere

---

## 🆘 Emergency Recovery

### "Nothing works!" - Nuclear Option

If everything is broken and you need to start fresh:

```bash
# Stop all running servers
# Press Ctrl+C in all terminal windows

# Backend fresh start
cd server
rm -rf node_modules package-lock.json
npm install
npm run dev

# Frontend fresh start (new terminal)
cd client
rm -rf node_modules package-lock.json dist
npm install
npm run dev

# If still broken, check MongoDB connection
# and verify .env file exists in server/ folder
```

---

## 📞 Getting Help

### Information to Gather Before Asking for Help

1. **Error Message**: Exact error text from console
2. **Browser**: Chrome/Firefox/Edge and version
3. **OS**: Windows/Mac/Linux
4. **Node Version**: Run `node --version`
5. **NPM Version**: Run `npm --version`
6. **Steps to Reproduce**: What did you do before error?
7. **Screenshots**: Of error and browser console (F12)
8. **Server Logs**: What's in the terminal running server?

### Quick Debug Checklist

```bash
# 1. Check MongoDB connection
# Should see: "MongoDB Connected" in server terminal

# 2. Check backend is running
# Visit: http://localhost:5000
# Should see: {"message": "PRATIBANDH API is running", "version": "1.0.0"}

# 3. Check frontend is running
# Visit: http://localhost:3000
# Should see login page

# 4. Check API proxy is working
# Open browser console
# Try logging in
# Check Network tab for /api/auth/login call

# 5. Check you can register a new user
# Fill registration form
# Submit
# Should redirect to dashboard

# If all above work, the app is functional!
```

---

## 🎓 Learning Resources

### Understanding the Codebase

**Backend**:
- `server/server.js` - Main entry point
- `server/routes/` - API endpoints
- `server/models/` - Database schemas
- `server/middleware/` - Auth & logging
- `server/utils/` - Helper functions

**Frontend**:
- `client/src/App.jsx` - Main component & routes
- `client/src/components/` - React components
- `client/src/context/` - Auth state management
- `client/src/utils/` - API client

### Key Concepts

**JWT Authentication**:
1. User logs in → server generates JWT token
2. Token stored in localStorage
3. Token sent with every API request
4. Server validates token before processing

**File Encryption**:
1. User uploads file
2. Server saves to `uploads/`
3. AES-256 encrypts file → `uploads/file.enc`
4. Original deleted
5. On download, decrypt to temp file → serve → delete temp

**Canvas Rendering**:
1. Document data loaded via API
2. JavaScript draws text on canvas
3. Spotlight mask drawn over canvas
4. Watermark drawn with user credentials
5. Result: screenshot-resistant viewer

---

## ✅ Prevention Tips

### To Avoid Common Issues

1. **Always start backend before frontend**
2. **Keep MongoDB Atlas cluster active** (don't let it pause)
3. **Don't commit `.env` to git** (contains secrets)
4. **Restart servers after .env changes**
5. **Use consistent Node.js version** (v18+ recommended)
6. **Keep dependencies up to date**: `npm outdated`
7. **Check disk space** before large uploads
8. **Use proper MongoDB connection string format**
9. **Don't change JWT_SECRET** after users registered
10. **Test in Chrome/Edge** for best compatibility

---

**Last Updated**: September 14, 2026
**Need more help?** Check other documentation files:
- `IMPLEMENTATION_SUMMARY.md` - Technical details
- `DEMO_GUIDE.md` - Demo walkthrough
- `FEATURES_CHECKLIST.md` - Feature list

🚀 **Good luck with your demo!**
