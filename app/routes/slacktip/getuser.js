// app/routes/slacktip/getuser.js

const debug = require('debug')('lncliweb:routes:slacktip')

module.exports = function (slacktip) {
	return function(req, res) {
		if (req.session.user) {
			debug(req.session.user);
			slacktip.getUser(req.session.user.identity).then(function (user) {
				res.json(user);
			}, function (err) {
				res.json({ message: err.message });
			});
		} else {
			res.json({ message: "Not connected" });
		}
	};
};
