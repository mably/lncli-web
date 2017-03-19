// app/routes/slacktip/tip.js

const debug = require('debug')('lncliweb:routes:slacktip')

module.exports = function (slackConfig, db) {
	return function(req, res) {
		debug(req.body);
		var tipped;
		if (req.body.token === slackConfig.verificationToken) {
			tipped = {
				"response_type": "in_channel",
				"text": "The tip has been delivered to ???.",
				"attachments": [
					{
						"text": "lorem ipsum bla bla bla"
					}
				]
			};
		} else {
			tipped = {
			  "response_type": "ephemeral",
			  "text": "Sorry, that didn't work (invalid token). Please contact your adminstrator."
			}
		}
		res.json(tipped);
	};
};
