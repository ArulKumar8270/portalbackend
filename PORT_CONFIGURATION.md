# Port Configuration Guide

## 🔍 Current Setup

- **Mail Server:** Running on port 5000 at `https://nicknameinfo.net/api`
- **Main Express App (Nickname_portal):** Currently configured for port 5000 (CONFLICT!)
- **WebSocket Server:** Needs a port

---

## ✅ Solution Options

### Option 1: Use Separate Port for WebSocket (Recommended)

Keep WebSocket on port 3001 (as originally planned) and update Nginx accordingly.

**Backend stays as-is:**
- Main Express app: Port 5000 (but this conflicts with mail server!)
- WebSocket: Port 3001 (separate server)

**Nginx config:**
```nginx
location /socket.io/ {
    proxy_pass http://localhost:3001;  # Keep as 3001
    # ... rest of config
}
```

### Option 2: Change Main App Port

If your main Express app (Nickname_portal) should be on a different port:

**Update `src/index.js`:**
```javascript
const PORT = 8000;  // Or whatever port you want
```

**Update Nginx:**
```nginx
location / {
    proxy_pass http://localhost:8000;  # Update to match
    # ... rest of config
}

location /socket.io/ {
    proxy_pass http://localhost:8000;  # Same port if integrated
    # ... rest of config
}
```

### Option 3: Integrate WebSocket on Main App Port

If your main Express app is on a different port (not 5000), integrate WebSocket there.

---

## ❓ Questions to Clarify

1. **What port is your main Express app (Nickname_portal) running on?**
   - Is it also on port 5000? (conflicts with mail server)
   - Or is it on a different port?

2. **What's your Nginx configuration for the main app?**
   - Which location block handles `admin.nicknameportal.shop`?
   - What port does it proxy to?

---

## 🔧 Recommended Fix

Since your Nginx already has `/socket.io/` pointing to port 3001, let's use that:

### Step 1: Revert to Separate WebSocket Server

Update `src/index.js` to use the separate WebSocket server on port 3001:

```javascript
// Remove the integrated Socket.IO setup
// Keep the separate WebSocket server
const { startWebSocketServer, stopWebSocketServer } = require("./websocket-server");

// Start WebSocket server on port 3001
try {
  startWebSocketServer();
  console.log('WebSocket server started on port 3001');
} catch (error) {
  console.error('Failed to start WebSocket server:', error);
}
```

### Step 2: Keep Nginx Config as Is

Your existing Nginx config is correct:
```nginx
location /socket.io/ {
    proxy_pass http://localhost:3001;  # ✅ This is correct
    # ... rest of config
}
```

### Step 3: Update Main App Port (if needed)

If your main Express app needs to be on a different port (not 5000):

```javascript
const PORT = 8000;  // Or your preferred port
```

---

## 📋 Current Status

Based on your setup:
- ✅ Mail server: Port 5000 (`nicknameinfo.net`)
- ❓ Main Express app: Port ??? (needs clarification)
- ✅ WebSocket: Port 3001 (via separate server)

**Please confirm:**
1. What port is your main Express app (Nickname_portal) running on?
2. Should we keep WebSocket on port 3001 as separate server?

---

**Last Updated:** January 3, 2025


