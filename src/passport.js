const passport = require('passport');
const { Strategy: JwtStrategy } = require('passport-jwt');
const { Strategy: LocalStrategy } = require('passport-local');
const bcrypt = require('bcrypt-nodejs');

const config = require('./config');
const db = require('./models');

var TokenExtractor = function(req){
    var token = null;
    if (req && req.cookies){
        token = req.cookies['XSRF-token'];
    }
    if(!token && req.headers['authorization']){
        token = req.headers['authorization'];
        // Support standard "Authorization: Bearer <token>"
        if (typeof token === 'string' && token.toLowerCase().startsWith('bearer ')) {
            token = token.slice(7).trim();
        }
    }
    return token;
}

passport.use('user-jwt', new JwtStrategy({
    jwtFromRequest: TokenExtractor, 
    secretOrKey: config.app.secret,
}, async (payload, done) => {
    try {
        if (new Date(payload.exp) < new Date()) {
            return done('expired', false);
        }
        console.log(payload);
        // Check if it's a sub-user (check payload for isSubUser flag or try subUser table first)
        // For now, try user table first, then subUser, then customer (rootLogin supports customers).
        var user = await db.user.findOne({ where: { id: payload.sub }});
        let isSubUser = false;
        let isCustomer = false;

        if (!user) {
            user = await db.subUser.findOne({ where: { id: payload.sub }});
            isSubUser = true;
        }

        if (!user) {
            user = await db.customer.findOne({ where: { id: payload.sub }});
            isCustomer = Boolean(user);
        }

        if (!user) {
            return done('user', false);
        }

        // For sub-users, check status and load menu permissions
        if (isSubUser) {
            if (user.status !== 'approved') {
                return done('user', false);
            }
            user.dataValues.isSubUser = true;
            user.dataValues.isCustomer = false;
            // Get menu permissions
            const permissions = await db.subUserMenuPermission.findAll({
                where: { subUserId: user.id }
            });
            const menuPermissions = {};
            permissions.forEach(perm => {
                menuPermissions[perm.menuKey] = perm.enabled;
            });
            user.dataValues.menuPermissions = menuPermissions;
            // Set role based on vendorId or storeId
            user.dataValues.role = user.vendorId ? '2' : '3';
        } else if (isCustomer) {
            user.dataValues.isCustomer = true;
            user.dataValues.isSubUser = false;
            // Tag role for downstream consumers
            if (!user.dataValues.role) {
                user.dataValues.role = 'customer';
            }
        } else {
            user.dataValues.isSubUser = false;
            user.dataValues.isCustomer = false;
        }

        done(null, user);
    } catch (error) {
        done(error, false);
    }
}));


passport.use('user-local', new LocalStrategy({
    usernameField: 'email',
    passReqToCallback: true
}, async (req, email, password, done) => {
    try {
        // 1) Regular users
        let user = await db.user.findOne({ where: { email: email } });
        let isSubUser = false;
        let isCustomer = false;

        // 2) Sub-users
        if (!user) {
            user = await db.subUser.findOne({ where: { email: email } });
            isSubUser = Boolean(user);
        }

        // 3) Customers (Frontend uses /auth/rootLogin)
        if (!user) {
            user = await db.customer.findOne({ where: { email: email } });
            isCustomer = Boolean(user);
        }

        if (!user) return done(null, false);

        // For sub-users, check status
        if (isSubUser) {
            if (user.status === 'pending') {
                return done('pending', false);
            }
            if (user.status === 'rejected') {
                return done('rejected', false);
            }
        } else if (!isCustomer) {
            // Regular user status check
            if (user.status == 'inactive') {
                return done('invalid', false);
            }

            if (user.attempt == 5) {
                return done('attempt', false);
            }
        }
        
        const isMatch = bcrypt.compareSync(password, user.password);

        if (!isMatch) {
            if (!isSubUser && !isCustomer && user.attempt !== undefined) {
                user.update({
                    attempt: user.attempt + 1
                });
                return done('attempt:' + (5 - user.attempt), false);
            }
            return done(null, false);
        } else {
            if (!isSubUser && !isCustomer && user.attempt !== undefined) {
                user.update({ attempt: 0 });
            }
        }

        // Add sub-user flag and menu permissions to user object
        if (isSubUser) {
            user.dataValues.isSubUser = true;
            // Get menu permissions
            const permissions = await db.subUserMenuPermission.findAll({
                where: { subUserId: user.id }
            });
            const menuPermissions = {};
            permissions.forEach(perm => {
                menuPermissions[perm.menuKey] = perm.enabled;
            });
            user.dataValues.menuPermissions = menuPermissions;
            // Set role based on vendorId or storeId
            user.dataValues.role = user.vendorId ? '2' : '3';
        } else if (isCustomer) {
            user.dataValues.isCustomer = true;
            user.dataValues.role = 'customer';
        } else {
            user.dataValues.isSubUser = false;
        }

        done(null, user);
    } catch (error) {
        console.log(error);
        done(error, false);
    }
}));

passport.use('customer-local', new LocalStrategy({
    usernameField: 'email',
    passReqToCallback: true
}, async (req, email, password, done) => {
    try {
        const user = await db.customer.findOne({ where: { email: email } });
        if (!user) {
            return done(null, false);
        }
        // Customer table doesn't reliably have status/attempt columns in this codebase.
        // Keep login strict but avoid writing unknown columns.
        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) {
            return done(null, false);
        }
        // Tag for downstream response formatting
        user.dataValues.role = 'customer';
        done(null, user);
    } catch (error) {
        console.log(error)
        done(error, false);
    }
}));
