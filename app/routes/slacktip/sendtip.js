// app/routes/slacktip/tip.js

const debug = require('debug')('lncliweb:routes:slacktip')

module.exports = function (slacktip) {
	return function(req, res) {
		debug(req.body);
		if (req.session.user) {
			slacktip.sendTip(req.session.user, req.body.userid, req.body.teamid, req.body.amount).then(function (response) {
				res.json(response);
			}, function (err) {
				debug("sendtip error", err);
				res.send({ error: err });
			});
		} else {
			return res.sendStatus(403); // forbidden
		}
	};
};
