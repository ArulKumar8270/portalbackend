const redis = require('../config/redis');

const cacheMiddleware = (duration = 300) => { // 5 minutes default
  return async (req, res, next) => {
    // Skip caching if Redis is not available
    if (!redis.isAvailable || !redis.isAvailable()) {
      return next();
    }

    const key = `cache:${req.originalUrl}:${JSON.stringify(req.query)}`;
    
    try {
      const cached = await redis.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
      
      // Store original json function
      const originalJson = res.json.bind(res);
      res.json = function(data) {
        // Try to cache, but don't block if it fails
        redis.setex(key, duration, JSON.stringify(data)).catch(() => {
          // Silently fail - response still sent
        });
        originalJson(data);
      };
      
      next();
    } catch (err) {
      console.warn('Cache middleware error:', err.message);
      next(); // Continue without cache on error
    }
  };
};

module.exports = { cacheMiddleware };
