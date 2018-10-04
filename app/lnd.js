// app/lnd.js

const debug = require("debug")("lncliweb:lnd");
const logger = require("winston");

// TODO
module.exports = function (lightning) {

	var module = {};

	var invoiceListeners = [];

	var lndInvoicesStream = null;

	var openLndInvoicesStream = function () {
		if (lndInvoicesStream) {
			logger.debug("Lnd invoices subscription stream already opened.");
		} else {
			logger.debug("Opening lnd invoices subscription stream...");
			lndInvoicesStream = lightning.getActiveClient().subscribeInvoices({});
			logger.debug("Lnd invoices subscription stream opened.");
			lndInvoicesStream.on("data", function (data) {
				logger.debug("SubscribeInvoices Data", data);
				for (var i = 0; i < invoiceListeners.length; i++) {
					try {
						invoiceListeners[i].dataReceived(data);
					} catch (err) {
						logger.warn(err);
					}
				}
			});
			lndInvoicesStream.on("end", function () {
				logger.debug("SubscribeInvoices End");
				lndInvoicesStream = null;
				openLndInvoicesStream(); // try opening stream again
			});
			lndInvoicesStream.on("error", function (err) {
				logger.debug("SubscribeInvoices Error", err);
			});
			lndInvoicesStream.on("status", function (status) {
				logger.debug("SubscribeInvoices Status", status);
				if (status.code == 14) { // Unavailable
					lndInvoicesStream = null;
					openLndInvoicesStream(); // try opening stream again
				}
			});
		}
	};

	// register invoice listener
	module.registerInvoiceListener = function (listener) {
		invoiceListeners.push(listener);
		logger.debug("New lnd invoice listener registered, " + invoiceListeners.length + " listening now");
	};

	// unregister invoice listener
	module.unregisterInvoiceListener = function (listener) {
		invoiceListeners.splice(invoiceListeners.indexOf(listener), 1);
		logger.debug("Lnd invoice listener unregistered, " + invoiceListeners.length + " still listening");
	};

	// open lnd invoices stream on start
	openLndInvoicesStream();

	// check every minute that lnd invoices stream is still opened
	setInterval(function () {
		if (!lndInvoicesStream) {
			openLndInvoicesStream();
		}
	}, 60 * 1000);

	return module;
};
