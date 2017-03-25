// app/routes/slacktip/withdrawfunds.js

const debug = require("debug")("lncliweb:routes:slacktip");
const logger = require("winston");

module.exports = function (slacktip) {
	return function (req, res) {
		if (req.session.user) {
			slacktip.withdrawFunds(req.session.user, req.body.payreq).then(function (response) {
				res.json(response);
			}, function (err) {
				res.status(400).send({ error: err });
			});
		} else {
			res.status(403).send({ error: "Not connected" }); // forbidden
		}
	};
};
