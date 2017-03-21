// app/slacktip.js

const debug = require('debug')('lncliweb:slacktip')
const logger = require('winston')
const Promise = require('promise')
const request = require('request')

// TODO
module.exports = function(lightning, lnd, db, slackConfig) {

	var module = {};

	var accountsCol = db.collection("slacktip-accounts");
	accountsCol.createIndex( { "slackid": 1 }, { unique: true } );
	var invoicesCol = db.collection("slacktip-invoices");
	var paymentsCol = db.collection("slacktip-payments");
	var transactionsCol = db.collection("slacktip-transactions");

	const txprocessor = require("./txprocessor")(db, accountsCol, transactionsCol);

	var invoiceListener = null;

	// register the lnd invoices listener
	var registerLndInvoiceListener = function() {
		invoiceListener = { dataReceived: function(data) {
			debug("Invoice data received", data)
			var memo = parseInvoiceMemo(data.memo);
			if (memo != null) {
				paymentsCol.insert([{ data: data }], { w: 1 }, function (err, result) {
					logger.debug('Invoice data received DB insert:', result);
				});
				var slackId = buildSlackId(memo.identity);
				module.dbGetUser(slackId).then(function (user) {
					debug('dbGetUser', user);
					var value = parseInt(data.value);
					if (user == null) { // user not found
						module.dbCreateUser(slackId, memo.identity, value).then(function (createdUsers) {
							if (createdUsers.length >= 1) {
								debug(createdUsers[0]);
							} else {
								debug("Something went wrong");
							}
						}, function (err) {
							debug('dbCreateUser error', err);
						});
					} else {
						var update = { $inc: { balance:  value } };
						module.dbUpdateUser(slackId, update).then(function (response) {
							debug('dbUpdateUser', response);
						}, function (err) {
							debug('dbUpdateUser error', err);
						});
					}
				}, function (err) {
					debug('dbGetUser error', err);
				});
			}
		}};
		lnd.registerInvoiceListener(invoiceListener);
	};

	registerLndInvoiceListener();

	module.getUser = function (identity) {
		var promise = new Promise(function (resolve, reject) {
			var slackId = buildSlackId(identity);
			module.dbGetUser(slackId).then(function (user) {
				debug('dbGetUser', user);
				if (user == null) { // user not found
					delete identity.ok;
					module.dbCreateUser(slackId, identity, 0).then(function (createdUsers) {
						if (createdUsers.length >= 1) {
							resolve(createdUsers[0]);
						} else {
							reject({ message: "Something went wrong" });
						}
					}, function (err) {
						reject(err);
					});
				} else {
					if (identity.user.name && !user.identity.user.name) {
						user.identity.user.name = identity.user.name;
						var update = { $set: user };
						module.dbUpdateUser(slackId, update).then(function (result) {
							resolve(user);
						}, function (err) {
							debug(err);
							resolve(user);
						});
					} else {
						resolve(user);
					}
				}
			}, function (err) {
				debug('dbGetUser error', err);
				reject(err);
			});
		});
		return promise;
	}

	module.getSlackUserIdentity = function (accessToken) {
		var promise = new Promise(function (resolve, reject) {
			//https://slack.com/api/users.identity?token=xoxp-156430406180-156430406212-156430963396-fe524ed477bbc9ce3800349a3ad61a64&scope=identity.basic
			request.post({ url: 'https://slack.com/api/users.identity', form: { token: accessToken }}, function (err, httpResponse, body) {
				if (err) {
					logger.debug('getSlackUserIdentity Error:', err);
					err.error = err.message;
					reject(err)
				} else {
					debug(httpResponse.body);
					var identity = JSON.parse(httpResponse.body);
					module.getUser(identity).then(function (user) {
						resolve(user);
					}, function (err) {
						debug('getUser error', err);
						reject(err);
					});
				}
			});
		});
		return promise;
	}

	// Requires the users:read scope for the app, we shouldn't use it
	module.getSlackUserInfo = function (userId) {
		var promise = new Promise(function (resolve, reject) {
			request.post({ url: 'https://slack.com/api/users.info', form: { token: slackConfig.accessToken, user: userId }}, function (err, httpResponse, body) {
				if (err) {
					logger.debug('getSlackUserInfo Error:', err);
					err.error = err.message;
					reject(err)
				} else {
					debug(httpResponse.body);
					var profile = JSON.parse(httpResponse.body);
					resolve(profile);
				}
			});
		});
		return promise;
	}

	module.tip = function (tipRequest) {
		var promise = new Promise(function (resolve, reject) {
			var tipped;
			if (tipRequest.token === slackConfig.verificationToken) {
				var re = /(\d*)\s+\<@(\w*)\|(\w*)\>.*/;
				var array = tipRequest.text.match(re);
				debug(array);
				if (array.length >= 4) {
					var sourceIdentity = { "user": { "id": tipRequest.user_id }, "team": { "id": tipRequest.team_id }};
					var sourceSlackId = buildSlackId(sourceIdentity);
					var targetIdentity = { user: { id: array[2] }, team: { id: tipRequest.team_id } };
					var targetSlackId = buildSlackId(targetIdentity);
					if (sourceSlackId == targetSlackId) {
						resolve({
							"response_type": "ephemeral",
							"text": "You can't send a tip to yourself, sorry."
						});
					} else {
						module.dbGetUser(sourceSlackId).then(function (sourceUser) {
							debug('dbGetUser', sourceUser);
							if (sourceUser == null) { // Missing source user
								module.dbCreateUser(sourceSlackId, sourceIdentity, 0).then(function (createdUsers) {
									resolve({
										"response_type": "ephemeral",
										"text": "Couldn't send tip, you need to deposit some funds in your account first.",
										"attachments": [
											{
												"text": "You can deposit some funds by connecting to <https://lnd-testnet-2.mably.com|our website>."
											}
										]
									});
								}, function (err) {
									debug(err);
									resolve({
										"response_type": "ephemeral",
										"text": err
									});
								});
							} else {
								var tipAmount = parseInt(array[1]);
								if (sourceUser.balance >= tipAmount) {
									module.dbGetUser(targetSlackId).then(function (targetUser) {
										debug('targetUser', targetUser);
										var tipResponse = {
											"response_type": "in_channel",
											"text": "A tip of " + array[1] + " satoshis has been delivered to @" + array[3],
											"attachments": [
												{
													"text": "Thanx for supporting the <https://lnd-testnet-2.mably.com|Slack LN tipping bot>!"
												}
											]
										};
										if (targetUser == null) { // user not found
											module.dbCreateUser(targetSlackId, targetIdentity, 0).then(function (result) {
												// TODO check result
												txprocessor.dbExecuteTransaction(sourceSlackId, targetSlackId, tipAmount).then(
													result => {
														resolve(tipResponse);
													}, reason => {
														reject(reason);
													}
												);
											}, function (err) {
												debug(err);
												resolve({
													"response_type": "ephemeral",
													"text": err
												});
											});
										} else {
											txprocessor.dbExecuteTransaction(sourceSlackId, targetSlackId, tipAmount).then(
												result => {
													resolve(tipResponse);
												}, reason => {
													reject(reason);
												}
											);
										}
									}, function (err) {
										debug(err);
										resolve({
											"response_type": "ephemeral",
											"text": err
										});
									});
								} else {
									resolve({
										"response_type": "ephemeral",
										"text": "Couldn't send tip, there are not enough funds available in your account.",
										"attachments": [
											{
												"text": "You can deposit some funds by connecting to <https://lnd-testnet-2.mably.com|our website>."
											}
										]
									});
								}
							}
						}, function (err) {
							debug(err);
							resolve({
								"response_type": "ephemeral",
								"text": err
							});
						});
					}
				} else {
					resolve({
						"response_type": "ephemeral",
						"text": "Couldn't understand your tipping request, could you try again?",
						"attachments": [
							{
								"text": "Thanx for supporting the <https://lnd-testnet-2.mably.com|Slack LN tipping bot>!"
							}
						]
					});
				}
			} else {
				resolve({
				  "response_type": "ephemeral",
				  "text": "Sorry, that didn't work (invalid token). Please contact your adminstrator."
				});
			}
		});
		return promise;
	}

	module.sendTip = function (user, targetUserId, tipAmount) {
		var promise = new Promise(function (resolve, reject) {
			var sourceSlackId = buildSlackId(user.identity);
			module.dbGetUser(sourceSlackId).then(function (sourceUser) {
				if (sourceUser.balance >= tipAmount) {
					var targetIdentity = { user: { id: targetUserId }, team: { id: user.identity.team.id } };
					var targetSlackId = buildSlackId(targetIdentity);
					if (targetSlackId == sourceSlackId) {
						reject("You can't send a tip to yourself, sorry.");
					} else {
						module.dbGetUser(targetSlackId).then(function (targetUser) {
							if (targetUser) {
								txprocessor.dbExecuteTransaction(sourceSlackId, targetSlackId, tipAmount).then(
									result => {
										resolve(result);
									}, reason => {
										reject(reason);
									}
								);
							} else {
								reject("Couldn't send tip, recipient hasn't created an account yet.");
							}
						}, function (reason) {
							reject(reason);
						});
					}
				} else {
					reject("Couldn't send tip, there are not enough funds available in your account.");
				}
			}, function (reason) {
				reject(reason);
			});
		});
		return promise;
	};

	var buildSlackId = function (identity) {
		return identity.user.id + "," + identity.team.id;
	}

	var buildInvoiceMemo = function (user) {
		return "#slacktip#" + user.identity.user.id + "," + user.identity.team.id + "#" + user.identity.user.name + "#";
	}

	var parseInvoiceMemo = function (memoStr) {
		var re = /\#slacktip\#(\w*),(\w*)\#([^#]*)\#/;
		var array = memoStr.match(re);
		var memo;
		if (array.length === 4) {
			memo = { identity: { user: { id: array[1], name: array[3] }, team: { id: array[2] } } };
		} else {
			memo = null;
		}
		return memo;
	}

	module.addInvoice = function (user, amount) {
		var promise = new Promise(function (resolve, reject) {
			var memo = buildInvoiceMemo(user);
			var params = { memo: memo, value: amount };
			lightning.addInvoice(params, function(err, response) {
				if (err) {
					logger.debug('AddInvoice Error:', err);
					err.error = err.message;
					reject(err)
				} else {
					logger.debug('AddInvoice:', response);
					module.dbAddInvoice({ params: params, response: response});
					resolve(response);
				}
			});
		});
		return promise;
	}

	module.dbAddInvoice = function(invoice) {
		var promise = new Promise(function (resolve, reject) {
			invoicesCol.insert([invoice], { w: 1 }, function (err, result) {
				if (err) {
					reject(err);
				} else {
					logger.debug('AddInvoice DB insert:', result);
					resolve(result);
				}
			});
		});
		return promise;
	}

	module.dbGetUser = function (slackId) {
		var promise = new Promise(function (resolve, reject) {
			accountsCol.find({ slackid: slackId }).toArray(function (err, accounts) {
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

	module.dbCreateUser = function (slackId, identity, balance) {
		var promise = new Promise(function (resolve, reject) {
			var user = { slackid: slackId, identity: identity, balance: balance, pendingTransactions: [] };
			accountsCol.insert(user, { w: 1 }, function (err, result) {
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

	module.dbUpdateUser = function (slackId, update) {
		var promise = new Promise(function (resolve, reject) {
			accountsCol.update({ slackid : slackId }, update, { w: 1 }, function (err, result) {
				if (err) {
					reject(err);
				} else {
					logger.debug('dbUpdateUser DB update', result);
					resolve(result);
				}
			});
		});
		return promise;
	};

	return module;
}
