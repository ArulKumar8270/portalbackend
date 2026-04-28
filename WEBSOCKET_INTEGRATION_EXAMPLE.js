/**
 * Example: How to integrate WebSocket into main Express server
 * 
 * This approach runs WebSocket on the same port as your Express app,
 * eliminating the need for a separate port and reverse proxy configuration.
 * 
 * Update your src/index.js to use this approach.
 */

const express = require('express');
const { Server } = require('socket.io');
const { setupSocketIO } = require('./src/websocket-server');

const app = express();
const PORT = 5000;

// ... your existing middleware ...

// Create HTTP server
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

console.log('WebSocket integrated on same server');

// Frontend connection:
// const socket = io('https://admin.nicknameportal.shop', {
//   path: '/socket.io',
//   transports: ['websocket', 'polling']
// });

