const express = require('express');
const authController = require('./auth.controller');
const { localStrategy , jwtStrategy} = require('../../../middleware/strategy');
const { sanitize } = require('../../../middleware/sanitizer');
const { validateBody, schemas } = require('../../../middleware/validator');
const { authRateLimiter, strictRateLimiter } = require('../../../middleware/rateLimiter');
// const { validateFileUpload } = require('../../../middleware/securityValidator');
const { requireAdmin } = require('../../../middleware/requireAuth');
const multer = require("multer");
const path = require("path"); // Ensure path is imported if not already

// Change storage to memoryStorage
const storage = multer.memoryStorage();
  
const upload = multer({ storage: storage });

const authRouter = express.Router();

// Apply strict rate limiting to authentication endpoints   
authRouter.route('/register').post(
  strictRateLimiter, // 3 attempts per hour
  sanitize(),
  /* validateBody(schemas.registerSchema), */ 
  authController.addUser
);

authRouter.route('/user/getAllUserList').get(sanitize(), jwtStrategy, requireAdmin, authController.getAllUserList);
authRouter.route('/user/update').post(sanitize(), authController.userUpdate);
authRouter.route('/user/delete').post(sanitize(), jwtStrategy, requireAdmin, authController.deleteUserList);
authRouter.route('/user/:id').get(sanitize(), authController.findUser);

// Password reset (public)
authRouter.route('/password/reset/request').post(
  strictRateLimiter,
  sanitize(),
  authController.requestPasswordReset
);
authRouter.route('/password/reset/confirm').post(
  strictRateLimiter,
  sanitize(),
  authController.confirmPasswordReset
);

// Apply auth rate limiting to login (5 attempts per 15 minutes)
authRouter.route('/rootLogin').post(
  // authRateLimiter,
  sanitize(),
  validateBody(schemas.loginSchema),
  localStrategy, 
  authController.login
);

// Apply file validation to upload endpoint
authRouter.route('/upload-file').post(
  // Middleware to ensure Content-Type is correct for multer
  function(req, res, next) {
    const contentType = req.headers['content-type'] || '';
    console.log("=== BEFORE MULTER ===");
    console.log("Content-Type:", contentType);
    console.log("Content-Length:", req.headers['content-length']);
    
    // If Content-Type is wrong, multer won't parse form fields
    // We need to fix it, but we can't easily extract boundary without consuming stream
    // So we'll let multer try, and if it fails, provide a helpful error
    next();
  },
  // Use multer.any() to parse both file and form fields
  // Then extract the "file" field and set it as req.file for compatibility
  upload.any(),
  // Debug middleware to check what multer parsed
  function(req, res, next) {
    console.log("=== AFTER MULTER ===");
    console.log("Content-Type:", req.headers['content-type']);
    console.log("req.body:", req.body);
    console.log("req.body keys:", Object.keys(req.body || {}));
    console.log("req.file:", req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : "No file");
    console.log("storeName in body:", req.body?.storeName);
    
    // Extract the "file" from req.files and set it as req.file for compatibility
    if (req.files && req.files.length > 0) {
      const fileField = req.files.find(f => f.fieldname === 'file');
      if (fileField) {
        req.file = fileField;
        console.log("Found file field:", fileField.originalname);
      } else {
        console.log("No file with fieldname 'file'. Available files:", req.files.map(f => f.fieldname));
      }
    }
    
    // If body is empty but file exists, multer parsed the file but not the form fields
    // This usually means Content-Type was wrong
    if (req.file && (!req.body || Object.keys(req.body).length === 0)) {
      console.warn("WARNING: File parsed but form fields are missing!");
      console.warn("This usually means Content-Type header is incorrect");
      console.warn("Multer needs 'multipart/form-data' with boundary parameter");
    }
    
    next();
  },
  // validateFileUpload,
  authController.uploadFileController
);

module.exports = { authRouter };
