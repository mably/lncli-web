// app/routes/slacktip/addinvoice.js

const debug = require('debug')('lncliweb:routes:slacktip')
const logger = require('winston')

module.exports = function (lightning, db) {
	return function(req, res) {
		if (req.session.profile) {
			var memo = "#slacktip#" + req.session.profile.user.id + "#" + req.session.profile.user.name + "#";
			var params = { memo: memo, value: req.body.value };
			lightning.addInvoice(params, function(err, response) {
				if (err) {
					logger.debug('AddInvoice Error:', err);
					err.error = err.message;
					res.send(err)
				} else {
					logger.debug('AddInvoice:', response);
					var collection = db.collection("slacktip-invoices");
					collection.insert([{ params: params, response: response}], { w: 1 }, function (err, result) {
						logger.debug('AddInvoice DB insert:', result);
					});
					res.json(response);
				}
			});
		} else {
			return res.sendStatus(403); // forbidden
		}
	};
};
