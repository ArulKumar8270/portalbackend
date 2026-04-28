const express = require('express');
const logger = require('morgan');
const path = require('path');
const passport = require('passport');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const expressSanitizer = require('express-sanitizer');
const helmet = require('helmet');
const rfs = require('rotating-file-stream');
const multer = require("multer");
require('./passport');
const compression = require('compression'); // Add to package.json

module.exports = {
    setup: (config) => {
        const app = express();

        var accessLogStream = rfs('access.log', {
            interval: '1d',
            path: path.join(__dirname, '..', 'log')
        });
        
        app.use(logger(config.app.log, { stream: accessLogStream }));
        
        // Initialize req.body for all requests (multer will populate it for multipart)
        app.use(function(req, res, next) {
            if (!req.body) {
                req.body = {};
            }
            next();
        });
        
        // Middleware to safely handle body parsing with error catching
        // This prevents JSON parsing errors from crashing the app
        app.use(function(req, res, next) {
            const contentType = (req.headers['content-type'] || '').toLowerCase();
            const isUploadRoute = req.path.includes('/upload-file');
            
            // Skip body parsing for multipart requests (handled by multer)
            // Also skip for upload routes to prevent body consumption
            // Multer will populate req.body with form fields automatically
            if (contentType.includes('multipart/form-data') || isUploadRoute) {
                if (isUploadRoute && !contentType.includes('multipart/form-data')) {
                    console.log("Upload route detected - skipping body parsing to preserve stream for multer");
                }
                return next();
            }
            
            // Parse JSON - but catch errors in case it's actually multipart
            if (contentType.includes('application/json')) {
                return bodyParser.json({
                    limit: '50mb',
                    verify: function(req, res, buf, encoding) {
                        // Store original buffer for error handling
                        req.rawBody = buf;
                    }
                })(req, res, function(err) {
                    // Catch JSON parsing errors - might be multipart with wrong Content-Type
                    if (err && err.type === 'entity.parse.failed') {
                        // Check if raw body looks like multipart
                        if (req.rawBody) {
                            try {
                                const start = req.rawBody.toString('utf8', 0, Math.min(200, req.rawBody.length));
                                if (start.startsWith('------') || (start.startsWith('--') && start.includes('Content-Disposition'))) {
                                    console.log("Detected multipart data with wrong Content-Type - fixing header");
                                    // Extract boundary from the data if possible
                                    const boundaryMatch = start.match(/^--([^\r\n]+)/);
                                    if (boundaryMatch) {
                                        const boundary = boundaryMatch[1].trim();
                                        req.headers['content-type'] = `multipart/form-data; boundary=${boundary}`;
                                    } else {
                                        req.headers['content-type'] = 'multipart/form-data';
                                    }
                                    req.body = {}; // Clear parsed body, let multer handle it
                                    return next();
                                }
                            } catch (e) {
                                // Ignore errors in detection
                            }
                        }
                        // Not multipart, just a JSON parse error
                        req.body = {};
                        return next();
                    }
                    next(err);
                });
            }
            
            // Parse URL-encoded
            if (contentType.includes('application/x-www-form-urlencoded')) {
                return bodyParser.urlencoded({ 
                    extended: true,
                    limit: '50mb'
                })(req, res, next);
            }
            
            // No body parsing needed
            next();
        });

        app.use(cookieParser(config.app.secret));
        app.use(session({ secret: config.app.secret ,resave: true, saveUninitialized:true}));
        app.use("/photo", express.static(path.join(__dirname, 'public/images')));
        app.use(passport.initialize());
        app.use(passport.session());
        
        // Skip expressSanitizer for multipart requests (multer needs to process first)
        app.use(function(req, res, next) {
            const contentType = (req.headers['content-type'] || '').toLowerCase();
            if (contentType.includes('multipart/form-data')) {
                return next(); // Skip sanitizer for multipart, multer will handle it
            }
            expressSanitizer()(req, res, next);
        });
        
        app.use(helmet());
        // HSTS (HTTP Strict Transport Security) - Force HTTPS for 1 year
        app.use(helmet.hsts({
            maxAge: 31536000, // 1 year in seconds
            includeSubDomains: true, // Apply to subdomains
            preload: true // Allow HSTS preload
        }));

        Number.prototype.pad = function (size) {
            var s = String(this);
            while (s.length < (size || 2)) { s = "0" + s; }
            return s;
        };
        
        // Add compression middleware
        app.use(compression());
        
        return app;
    }
};
