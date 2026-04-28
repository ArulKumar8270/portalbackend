# WebSocket Production Setup Guide

## 🔧 Issue: WebSocket Not Working on HTTPS Site

When your site uses HTTPS (`https://admin.nicknameportal.shop/`), WebSocket connections **must** use WSS (WebSocket Secure). The WebSocket server also needs to be accessible through the same domain via a reverse proxy.

---

## ✅ Solution: Configure Nginx Reverse Proxy

### Step 1: Update Nginx Configuration

Add this configuration to your Nginx server block for `admin.nicknameportal.shop`:

```nginx
server {
    listen 443 ssl http2;
    server_name admin.nicknameportal.shop;

    # SSL configuration (your existing SSL settings)
    ssl_certificate /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/key.pem;

    # Your existing location blocks for the main app
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket proxy configuration
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
        
        # WebSocket specific timeouts
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        
        # Disable buffering for WebSocket
        proxy_buffering off;
    }

    # Health check endpoint (optional)
    location /ws-health {
        proxy_pass http://localhost:3001/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Step 2: Reload Nginx

```bash
sudo nginx -t  # Test configuration
sudo systemctl reload nginx  # Reload Nginx
```

---

## 🔄 Alternative: Use Same Port with Path-Based Routing

If you prefer to run WebSocket on the same port as your main app:

### Option A: Integrate WebSocket into Main Express Server

Update your frontend to connect to:
```javascript
const socket = io('https://admin.nicknameportal.shop', {
  path: '/socket.io',
  transports: ['websocket', 'polling']
});
```

### Option B: Use Subdomain

Create a subdomain like `ws.nicknameportal.shop` and point it to port 3001.

---

## 🌐 Frontend Configuration

### Update WebSocket Client URL

In your frontend code, update the WebSocket connection:

```javascript
// Production
const WS_URL = process.env.NODE_ENV === 'production'
  ? 'https://admin.nicknameportal.shop'  // Use same domain
  : 'http://localhost:3001';  // Development

const socket = io(WS_URL, {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  secure: true,  // Use WSS in production
  rejectUnauthorized: false  // Only if using self-signed cert
});
```

---

## 🔍 Troubleshooting

### 1. Check WebSocket Server is Running

```bash
# Check if port 3001 is listening
netstat -tulpn | grep 3001
# or
ss -tulpn | grep 3001
```

### 2. Test WebSocket Connection

```bash
# Test health endpoint
curl https://admin.nicknameportal.shop/ws-health

# Test WebSocket (using wscat)
npm install -g wscat
wscat -c wss://admin.nicknameportal.shop/socket.io/?EIO=4&transport=websocket
```

### 3. Check Browser Console

Open browser DevTools → Console and look for:
- `Mixed Content` errors (HTTP content on HTTPS page)
- `WebSocket connection failed` errors
- CORS errors

### 4. Check Nginx Logs

```bash
# Check error logs
sudo tail -f /var/log/nginx/error.log

# Check access logs
sudo tail -f /var/log/nginx/access.log
```

### 5. Verify SSL Certificate

```bash
# Check SSL certificate
openssl s_client -connect admin.nicknameportal.shop:443 -showcerts
```

---

## 🔐 Environment Variables

Add to your `.env` file:

```bash
# WebSocket Configuration
WS_PORT=3001
NODE_ENV=production
WS_USE_HTTPS=false  # Set to true if using direct HTTPS (not recommended, use reverse proxy)
WS_ALLOWED_ORIGINS=https://admin.nicknameportal.shop,https://www.nicknameportal.shop
```

---

## 📝 Quick Fix Checklist

- [ ] Nginx reverse proxy configured for `/socket.io/`
- [ ] WebSocket server running on port 3001
- [ ] Frontend connecting to `https://admin.nicknameportal.shop` (not `http://localhost:3001`)
- [ ] Frontend using `path: '/socket.io'` in Socket.IO client
- [ ] CORS allows production domain
- [ ] Nginx reloaded after configuration changes
- [ ] Firewall allows port 3001 (if not using reverse proxy)
- [ ] SSL certificate valid and not expired

---

## 🚀 Recommended Production Setup

1. **Use Reverse Proxy** (Nginx) - Most secure and flexible
2. **Same Domain** - Connect to `https://admin.nicknameportal.shop` with path `/socket.io`
3. **WSS Protocol** - Automatically handled by reverse proxy
4. **CORS Configuration** - Allow only your production domain

---

## 📞 Common Errors and Solutions

### Error: "Mixed Content"
**Solution:** Ensure WebSocket uses `wss://` not `ws://` when page is HTTPS

### Error: "Connection refused"
**Solution:** 
- Check WebSocket server is running
- Verify Nginx proxy_pass points to correct port
- Check firewall rules

### Error: "CORS policy"
**Solution:** 
- Update `WS_ALLOWED_ORIGINS` in `.env`
- Verify Nginx CORS headers (if configured)

### Error: "404 Not Found"
**Solution:** 
- Check Nginx location block path matches Socket.IO path
- Verify `proxy_pass` URL is correct

---

**Last Updated:** January 3, 2025

