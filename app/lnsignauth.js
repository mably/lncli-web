// app/lnsignauth.js
const basicAuth = require('basic-auth');
const debug = require('debug')('lncliweb:lnsignauth');

// expose the routes to our app with module.exports
module.exports = function factory(lightning/* , config */) {
  const module = {};

  function unauthorized(req, res) {
    res.set('WWW-Authenticate', `Basic realm=lnsign:${req.sessionID}`);
    return res.sendStatus(401);
  }

  // configure basic authentification for express
  module.filter = async function filter(req, res, next) {
    debug('url:', req.originalUrl);
    debug('sessionID:', req.sessionID);

    const user = basicAuth(req);
    if (!user || !user.name) {
      return unauthorized(req, res);
    }

    debug('sessionID.signature:', user.name);

    const msg = { msg: Buffer.from(req.sessionID, 'utf8'), signature: user.name };
    try {
      const verifMsgResponse = await lightning.verifyMessage(msg);
      debug('VerifyMessage:', verifMsgResponse);
      if (verifMsgResponse.valid) {
        req.userpubkey = verifMsgResponse.pubkey;
        req.limituser = false;
        return next();
      }
      return unauthorized(req, res);
    } catch (err) {
      debug('VerifyMessage Error:', err);
      return unauthorized(req, res);
    }
  };

  return module;
};
