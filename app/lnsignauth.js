// app/lnsignauth.js
const basicAuth = require('basic-auth');
const debug = require('debug')('lncliweb:lnsignauth');

// expose the routes to our app with module.exports
module.exports = function (lightning, config) {
  const module = {};

  // configure basic authentification for express
  module.filter = function (req, res, next) {
    debug('url:', req.originalUrl);
    debug('sessionID:', req.sessionID);
    function unauthorized(res) {
      res.set('WWW-Authenticate', `Basic realm=lnsign:${req.sessionID}`);
      return res.sendStatus(401);
    }

    const user = basicAuth(req);
    if (!user || !user.name) {
      return unauthorized(res);
    }

    debug('sessionID.signature:', user.name);

    lightning.getActiveClient().verifyMessage({ msg: Buffer.from(req.sessionID, 'utf8'), signature: user.name }, (err, response) => {
      if (err) {
        debug('VerifyMessage Error:', err);
        unauthorized(res);
      } else {
        debug('VerifyMessage:', response);
        if (response.valid) {
          req.userpubkey = response.pubkey;
          req.limituser = false;
          next();
        } else {
          unauthorized(res);
        }
      }
    });
  };

  return module;
};
