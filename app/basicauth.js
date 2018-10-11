// app/basicauth.js
const basicAuth = require('basic-auth');
const debug = require('debug')('lncliweb:basicauth');

// expose the routes to our app with module.exports
module.exports = function factory(login, pass, limitlogin, limitpass) {
  const module = {};

  function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.sendStatus(401);
  }

  // configure basic authentification for express
  module.filter = (req, res, next) => {
    debug(`url: ${req.originalUrl}`);
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
