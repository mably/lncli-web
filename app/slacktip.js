// app/slacktip.js

const debug = require('debug')('lncliweb:slacktip')
const logger = require('winston')
const Promise = require('promise')

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

	var accountsCol = db.collection("slacktip-accounts");
	accountsCol.createIndex( { "slackid": 1 }, { unique: true } );

	module.dbGetUser = function (userId) {
		var promise = new Promise(function (resolve, reject) {
			accountsCol.find({ slackid: userId }).toArray(function (err, accounts) {
				if (err) {
					reject(err);
				} else {
					if (accounts.length >= 1) {
						resolve(accounts[0]);
					} else {
						resolve(null);
					}
				}
			});
		});
		return promise;
	};

	module.dbCreateUser = function (profile) {
		var promise = new Promise(function (resolve, reject) {
			accountsCol.insert({ slackid: profile.user.id, profile: profile, balance: 0 }, { w: 1 }, function (err, result) {
				if (err) {
					reject(err);
				} else {
					logger.debug('CreateUser DB insert:', result);
					resolve(result);
				}
			});
		});
		return promise;
	};

	return module;
}
