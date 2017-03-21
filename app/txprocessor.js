// app/txprocessor.js

const debug = require('debug')('lncliweb:slacktip')
const logger = require('winston')
const Promise = require('promise')

// TODO
module.exports = function(db, accountsCol, transactionsCol) {

	var module = {};

	module.dbExecuteTransaction = function (sourceSlackId, targetSlackId, tipAmount) {
		var promise = new Promise(function (resolve, reject) {
			if (Number.isInteger(tipAmount)) {
				var transaction = { source: sourceSlackId, destination: targetSlackId, value: tipAmount, state: "initial", lastModified: new Date() };
				transactionsCol.insert(transaction, { w: 1 }, function (err, result) {
					if (err) {
						reject(err);
					} else {
						logger.debug('Transaction DB insert:', result);
						module.dbProcessTransactionsInInitialState().then(function (result) {
							// TODO check result
							resolve(result);
						}, function (err) {
							reject(err);
						});
					}
				});
			} else {
				reject("Amount is not an integer value.");
			}
		});
		return promise;
	};

	module.dbProcessTransactionsInInitialState = function () {
		var promise = new Promise(function (resolve, reject) {
			transactionsCol.find({ state: "initial" }).toArray(function (err, txs) {
				if (err) {
					reject(err);
				} else {
					if (txs.length > 0) {
						var promises = new Array(txs.length);
						for (i = 0; i < txs.length; i++) {
							promises[i] = module.dbUpdateTransactionState(txs[i], "initial", "pending");
						}
						Promise.all(promises).then(result => {
							for (i = 0; i < txs.length; i++) {
								promises[i] = module.dbUpdateTransactionsAccountsBalances(txs[i]);
							}
							Promise.all(promises).then(result => {
								// TODO check result
								resolve(true);
							}, reason => {
								reject(reason);
							});
						}, reason => {
							reject(reason);
						});
					} else {
						resolve(true);
					}
				}
			});
		});
		return promise;
	};

	module.dbProcessTransactionsInPendingState = function () {
		var promise = new Promise(function (resolve, reject) {
			var dateThreshold = new Date();
			dateThreshold.setMinutes(dateThreshold.getMinutes() - 30);
			transactionsCol.find({ state: "pending", lastModified: { $lt: dateThreshold } }).toArray(function (err, txs) {
				if (err) {
					reject(err);
				} else {
					if (txs.length > 0) {
						var promises = new Array(txs.length);
						for (i = 0; i < txs.length; i++) {
							promises[i] = module.dbUpdateTransactionsAccountsBalances(txs[i]);
						}
						Promise.all(promises).then(result => {
							// TODO check result
							resolve(result);
						}, reason => {
							reject(reason);
						});
					} else {
						resolve(true);
					}
				}
			});
		});
		return promise;
	};

	module.dbProcessTransactionsInAppliedState = function () {
		var promise = new Promise(function (resolve, reject) {
			var dateThreshold = new Date();
			dateThreshold.setMinutes(dateThreshold.getMinutes() - 30);
			transactionsCol.find({ state: "applied", lastModified: { $lt: dateThreshold } }).toArray(function (err, txs) {
				if (err) {
					reject(err);
				} else {
					if (txs.length > 0) {
						var promises = new Array(txs.length);
						for (i = 0; i < txs.length; i++) {
							promises[i] = module.dbRemoveTransactionPendingFromAccounts(txs[i]);
						}
						Promise.all(promises).then(result => {
							// TODO check result ?
							resolve(result);
						}, reason => {
							reject(reason);
						});
					} else {
						resolve(true);
					}
				}
			});
		});
		return promise;
	};

	module.dbUpdateTransactionState = function (tx, prevState, newState) {
		var promise = new Promise(function (resolve, reject) {
			transactionsCol.update(
				{ _id: tx._id, state: prevState },
				{
					$set: { state: newState },
					$currentDate: { lastModified: true }
				},
				{ w: 1 },
				function (err, result) {
					if (err) {
						reject(err);
					} else {
						// TODO check result
						resolve(result);
					}
				}
			)
		});
		return promise;
	};

	module.dbUpdateAccountBalance = function (slackid, txid, value) {
		var promise = new Promise(function (resolve, reject) {
			accountsCol.update(
				{ slackid: slackid, pendingTransactions: { $ne: (txid + '') } },
				{ $inc: { balance: value }, $push: { pendingTransactions: (txid + '') } },
				{ w: 1 }, function (err, result) {
					if (err) {
						reject(err);
					} else {
						logger.debug('dbUpdateAccountBalance DB update', result);
						// TODO check result
						resolve(result);
					}
				}
			);
		});
		return promise;
	};

	module.dbUpdateTransactionsAccountsBalances = function (tx) {
		var promise = new Promise(function (resolve, reject) {
			var sourceUpdatePromise = module.dbUpdateAccountBalance(tx.source, tx._id, -tx.value);
			var destinationUpdatePromise = module.dbUpdateAccountBalance(tx.destination, tx._id, tx.value);
			Promise.all([sourceUpdatePromise, destinationUpdatePromise]).then(result => {
				module.dbUpdateTransactionState(tx, "pending", "applied").then(
					function (result) {
						// TODO check result
						module.dbRemoveTransactionPendingFromAccounts(tx).then(
							function (result) {
								// TODO check result
								resolve(result);
							}, function (err) {
								reject(err);
							}
						);
					}, function (err) {
						reject(err);
					}
				);
			}, reason => {
				reject(reason);
			});
		});
		return promise;
	};

	module.dbRemovePendingTransaction = function (slackid, txid) {
		var promise = new Promise(function (resolve, reject) {
			accountsCol.update(
				{ slackid: slackid, pendingTransactions: { $eq: (txid + '') } },
				{ $pull: { pendingTransactions: (txid + '') } },
				{ w: 1 }, function (err, result) {
					if (err) {
						reject(err);
					} else {
						logger.debug('dbRemovePendingTransaction DB update', result);
						// TODO check result
						resolve(result);
					}
				}
			);
		});
		return promise;
	};

	module.dbRemoveTransactionPendingFromAccounts = function (tx) {
		var promise = new Promise(function (resolve, reject) {
			var sourcePendingTxPromise = module.dbRemovePendingTransaction(tx.source, tx._id);
			var destinationPendingTxPromise = module.dbRemovePendingTransaction(tx.destination, tx._id);
			Promise.all([sourcePendingTxPromise, destinationPendingTxPromise]).then(result => {
				module.dbUpdateTransactionState(tx, "applied", "done").then(
					function (result) {
						// TODO check result
						resolve(result);
					}, function (err) {
						reject(err);
					}
				);
			}, reason => {
				reject(reason);
			});
		});
		return promise;
	};

	module.dbRollbackPendingTransaction = function (tx) {
		var promise = new Promise(function (resolve, reject) {
			var sourceUpdatePromise = module.dbUpdateTransactionState(tx, "pending", "canceling");
			var destinationUpdatePromise = module.dbUpdateTransactionState(tx, "pending", "canceling");
			Promise.all([sourceUpdatePromise, destinationUpdatePromise]).then(result => {
				module.dbRollbackTransactionsAccountsBalances(tx).then(
					function (result) {
						// TODO check result
						resolve(result);
					}, function (err) {
						reject(err);
					}
				);
			}, reason => {
				reject(reason);
			});
		});
		return promise;
	};

	module.dbRollbackAccountBalance = function (slackid, txid, value) {
		var promise = new Promise(function (resolve, reject) {
			accountsCol.update(
				{ slackid: slackid, pendingTransactions: (txid + '') },
				{ $inc: { balance: value }, $pull: { pendingTransactions: (txid + '') } },
				{ w: 1 }, function (err, result) {
					if (err) {
						reject(err);
					} else {
						logger.debug('dbUpdateAccountBalance DB update', result);
						// TODO check result
						resolve(result);
					}
				}
			);
		});
		return promise;
	};

	module.dbRollbackTransactionsAccountsBalances = function (tx) {
		var promise = new Promise(function (resolve, reject) {
			var sourceUpdatePromise = module.dbRollbackAccountBalance(tx.source, tx._id, tx.value);
			var destinationUpdatePromise = module.dbRollbackAccountBalance(tx.destination, tx._id, -tx.value);
			Promise.all([sourceUpdatePromise, destinationUpdatePromise]).then(result => {
				module.dbUpdateTransactionState(tx, "canceling", "canceled").then(
					function (result) {
						// TODO check result
						resolve(result);
					}, function (err) {
						reject(err);
					}
				);
			}, reason => {
				reject(reason);
			});
		});
		return promise;
	};

	// check every minute if there are some transactions to process
	setInterval(function () { 
		module.dbProcessTransactionsInInitialState();
		module.dbProcessTransactionsInPendingState();
		module.dbProcessTransactionsInAppliedState();
	}, 60 * 1000);

	return module;
}
