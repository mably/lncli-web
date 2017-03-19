// app/routes/slacktip/getuser.js

const debug = require('debug')('lncliweb:routes:slacktip')

module.exports = function (slacktip) {
	return function(req, res) {
		debug(req.session.profile);
		if (req.session.profile) {
			slacktip.dbGetUser(req.session.profile.user.id).then(function (fulfilledValue) {
				debug('dbGetUser fulfilled', fulfilledValue);
				if (fulfilledValue == null) { // user not found
					slacktip.dbCreateUser(req.session.profile).then(function (fulfilledValue) {
						debug('dbCreateUser fulfilled', fulfilledValue);
						if (fulfilledValue.length >= 1) {
							res.json(fulfilledValue[0]);
						} else {
							res.json({ message: "Something went wrong" });
						}
					}, function (rejectedValue) {
						debug('dbCreateUser rejectedValue', rejectedValue);
						res.json(rejectedValue);
					});
				} else {
					res.json(fulfilledValue);
				}
			}, function (rejectedValue) {
				debug('dbGetUser rejectedValue', rejectedValue);
				res.json(rejectedValue);
			});
		} else {
			res.json({ message: "Not connected" });
		}
	};
};
