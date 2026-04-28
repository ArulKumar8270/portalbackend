/**
 * Standalone WebSocket Server for Barcode Scanning
 * 
 * This can be run independently if you want to separate WebSocket server
 * from the main Express API server.
 * 
 * Usage:
 *   node websocket-server.js
 * 
 * Or with nodemon:
 *   nodemon websocket-server.js
 */

// Import the WebSocket server module
const { startWebSocketServer } = require('./src/websocket-server');

// Start the server
console.log('Starting standalone WebSocket server...');
startWebSocketServer();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  const { stopWebSocketServer } = require('./src/websocket-server');
  stopWebSocketServer().then(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  const { stopWebSocketServer } = require('./src/websocket-server');
  stopWebSocketServer().then(() => process.exit(0));
});

