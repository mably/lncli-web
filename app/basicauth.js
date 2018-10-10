// app/basicauth.js
const basicAuth = require('basic-auth');
const debug = require('debug')('lncliweb:basicauth');

// expose the routes to our app with module.exports
module.exports = function (login, pass, limitlogin, limitpass) {
  const module = {};

  // configure basic authentification for express
  module.filter = function (req, res, next) {
    debug(`url: ${req.originalUrl}`);
    function unauthorized(res) {
      res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
      return res.sendStatus(401);
    }

    if (login && pass) {
      const user = basicAuth(req);
      if (!user || !user.name || !user.pass) {
        return unauthorized(res);
      }

      if (user.name === login && user.pass === pass) {
        req.limituser = false;
        return next();
      } if (user.name === limitlogin && user.pass === limitpass) {
        req.limituser = true;
        return next();
      }
      return unauthorized(res);
    }
    req.limituser = false;
    return next();
  };

  return module;
};
