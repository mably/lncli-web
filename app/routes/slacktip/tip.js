// app/routes/slacktip/tip.js

const debug = require("debug")("lncliweb:routes:slacktip");

module.exports = function (slacktip) {
	return function (req, res) {
		debug(req.body);
		slacktip.lntipCommand(req.body).then(function (response) {
			res.json(response);
		}, function (err) {
			res.send(err);
		});
	};
};
