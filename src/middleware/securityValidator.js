/**
 * Security Input Validation Middleware
 * Additional security checks beyond basic sanitization
 */

/**
 * SQL Injection patterns to detect
 */
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/gi,
  /('|\\'|;|--|\/\*|\*\/|\+|\%)/gi,
  /(\bOR\b.*=.*)/gi,
  /(\bAND\b.*=.*)/gi,
];

/**
 * XSS patterns to detect
 */
const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // onclick=, onerror=, etc.
  /<img[^>]*src[^>]*=/gi,
  /<svg[^>]*onload/gi,
];

/**
 * Path traversal patterns
 */
const PATH_TRAVERSAL_PATTERNS = [
  /\.\./g,
  /\.\.\//g,
  /\.\.\\/g,
  /%2e%2e%2f/gi,
  /%2e%2e\\/gi,
];

/**
 * Command injection patterns
 */
const COMMAND_INJECTION_PATTERNS = [
  /[;&|`$(){}[\]]/g,
  /\b(cat|ls|pwd|whoami|id|uname|ps|kill|rm|mv|cp|chmod|chown)\b/gi,
  /\|\s*\w+/gi,
  /;\s*\w+/gi,
];

/**
 * Check if a string contains SQL injection patterns
 */
const containsSQLInjection = (value) => {
  if (typeof value !== 'string') return false;
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(value));
};

/**
 * Check if a string contains XSS patterns
 */
const containsXSS = (value) => {
  if (typeof value !== 'string') return false;
  return XSS_PATTERNS.some(pattern => pattern.test(value));
};

/**
 * Check if a string contains path traversal patterns
 */
const containsPathTraversal = (value) => {
  if (typeof value !== 'string') return false;
  return PATH_TRAVERSAL_PATTERNS.some(pattern => pattern.test(value));
};

/**
 * Check if a string contains command injection patterns
 */
const containsCommandInjection = (value) => {
  if (typeof value !== 'string') return false;
  return COMMAND_INJECTION_PATTERNS.some(pattern => pattern.test(value));
};

/**
 * Recursively check an object for security threats
 */
const checkObject = (obj, path = '') => {
  const threats = [];

  if (obj === null || obj === undefined) {
    return threats;
  }

  if (typeof obj === 'string') {
    if (containsSQLInjection(obj)) {
      threats.push({ type: 'SQL_INJECTION', path, value: obj.substring(0, 50) });
    }
    if (containsXSS(obj)) {
      threats.push({ type: 'XSS', path, value: obj.substring(0, 50) });
    }
    if (containsPathTraversal(obj)) {
      threats.push({ type: 'PATH_TRAVERSAL', path, value: obj.substring(0, 50) });
    }
    if (containsCommandInjection(obj)) {
      threats.push({ type: 'COMMAND_INJECTION', path, value: obj.substring(0, 50) });
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      threats.push(...checkObject(item, `${path}[${index}]`));
    });
  } else if (typeof obj === 'object') {
    Object.keys(obj).forEach(key => {
      threats.push(...checkObject(obj[key], path ? `${path}.${key}` : key));
    });
  }

  return threats;
};

/**
 * Security validation middleware
 * Checks for SQL injection, XSS, path traversal, and command injection
 */
exports.securityValidator = (options = {}) => {
  const {
    logThreats = true,
    blockRequest = true,
    whitelistFields = [], // Fields to skip validation (e.g., ['password', 'token'])
  } = options;

  return (req, res, next) => {
    const threats = [];
    const dataToCheck = {
      body: req.body,
      query: req.query,
      params: req.params,
    };

    // Check all request data
    Object.keys(dataToCheck).forEach(source => {
      const data = dataToCheck[source];
      if (data && typeof data === 'object') {
        // Filter out whitelisted fields
        const filteredData = whitelistFields.length > 0
          ? Object.keys(data).reduce((acc, key) => {
              if (!whitelistFields.includes(key)) {
                acc[key] = data[key];
              }
              return acc;
            }, {})
          : data;

        const sourceThreats = checkObject(filteredData, source);
        threats.push(...sourceThreats);
      }
    });

    // Log threats if enabled
    if (threats.length > 0 && logThreats) {
      console.warn('Security threat detected:', {
        ip: req.ip || req.connection.remoteAddress,
        path: req.path,
        method: req.method,
        threats: threats.map(t => ({ type: t.type, path: t.path })),
        timestamp: new Date().toISOString(),
      });
    }

    // Block request if threats found and blocking is enabled
    if (threats.length > 0 && blockRequest) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input detected. Request blocked for security reasons.',
        error: 'SECURITY_THREAT_DETECTED',
        // Don't expose threat details in production
        details: process.env.NODE_ENV === 'development' 
          ? threats.map(t => ({ type: t.type, path: t.path }))
          : undefined,
      });
    }

    next();
  };
};

/**
 * Validate file uploads for security
 */
exports.validateFileUpload = (req, res, next) => {
  if (!req.file && !req.files) {
    return next();
  }

  const files = req.files || [req.file].filter(Boolean);
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
  ];

  const maxFileSize = 5 * 1024 * 1024; // 5MB

  for (const file of files) {
    // Check file size
    if (file.size > maxFileSize) {
      return res.status(400).json({
        success: false,
        message: `File ${file.originalname} exceeds maximum size of 5MB`,
      });
    }

    // Check MIME type
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: `File type ${file.mimetype} is not allowed`,
      });
    }

    // Check filename for path traversal
    if (containsPathTraversal(file.originalname)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid filename detected',
      });
    }
  }

  next();
};

/**
 * Validate email format and check for injection
 */
exports.validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }

  // Check for injection attempts
  if (containsSQLInjection(email) || containsXSS(email)) {
    return false;
  }

  return true;
};

/**
 * Validate URL and check for injection
 */
exports.validateURL = (url) => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }
    // Check for injection
    if (containsXSS(url) || containsPathTraversal(url)) {
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
};
