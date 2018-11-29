// app/lnsignpayreqauth.js
const basicAuth = require('basic-auth');
const debug = require('debug')('lncliweb:lnsignpayreqauth');
const crypto = require('crypto');
const zpay32 = require('./zpay32.js')();

// expose the routes to our app with module.exports
module.exports = function factory(lightning, config) {
  const module = {};

  function unauthorized(res) {
    res.set('WWW-Authenticate', `Basic realm=lnsignpayreq:${config.defaultAuthPayReq}`);
    return res.sendStatus(401);
  }

  // configure basic authentification for express
  module.filter = async function filter(req, res, next) {
    debug('req:', req);
    debug('url:', req.originalUrl);

    const user = basicAuth(req);
    debug('user:', user);
    if (!user || !user.name || !user.pass) {
      return unauthorized(res);
    }

    debug('payreq.signature:', user.name);

    const msg = { msg: Buffer.from(config.defaultAuthPayReq, 'utf8'), signature: user.name };
    try {
      const verifMsgResponse = await lightning.verifyMessage(msg);
      debug('VerifyMessage:', verifMsgResponse);
      if (verifMsgResponse.valid) {
        debug('payment.preimage', user.pass);

        const preimageHash = crypto.createHash('sha256').update(Buffer.from(user.pass, 'hex')).digest('hex');

        debug('payment.preimage.hash', preimageHash);

        const decodedPayReq = zpay32.decode(config.defaultAuthPayReq);

        debug('decodedPayReq', decodedPayReq);

        if (decodedPayReq.paymentHashHex === preimageHash) {
          req.userpubkey = verifMsgResponse.pubkey;
          req.limituser = false;
          return next();
        }
        return unauthorized(res);
      }
      return unauthorized(res);
    } catch (err) {
      debug('VerifyMessage Error:', err);
      return unauthorized(res);
    }
  };

  return module;
};
