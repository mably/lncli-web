// app/routes/slacktip/getuser.js

const debug = require('debug')('lncliweb:routes:slacktip')

module.exports = function (db) {
	return function(req, res) {
		debug(req.session.profile);
		res.json(req.session.profile);
	};
};
