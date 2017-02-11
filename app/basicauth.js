// app/basicauth.js
var basicAuth = require('basic-auth');

// expose the routes to our app with module.exports
module.exports = function(login, pass, limitlogin, limitpass) {

	var module = {};

	// configure basic authentification for express
	module.filter = function (req, res, next) {
		function unauthorized(res) {
			res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
			return res.sendStatus(401);
		};
		if (login && pass) {
			var user = basicAuth(req);
			if (!user || !user.name || !user.pass) {
				return unauthorized(res);
			}
			if (user.name === login && user.pass === pass) {
				req.limituser = false;
				return next();
			} else if (user.name === limitlogin && user.pass === limitpass) {
				req.limituser = true;
				return next();
			} else {
				return unauthorized(res);
			}
		} else {
			req.limituser = false;
			return next();
		}
	};

	return module;
}
