# Nginx Configuration Update for WebSocket

## 🔧 Required Changes

Your existing Nginx config has `/socket.io/` pointing to port 3001, but the WebSocket is now integrated into the main server on port 5000.

---

## ✅ Updated Configuration

### Step 1: Add Map Block (if not already present)

Add this in your `http` block (usually in `/etc/nginx/nginx.conf`):

```nginx
http {
    # Add this map block for WebSocket upgrade
    map $http_upgrade $connection_upgrade {
        default upgrade;
        '' close;
    }
    
    # ... rest of your http block ...
}
```

### Step 2: Update Your Server Block

Here's your updated configuration with the fix:

```nginx
server {
    # ... your existing server configuration ...

    location / {
        # First attempt to serve request as file, then
        # as directory, then fall back to displaying a 404.
        proxy_pass http://localhost:5000; #whatever port your app runs on
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Add these for better WebSocket support
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    location /SchoolManagement/ {
        # First attempt to serve request as file, then
        # as directory, then fall back to displaying a 404.
        rewrite ^/SchoolManagement/(.*)$ /$1 break;
        proxy_pass http://localhost:8000;
    }

    location /corpculture/ {
        # First attempt to serve request as file, then
        # as directory, then fall back to displaying a 404.
        rewrite ^/corpculture/(.*)$ /$1 break;
        proxy_pass http://localhost:9000;
    }

    location /timesheet/ {
        # First attempt to serve request as file, then
        # as directory, then fall back to displaying a 404.
        rewrite ^/timesheet/(.*)$ /$1 break;
        proxy_pass http://localhost:10000;
    }

    location /Reacharge_Portal/ {
        # First attempt to serve request as file, then
        # as directory, then fall back to displaying a 404.
        rewrite ^/Reacharge_Portal/(.*)$ /$1 break;
        proxy_pass http://localhost:10001;
    }

    # ✅ UPDATED: Changed from port 3001 to 5000
    location /socket.io/ {
        proxy_pass http://localhost:5000;  # Changed from 3001 to 5000
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;  # Added send timeout
        proxy_buffering off;
    }
}
```

---

## 🔑 Key Changes

1. **Changed port from 3001 to 5000** in `/socket.io/` location block
2. **Added `proxy_send_timeout 86400`** for better WebSocket stability
3. **Added map block** for `$connection_upgrade` variable (if not already present)

---

## 📝 Step-by-Step Instructions

### 1. Edit Your Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/admin.nicknameportal.shop
# or wherever your config file is located
```

### 2. Update the `/socket.io/` Location Block

Change this line:
```nginx
proxy_pass http://localhost:3001;  # ❌ OLD
```

To:
```nginx
proxy_pass http://localhost:5000;  # ✅ NEW
```

### 3. Add Map Block (if missing)

Check if you have this in your `http` block:
```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}
```

If not, add it to `/etc/nginx/nginx.conf` in the `http` block.

### 4. Test Configuration

```bash
sudo nginx -t
```

You should see:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 5. Reload Nginx

```bash
sudo systemctl reload nginx
# or
sudo service nginx reload
```

---

## ✅ Verification

After updating, test the connection:

1. **Check Server Logs:**
   ```bash
   # Should see:
   [WebSocket] Integrated on main server (port 5000)
   [WebSocket] Client connected: <socket-id>
   ```

2. **Test in Browser Console:**
   ```javascript
   const socket = io('https://admin.nicknameportal.shop', {
     path: '/socket.io',
     transports: ['websocket', 'polling']
   });
   
   socket.on('connect', () => {
     console.log('✅ Connected!', socket.id);
   });
   ```

3. **Check Nginx Access Logs:**
   ```bash
   sudo tail -f /var/log/nginx/access.log | grep socket.io
   ```
   
   Should see `101 Switching Protocols` for successful WebSocket connections.

---

## 🐛 Troubleshooting

### If connection still fails:

1. **Verify backend is running:**
   ```bash
   ps aux | grep node
   netstat -tulpn | grep 5000
   ```

2. **Check Nginx error logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

3. **Verify the map block exists:**
   ```bash
   grep -r "connection_upgrade" /etc/nginx/
   ```

4. **Test WebSocket endpoint directly:**
   ```bash
   curl -i -N \
     -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Version: 13" \
     -H "Sec-WebSocket-Key: test" \
     https://admin.nicknameportal.shop/socket.io/?EIO=4&transport=websocket
   ```

---

## 📋 Quick Checklist

- [ ] Map block added to `http` context (if missing)
- [ ] `/socket.io/` location block updated to port 5000
- [ ] `proxy_send_timeout 86400` added
- [ ] Nginx configuration tested (`nginx -t`)
- [ ] Nginx reloaded
- [ ] Backend server running on port 5000
- [ ] Tested connection in browser

---

**Last Updated:** January 3, 2025

