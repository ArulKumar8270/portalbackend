# WebSocket Connection Error - Troubleshooting Guide

## 🔴 Error: `TransportError: websocket error`

This error occurs when the frontend cannot establish a WebSocket connection to the server.

---

## ✅ Quick Fixes

### Fix 1: Check Frontend Connection URL

**Problem:** Frontend is connecting to `http://localhost:3001` instead of production URL.

**Solution:** Update your frontend WebSocket client:

```javascript
// ❌ WRONG - Direct connection to port 3001
const socket = io('http://localhost:3001');

// ✅ CORRECT - Connect through same domain
const socket = io('https://admin.nicknameportal.shop', {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  secure: true
});
```

### Fix 2: Configure Nginx Reverse Proxy

Add this to your Nginx configuration:

```nginx
location /socket.io/ {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 86400;
    proxy_buffering off;
}
```

Then reload Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Fix 3: Use Same Port (Recommended)

Instead of running WebSocket on a separate port, integrate it into your main Express server.

**Update `src/index.js`:**

```javascript
const { Server } = require('socket.io');
const { restRouter } = require("./api");
// ... other imports

const app = appManager.setup(config);
const PORT = 5000;

// ... middleware setup ...

app.use("/api", restRouter);

// Create HTTP server
const server = app.listen(PORT, () => {
  console.log(`Server is running at PORT http://localhost:${PORT}`);
});

// Initialize Socket.IO on same server
const io = new Server(server, {
  cors: {
    origin: ['https://admin.nicknameportal.shop', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  path: '/socket.io',
  transports: ['websocket', 'polling']
});

// Use the WebSocket server logic from websocket-server.js
require('./websocket-server').setupSocketIO(io);
```

**Update frontend:**
```javascript
const socket = io('https://admin.nicknameportal.shop', {
  path: '/socket.io',
  transports: ['websocket', 'polling']
});
```

---

## 🔍 Diagnostic Steps

### Step 1: Check WebSocket Server is Running

```bash
# Check if port 3001 is listening
netstat -tulpn | grep 3001
# or
ss -tulpn | grep 3001

# Check server logs
tail -f /path/to/your/app.log | grep WebSocket
```

### Step 2: Test Health Endpoint

```bash
# Test health endpoint
curl http://localhost:3001/health

# Should return:
# {"status":"ok","lastBarcode":"","timestamp":null,"connectedClients":0}
```

### Step 3: Test Through Nginx

```bash
# Test health through Nginx
curl https://admin.nicknameportal.shop/ws-health

# Test WebSocket endpoint
curl https://admin.nicknameportal.shop/socket.io/
```

### Step 4: Check Browser Console

Open DevTools → Network tab → Filter by "WS" (WebSocket)

Look for:
- **Status 101** = Connection successful
- **Status 400/404** = Wrong URL or path
- **Status 502** = Nginx can't reach backend
- **Mixed Content** = HTTP on HTTPS page

### Step 5: Check Server Logs

Look for these log messages:
```
[WebSocket] Connection attempt from origin: https://admin.nicknameportal.shop
[WebSocket] Client connected: <socket-id>
```

If you see:
```
[WebSocket] CORS blocked origin: ...
```
→ Update `WS_ALLOWED_ORIGINS` in `.env`

---

## 🐛 Common Issues

### Issue 1: "Mixed Content" Error

**Cause:** HTTPS page trying to connect to HTTP WebSocket

**Fix:** 
- Use `wss://` (secure WebSocket) or
- Connect through same domain: `https://admin.nicknameportal.shop`

### Issue 2: "Connection Refused"

**Cause:** WebSocket server not running or wrong port

**Fix:**
```bash
# Check if server is running
ps aux | grep node

# Check if port is open
netstat -tulpn | grep 3001
```

### Issue 3: "404 Not Found"

**Cause:** Nginx path doesn't match Socket.IO path

**Fix:** Ensure Nginx location is `/socket.io/` and frontend uses `path: '/socket.io'`

### Issue 4: "CORS Error"

**Cause:** Origin not in allowed list

**Fix:** Add to `.env`:
```bash
WS_ALLOWED_ORIGINS=https://admin.nicknameportal.shop
```

### Issue 5: "Transport Error"

**Cause:** WebSocket upgrade failed or connection timeout

**Fix:**
1. Check Nginx proxy headers (Upgrade, Connection)
2. Increase timeout in Nginx:
   ```nginx
   proxy_read_timeout 86400;
   proxy_send_timeout 86400;
   ```
3. Check firewall rules

---

## 📋 Checklist

- [ ] WebSocket server is running (check logs)
- [ ] Port 3001 is listening (netstat/ss)
- [ ] Nginx reverse proxy configured
- [ ] Nginx reloaded after config changes
- [ ] Frontend connects to `https://admin.nicknameportal.shop` (not localhost:3001)
- [ ] Frontend uses `path: '/socket.io'`
- [ ] CORS allows production domain
- [ ] No firewall blocking port 3001
- [ ] SSL certificate valid
- [ ] Browser console shows connection attempt

---

## 🚀 Recommended Solution

**For production, use the same port approach:**

1. Integrate WebSocket into main Express server (port 5000)
2. Frontend connects to `https://admin.nicknameportal.shop/socket.io`
3. No separate port needed
4. No reverse proxy configuration needed
5. Simpler and more secure

---

## 📞 Still Not Working?

1. **Check server logs** for connection attempts
2. **Check browser Network tab** for WebSocket connection
3. **Test with curl/wscat** to isolate frontend issues
4. **Verify Nginx configuration** syntax
5. **Check firewall** rules

---

**Last Updated:** January 3, 2025

