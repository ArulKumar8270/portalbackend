const passport = require("passport");
const JWT = require("jsonwebtoken");
const config = require("../config");

var JWTSign = function (user, date) {
  return JWT.sign(
    {
      iss: config.app.name,
      sub: user.id,
      iat: date.getTime(),
      exp: new Date().setMinutes(date.getMinutes() + 30),
    },
    config.app.secret
  );
};

exports.loginCheck = () => {
  return (req, res, next) => {
    var token = null;
    if (req && req.cookies) {
      token = req.cookies["XSRF-token"];
    }
    if (token != null) {
      return res.redirect("/");
    }
    next();
  };
};

exports.validatelogin = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user, info) => {
    let contype = req.headers["content-type"];
    var json = !(!contype || contype.indexOf("application/json") !== 0);
    if (err && err == "expired") {
      next();
      return;
    }
    if (err && err == "invalid") {
      next();
      return;
    }
    if (err && err == "user") {
      next();
      return;
    }
    if (err && Object.keys(err).length) {
      next();
      return;
    }
    if (err) {
      next();
      return;
    }
    if (!user) {
      next();
      return;
    }

    // Update Token
    var date = new Date();
    var token = JWTSign(user, date);
    res.cookie("XSRF-token", token, {
      expire: new Date().setMinutes(date.getMinutes() + 30),
      httpOnly: true,
      secure: config.app.secure,
      sameSite: 'Lax', // CSRF protection - Lax allows top-level navigation
    });

    req.user = user;
    next();
  })(req, res, next);
};

exports.userImplant = (req, res, next) => {
  res.locals.user = req.user;
  next();
};
