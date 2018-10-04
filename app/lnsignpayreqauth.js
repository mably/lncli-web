// app/lnsignpayreqauth.js
const basicAuth = require("basic-auth");
const debug = require("debug")("lncliweb:lnsignpayreqauth");
const crypto = require("crypto");
const zpay32 = require("./zpay32.js")();

// expose the routes to our app with module.exports
module.exports = function (lightning, config) {

	var module = {};

	// configure basic authentification for express
	module.filter = function (req, res, next) {

		debug("req:", req);
		debug("url:", req.originalUrl);

		function unauthorized(res) {
			res.set("WWW-Authenticate", "Basic realm=lnsignpayreq:" + config.defaultAuthPayReq);
			return res.sendStatus(401);
		}

		var user = basicAuth(req);
		debug("user:", user);
		if (!user || !user.name || !user.pass) {
			return unauthorized(res);
		}

		debug("payreq.signature:", user.name);

		lightning.getActiveClient().verifyMessage({ msg: Buffer.from(config.defaultAuthPayReq, "utf8"), signature: user.name }, function (err, verifMsgResponse) {
			if (err) {
				debug("VerifyMessage Error:", err);
				unauthorized(res);
			} else {
				debug("VerifyMessage:", verifMsgResponse);
				if (verifMsgResponse.valid) {

					debug("payment.preimage", user.pass);

					var preimageHash = crypto.createHash("sha256").update(Buffer.from(user.pass, "hex")).digest("hex");

					debug("payment.preimage.hash", preimageHash);

					var decodedPayReq = zpay32.decode(config.defaultAuthPayReq);

					debug("decodedPayReq", decodedPayReq);

					if (decodedPayReq.paymentHashHex === preimageHash) {
						req.userpubkey = verifMsgResponse.pubkey;
						req.limituser = false;
						next();
					} else {
						unauthorized(res);
					}

				} else {
					unauthorized(res);
				}
			}
		});
	};

	return module;
};
