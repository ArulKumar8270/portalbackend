const passport = require('passport');
const JWT = require('jsonwebtoken');
const config = require("../config/index");

const JWTSign = function(iss, user, date){
    return JWT.sign({
        iss : iss,
        sub : user.id,
        iam : user.type,
        iat : date.getTime(),
        exp : new Date().setMinutes(date.getMinutes() + 30)
    }, config.app.secret);
};

exports.jwtStrategy = (req, res, next) => {
    passport.authenticate('user-jwt', {session: false}, (err, user, info) => { 
        // Prefer JSON responses for API routes.
        const accept = String(req.headers['accept'] || '');
        const contype = String(req.headers['content-type'] || '');
        const isApi = String(req.originalUrl || req.url || '').startsWith('/api/');
        const wantsJson = accept.includes('application/json') || contype.startsWith('application/json');
        const json = isApi || wantsJson;
        // Return 401 (Unauthorized) for authentication errors instead of 500
        if (err && err == 'expired'){ 
            return json
                ? res.status(401).json({ success: false, errors: ['Session is expired'], message: 'Your session has expired. Please login again.' })
                : res.redirect('/auth/login'); 
        }
        if (err && err == 'invalid'){ 
            return json
                ? res.status(401).json({ success: false, errors: ['Invalid token received'], message: 'Invalid authentication token. Please login again.' })
                : res.redirect('/logout'); 
        }
        if (err && err == 'user'){ 
            return json
                ? res.status(401).json({ success: false, errors: ['Invalid user'], message: 'User not found. Please login again.' })
                : res.redirect('/logout'); 
        }
        if (err && Object.keys(err).length) { 
            return res.status(401).json({ success: false, errors: [ err ], message: 'Authentication failed.' }); 
        }
        if (err) { 
            return res.status(401).json({ success: false, errors: [ 'Invalid user received' ], message: 'Authentication failed.' }); 
        }
        if (!user) { 
            return json
                ? res.status(401).json({ success: false, errors: ['Invalid user received'], message: 'Authentication failed. Please login again.' })
                : res.redirect('/logout'); 
        }
        req.user = user;
        next();
    })(req, res, next);
};

exports.localStrategy = (req, res, next) => {
    passport.authenticate('user-local', {session: false}, (err, user, info) => {
        if (err && err == 'invalid') { return res.status(403).json({ success: false, errors: ['Account inactive']}); }
        if (err && err == 'attempt') { return res.status(429).json({ success: false, errors: ['Too many invalid attempts. Please reset your password.']}); }
        if (err && err.startsWith('attempt:')) { return res.status(401).json({ success: false, errors: ['Invalid Credentials (' + err.split(':')[1]+' Attempt(s) Left)']}); }
        if (err && err == 'pending') { return res.status(403).json({ success: false, errors: ['Your account is pending admin approval. Please wait for approval.'], message: 'Your account is pending admin approval. Please wait for approval.'}); }
        if (err && err == 'rejected') { return res.status(403).json({ success: false, errors: ['Your account has been rejected. Please contact your administrator.'], message: 'Your account has been rejected. Please contact your administrator.'}); }
        if (err) { return res.status(500).json({ success: false, errors: [ err ]}); }
        if (!user) { return res.status(401).json({ success: false, errors: ['Invalid Credentials']}); }
        req.user = user;
        next();
    })(req, res, next);
};

exports.customerStrategy = (req, res, next) => {
    passport.authenticate('customer-local', {session: false}, (err, user, info) => {
        if (err) { return res.status(500).json({ success: false, errors: [ err ]}); }
        if (!user) { return res.status(401).json({ success: false, errors: ['Invalid Credentials']}); }
        req.user = user;
        next();
    })(req, res, next);
};
