// app/routes/slacktip/slack-callback.js

const debug = require('debug')('lncliweb:routes:slacktip')
const request = require('request')

module.exports = function (db) {
	return function(req, res) {
		//https://slack.com/api/users.identity?token=xoxp-156430406180-156430406212-156430963396-fe524ed477bbc9ce3800349a3ad61a64&scope=identity.basic
		var accessToken = req.query.access_token;
		request.post({ url: 'https://slack.com/api/users.identity', form: { token: accessToken }}, function (err, httpResponse, body) {
			debug(httpResponse.body);
			var profile = JSON.parse(httpResponse.body);
			delete profile.ok;
			req.session.profile = profile;
			res.redirect('/');
		});
	};
};
