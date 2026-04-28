const redis = require('redis');

let client = null;
let isConnected = false;

// Only create client if Redis is enabled via environment variable
if (process.env.REDIS_ENABLED === 'true') {
  try {
    client = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      socket: {
        connectTimeout: 2000,
        reconnectStrategy: false
      }
    });

    client.on('error', (err) => {
      console.warn('Redis Client Error:', err.message);
      isConnected = false;
    });

    client.on('connect', () => {
      console.log('Redis connected');
      isConnected = true;
    });

    client.connect().catch(() => {
      console.warn('Redis connection failed. Running without cache.');
      isConnected = false;
    });
  } catch (err) {
    console.warn('Redis initialization failed:', err.message);
  }
} else {
  console.log('Redis disabled. Set REDIS_ENABLED=true to enable caching.');
}

const redisHelpers = {
  async get(key) {
    if (!isConnected || !client) return null;
    try {
      return await client.get(key);
    } catch (err) {
      return null;
    }
  },

  async setex(key, duration, value) {
    if (!isConnected || !client) return false;
    try {
      await client.setEx(key, duration, value);
      return true;
    } catch (err) {
      return false;
    }
  },

  isAvailable() {
    return isConnected && client !== null;
  }
};

module.exports = redisHelpers;
