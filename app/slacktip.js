// app/slacktip.js

const debug = require('debug')('lncliweb:slacktip')
const logger = require('winston')

// TODO
module.exports = function(lightning, lnd, db) {

	var module = {};

	var invoiceListener = null;

	// register the lnd invoices listener
	var registerLndInvoiceListener = function() {
		invoiceListener = { dataReceived: function(data) {
			debug("Invoice data received", data)
			var collection = db.collection("slacktip-payments");
			collection.insert([{ data: data }], { w: 1 }, function (err, result) {
				logger.debug('Invoice data received DB insert:', result);
			});
		}};
		lnd.registerInvoiceListener(invoiceListener);
	};

	registerLndInvoiceListener();

	return module;
}
