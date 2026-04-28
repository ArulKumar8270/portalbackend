# WebSocket Frontend Connection Fix

## 🔴 Error: `WebSocket connection to 'wss://admin.nicknameportal.shop:3001/socket.io/' failed`

**Problem:** Frontend is trying to connect directly to port 3001, which is not exposed through your reverse proxy.

---

## ✅ Solution: Remove Port Number

### Update Frontend Connection

**❌ WRONG:**
```javascript
const socket = io('https://admin.nicknameportal.shop:3001', {
  path: '/socket.io',
  transports: ['websocket', 'polling']
});
```

**✅ CORRECT:**
```javascript
// Remove :3001 - connect through same domain
const socket = io('https://admin.nicknameportal.shop', {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  secure: true
});
```

---

## 🔧 Two Options to Fix

### Option 1: Configure Nginx to Proxy WebSocket (Keep Port 3001)

Add this to your Nginx configuration for `admin.nicknameportal.shop`:

```nginx
server {
    listen 443 ssl http2;
    server_name admin.nicknameportal.shop;

    # Your existing SSL and other config...

    # WebSocket proxy - IMPORTANT: No trailing slash in proxy_pass
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        
        # WebSocket upgrade headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket timeouts
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        
        # Disable buffering
        proxy_buffering off;
    }

    # Your existing location / block for main app
    location / {
        proxy_pass http://localhost:5000;
        # ... your existing proxy settings
    }
}
```

**Then update frontend:**
```javascript
const socket = io('https://admin.nicknameportal.shop', {
  path: '/socket.io',
  transports: ['websocket', 'polling']
});
```

**Reload Nginx:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

### Option 2: Integrate WebSocket into Main Server (Recommended)

This runs WebSocket on the same port (5000) as your Express app, eliminating the need for port 3001.

**Update `src/index.js`:**

```javascript
require("dotenv/config");
const { restRouter } = require("./api");
const config = require("./config");
const appManager = require("./app");
require("./errors");
const scheduler = require("./scheduler");
const path = require("path");
const cors = require("cors");
const db = require("./models");
const { apiRateLimiter } = require("./middleware/rateLimiter");
const { securityValidator } = require("./middleware/securityValidator");
const { Server } = require('socket.io');
const { setupSocketIO } = require("./websocket-server");
global.appRoot = path.resolve(__dirname);
const express = require('express');
const PORT = 5000;
const app = appManager.setup(config);

/*cors handling*/
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.options("*", cors());

app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

/* Route handling */
app.use("/api", restRouter);

app.use((req, res, next) => {
  next(new RequestError("Invalid route", 404));
});

app.use((error, req, res, next) => {
  if (!(error instanceof RequestError)) {
    error = new RequestError("Some Error Occurred", 500, error.message);
  }
  error.status = error.status || 500;
  res.status(error.status);
  
  return res.json({ 
    success: false,
    errors: error.errorList || [error.message || "An error occurred"],
    status: error.status
  });
});

/* Start Listening service */
const server = app.listen(PORT, () => {
  console.log(`Server is running at PORT http://localhost:${PORT}`);
});

// Initialize Socket.IO on the same server
const io = new Server(server, {
  cors: {
    origin: [
      'https://admin.nicknameportal.shop',
      'http://localhost:5173',
      'http://localhost:3000'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  },
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000
});

// Setup WebSocket handlers
setupSocketIO(io);
console.log('WebSocket integrated on same server (port 5000)');

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
```

**Update frontend:**
```javascript
const socket = io('https://admin.nicknameportal.shop', {
  path: '/socket.io',
  transports: ['websocket', 'polling']
});
```

**Benefits:**
- ✅ No separate port needed
- ✅ No Nginx WebSocket configuration needed
- ✅ Simpler setup
- ✅ Same domain, same port

---

## 🔍 Verify the Fix

### 1. Check Browser Console

After updating, you should see:
- ✅ Connection successful (no errors)
- ✅ `[WebSocket] Client connected` in server logs

### 2. Test Connection

```javascript
// In browser console
const socket = io('https://admin.nicknameportal.shop', {
  path: '/socket.io',
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('✅ Connected!');
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error);
});
```

### 3. Check Server Logs

You should see:
```
[WebSocket] Connection attempt from origin: https://admin.nicknameportal.shop
[WebSocket] Client connected: <socket-id>
```

---

## 📝 Quick Checklist

- [ ] Frontend connects to `https://admin.nicknameportal.shop` (no port number)
- [ ] Frontend uses `path: '/socket.io'`
- [ ] Nginx configured to proxy `/socket.io/` to `http://localhost:3001` (if using Option 1)
- [ ] OR WebSocket integrated into main server on port 5000 (if using Option 2)
- [ ] Nginx reloaded after configuration changes
- [ ] Server logs show connection attempts

---

## 🚀 Recommended: Use Option 2

**Option 2 (integrated)** is recommended because:
- Simpler configuration
- No separate port management
- Works automatically with your existing Nginx setup
- Less moving parts = fewer things to break

---

**Last Updated:** January 3, 2025

