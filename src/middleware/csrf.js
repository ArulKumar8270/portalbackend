/**
 * CSRF Protection Middleware
 * Protects against Cross-Site Request Forgery attacks
 */

const crypto = require('crypto');

/**
 * Generate a secure random token
 */
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * CSRF Token Generator Middleware
 * Generates and stores CSRF token in session
 */
exports.generateToken = (req, res, next) => {
  // Generate token if it doesn't exist or is expired
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateToken();
  }
  
  // Make token available to views/responses
  res.locals.csrfToken = req.session.csrfToken;
  
  // Also send token in response header for API clients
  res.setHeader('X-CSRF-Token', req.session.csrfToken);
  
  next();
};

/**
 * CSRF Token Validator Middleware
 * Validates CSRF token on state-changing requests
 */
exports.validateToken = (req, res, next) => {
  // Only validate state-changing methods
  const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  
  if (!stateChangingMethods.includes(req.method)) {
    return next(); // Skip validation for GET, HEAD, OPTIONS
  }

  // Skip validation for certain endpoints (e.g., webhooks, public APIs)
  const skipPaths = [
    '/api/webhook', // Add webhook paths that should skip CSRF
  ];
  
  if (skipPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  // Get token from header or body
  const token = req.headers['x-csrf-token'] || 
                req.headers['csrf-token'] || 
                req.body?.csrfToken ||
                req.query?.csrfToken;

  // Get stored token from session
  const storedToken = req.session.csrfToken;

  // Validate token
  if (!token || !storedToken || token !== storedToken) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or missing CSRF token. Please refresh the page and try again.',
      error: 'CSRF_TOKEN_INVALID',
    });
  }

  // Token is valid, proceed
  next();
};

/**
 * Get CSRF token endpoint handler
 * Allows clients to fetch the current CSRF token
 */
exports.getToken = (req, res) => {
  // Generate token if it doesn't exist
  if (!req.session.csrfToken) {
    req.session.csrfToken = generateToken();
  }

  return res.json({
    success: true,
    csrfToken: req.session.csrfToken,
  });
};

/**
 * Double Submit Cookie Pattern (Alternative CSRF protection)
 * Uses a cookie-based approach for stateless APIs
 */
exports.doubleSubmitCookie = (req, res, next) => {
  const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  
  if (!stateChangingMethods.includes(req.method)) {
    // For non-state-changing methods, set the cookie
    if (!req.cookies['XSRF-TOKEN']) {
      const token = generateToken();
      res.cookie('XSRF-TOKEN', token, {
        httpOnly: false, // Must be readable by JavaScript
        secure: process.env.APP_SECURE === 'true',
        sameSite: 'Strict',
      });
      req.csrfToken = token;
    } else {
      req.csrfToken = req.cookies['XSRF-TOKEN'];
    }
    return next();
  }

  // Validate token for state-changing methods
  const cookieToken = req.cookies['XSRF-TOKEN'];
  const headerToken = req.headers['x-xsrf-token'] || 
                     req.headers['x-csrf-token'] ||
                     req.body?.csrfToken;

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or missing CSRF token.',
      error: 'CSRF_TOKEN_INVALID',
    });
  }

  next();
};
