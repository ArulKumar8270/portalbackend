# Nginx WebSocket Configuration for admin.nicknameportal.shop

## 🔴 Current Issue

WebSocket connection to `wss://admin.nicknameportal.shop/socket.io/` is failing because Nginx is not configured to handle WebSocket upgrades.

---

## ✅ Required Nginx Configuration

Add this to your Nginx server block for `admin.nicknameportal.shop`:

```nginx
server {
    listen 443 ssl http2;
    server_name admin.nicknameportal.shop;

    # Your existing SSL configuration
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Main application proxy (port 5000)
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        
        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket upgrade headers (IMPORTANT for Socket.IO)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        
        # Timeouts
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        
        # Disable buffering
        proxy_buffering off;
    }

    # WebSocket/Socket.IO specific location
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        
        # CRITICAL: WebSocket upgrade headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket timeouts (very long for persistent connections)
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        
        # Disable buffering for WebSocket
        proxy_buffering off;
        
        # Allow large request bodies (if needed)
        client_max_body_size 50M;
    }

    # API routes (if needed separately)
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Map for WebSocket upgrade detection
# Add this in the http block (outside server blocks, at the top level)
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}
```

---

## 📝 Step-by-Step Instructions

### Step 1: Edit Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/admin.nicknameportal.shop
# or
sudo nano /etc/nginx/conf.d/admin.nicknameportal.shop.conf
```

### Step 2: Add the Map Block

If not already present, add this at the top of your Nginx config (in the `http` block):

```nginx
http {
    # ... other http block settings ...
    
    # Map for WebSocket upgrade
    map $http_upgrade $connection_upgrade {
        default upgrade;
        '' close;
    }
    
    # ... rest of config ...
}
```

### Step 3: Update Server Block

Add the `/socket.io/` location block to your server configuration as shown above.

### Step 4: Test Configuration

```bash
sudo nginx -t
```

You should see:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Step 5: Reload Nginx

```bash
sudo systemctl reload nginx
# or
sudo service nginx reload
```

---

## 🔍 Verify It's Working

### 1. Check Server Logs

After reloading, check your Node.js server logs. You should see:
```
[WebSocket] Integrated on main server (port 5000)
[WebSocket] Connect to: https://admin.nicknameportal.shop/socket.io
```

### 2. Test Connection in Browser

Open browser console and run:
```javascript
const socket = io('https://admin.nicknameportal.shop', {
  path: '/socket.io',
  transports: ['websocket', 'polling']
});

socket.on('connect', () => {
  console.log('✅ Connected!', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error);
});
```

### 3. Check Nginx Error Logs

```bash
sudo tail -f /var/log/nginx/error.log
```

Look for any WebSocket-related errors.

### 4. Check Nginx Access Logs

```bash
sudo tail -f /var/log/nginx/access.log | grep socket.io
```

You should see requests to `/socket.io/` with status 101 (Switching Protocols) for successful WebSocket upgrades.

---

## 🐛 Common Issues

### Issue 1: "502 Bad Gateway"

**Cause:** Backend server not running or wrong port

**Fix:**
```bash
# Check if server is running
ps aux | grep node

# Check if port 5000 is listening
netstat -tulpn | grep 5000
```

### Issue 2: "404 Not Found"

**Cause:** Location block path doesn't match

**Fix:** Ensure location is `/socket.io/` (with trailing slash) and frontend uses `path: '/socket.io'`

### Issue 3: "Connection closed before upgrade"

**Cause:** Missing or incorrect upgrade headers

**Fix:** Verify these headers are present:
```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

### Issue 4: "Timeout"

**Cause:** Timeout too short

**Fix:** Increase timeouts:
```nginx
proxy_read_timeout 86400;
proxy_send_timeout 86400;
```

---

## 🔐 Security Considerations

### Restrict Origins (Optional but Recommended)

```nginx
location /socket.io/ {
    # ... existing config ...
    
    # Add origin validation
    if ($http_origin !~* ^https://admin\.nicknameportal\.shop$) {
        return 403;
    }
}
```

### Rate Limiting (Optional)

```nginx
limit_req_zone $binary_remote_addr zone=ws_limit:10m rate=10r/s;

location /socket.io/ {
    limit_req zone=ws_limit burst=20;
    # ... rest of config ...
}
```

---

## 📊 Testing Checklist

- [ ] Nginx configuration syntax is valid (`nginx -t`)
- [ ] Nginx reloaded successfully
- [ ] Backend server is running on port 5000
- [ ] Map block added to http context
- [ ] `/socket.io/` location block added
- [ ] Upgrade headers present in location block
- [ ] Timeouts configured (86400 seconds)
- [ ] Browser console shows successful connection
- [ ] Server logs show client connected
- [ ] Nginx access logs show 101 status for WebSocket

---

## 🚀 Quick Test Command

```bash
# Test WebSocket endpoint
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: test" \
  https://admin.nicknameportal.shop/socket.io/?EIO=4&transport=websocket
```

You should see a `101 Switching Protocols` response if WebSocket upgrade is working.

---

**Last Updated:** January 3, 2025

