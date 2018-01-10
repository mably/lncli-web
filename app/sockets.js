// app/sockets.js

const debug = require("debug")("lncliweb:sockets");
const logger = require("winston");
const spawn = require("child_process").spawn;
const grpc = require("grpc");
const bitcore = require("bitcore-lib");
const BufferUtil = bitcore.util.buffer;

// TODO
module.exports = function (io, lightning, lnd, login, pass, limitlogin, limitpass, lndLogfile) {

	var clients = [];

	var authEnabled = (login && pass) || (limitlogin && limitpass);

	var userToken = null;
	var limitUserToken = null;
	if (login && pass) {
		userToken = new Buffer(login + ":" + pass).toString("base64");
	}
	if (limitlogin && limitpass) {
		limitUserToken = new Buffer(limitlogin + ":" + limitpass).toString("base64");
	}

	var tailProcess = null;
	var tailProcessTimeoutId = null;
	var tailProcessLastDataReceived = null;

	var filterLogData = function (logData, logPatternRE) {
		var filteredLogData = "";
		var index = -1;
		var previndex = 0;
		while ((index = logData.indexOf("\n", index + 1)) > -1) {
			var logLine = logData.substr(previndex, (index - previndex));
			if (logPatternRE) {
				if (logLine.match(logPatternRE)) {
					filteredLogData += logLine + "\n";
				}
			} else {
				filteredLogData += logLine + "\n";
			}
			previndex = index + 1;
		}
		return filteredLogData;
	};

	var registerGlobalListeners = function () {
		if (!tailProcess) {
			tailProcess = spawn("tail", ["-F", "--sleep-interval=2", lndLogfile]);
			tailProcess.on("error", function (err) {
				logger.warn("Couldn't launch tail command!", err.message);
				tailProcess = null;
			});
			tailProcess.stdout.on("data", function (data) {
				try {
					var logData = data.toString("utf-8");
					logger.debug("tail stdout", logData);
					tailProcessLastDataReceived = Date.now();
					for (var i = 0; i < clients.length; i++) {
						if (!clients[i]._limituser && clients[i]._logFilter) {
							try {
								var filteredLogData = filterLogData(
									logData, clients[i]._logFilter);
								if (filteredLogData.length > 0) {
									clients[i].emit("log", {
										data: filteredLogData
									});
								}
							} catch (err) {
								logger.warn("tail emit error", err);
							}
						}
					}
				} catch (err) {
					logger.warn("tail data error", err);
				}
			});
			tailProcess.stderr.on("data", function (data) {
				logger.debug("tail stderr", data.toString("utf-8"));
				tailProcessLastDataReceived = Date.now();
			});
			tailProcess.on("exit", function (code, signal) {
				logger.debug("tail command exited!", code, signal);
				tailProcess = null;
			});
			tailProcess.on("close", function (code) {
				logger.debug("tail command was closed!", code);
				tailProcess = null;
			});
			// clear existing tail process activity checker
			if (tailProcessTimeoutId) {
				clearInterval(tailProcessTimeoutId);
			}
			// check every minute that the tail process have been sending data during the last minute
			tailProcessLastDataReceived = Date.now();
			tailProcessTimeoutId = setInterval(
				function () {
					if (tailProcess && (tailProcessLastDataReceived + (60 * 1000)) < Date.now()) {
						logger.warn("tail data timeout, killing process", tailProcess.pid);
						tailProcess.kill();
					}
				},
				60 * 1000 // one minute
			);
		} else {
			logger.debug("tail process already running", tailProcess.pid);
		}
	};

	registerGlobalListeners();

	io.on("connection", function (socket) {

		debug("socket.handshake", socket.handshake);

		if (authEnabled) {
			try {
				var authorizationHeaderToken;
				if (socket.handshake.query.auth) {
					authorizationHeaderToken = socket.handshake.query.auth;
				} else if (socket.handshake.headers.authorization) {
					authorizationHeaderToken = socket.handshake.headers.authorization.substr(6);
				} else {
					socket.disconnect("unauthorized");
					return;
				}
				if (authorizationHeaderToken === userToken) {
					socket._limituser = false;
				} else if (authorizationHeaderToken === limitUserToken) {
					socket._limituser = true;
				} else {
					socket.disconnect("unauthorized");
					return;
				}
			} catch (err) { // probably because of missing authorization header
				debug(err);
				socket.disconnect("unauthorized");
				return;
			}
		} else {
			socket._limituser = false;
		}

		/** printing out the client who joined */
		logger.debug("New socket client connected (id=" + socket.id + ").");

		socket.emit("hello", { limitUser: socket._limituser });

		socket.broadcast.emit("hello", { remoteAddress: socket.handshake.address });

		/** pushing new client to client array*/
		clients.push(socket);

		registerGlobalListeners();

		registerSocketListeners(socket);

		/** listening if client has disconnected */
		socket.on("disconnect", function () {
			clients.splice(clients.indexOf(socket), 1);
			unregisterSocketListeners(socket);
			logger.debug("client disconnected (id=" + socket.id + ").");
		});

	});

	// register the socket listeners
	var registerSocketListeners = function (socket) {
		registerLndInvoiceListener(socket);
		registerCloseChannelListener(socket);
		registerOpenChannelListener(socket);
		registerLogFilterListener(socket);
	};

	// unregister the socket listeners
	var unregisterSocketListeners = function (socket) {
		unregisterLndInvoiceListener(socket);
		//unregisterCloseChannelListener(socket);
		//unregisterOpenChannelListener(socket);
	};

	// register the lnd invoices listener
	var registerLndInvoiceListener = function (socket) {
		socket._invoiceListener = {
			dataReceived: function (data) {
				socket.emit("invoice", data);
			}
		};
		lnd.registerInvoiceListener(socket._invoiceListener);
	};

	// unregister the lnd invoices listener
	var unregisterLndInvoiceListener = function (socket) {
		lnd.unregisterInvoiceListener(socket._invoiceListener);
	};

	// logfilter
	var LOGFILTER_EVENT = "logfilter";
	var registerLogFilterListener = function (socket) {
		socket.on(LOGFILTER_EVENT, function (data, callback) {
			logger.debug("logfilter", data);
			var rid = data.rid; // request ID
			if (socket._limituser) {
				callback({ rid: rid, error: "forbidden" });
			} else {
				if (data.logFilterPattern) {
					socket._logFilter = new RegExp(data.logFilterPattern, "g");
				}
			}
		});
	};

	// openchannel
	var OPENCHANNEL_EVENT = "openchannel";
	var registerOpenChannelListener = function (socket) {
		socket.on(OPENCHANNEL_EVENT, function (data, callback) {
			var rid = data.rid; // request ID
			if (socket._limituser) {
				callback({ rid: rid, error: "forbidden" });
			} else {
				try {
					var openChannelRequest = {
						node_pubkey: BufferUtil.hexToBuffer(data.pubkey),
						local_funding_amount: Number(data.localamt),
						push_sat: Number(data.pushamt)
					};
					debug("openChannelRequest", openChannelRequest);

					var call = lightning.openChannel(openChannelRequest);
					call.on("data", function (data) {
						logger.debug("OpenChannel Data", data);
						socket.emit(OPENCHANNEL_EVENT, { rid: rid, evt: "data", data: data });
					});
					call.on("end", function () {
						logger.debug("OpenChannel End");
						socket.emit(OPENCHANNEL_EVENT, { rid: rid, evt: "end" });
					});
					call.on("error", function (err) {
						logger.debug("OpenChannel Error", err.message);
						debug("OpenChannel Error", err);
						err.error = err.message;
						socket.emit(OPENCHANNEL_EVENT, { rid: rid, evt: "error", data: err });
					});
					call.on("status", function (status) {
						logger.debug("OpenChannel Status", status);
						socket.emit(OPENCHANNEL_EVENT, { rid: rid, evt: "status", data: status });
					});
					callback({ rid: rid, message: "open channel pending" });
				} catch (err) {
					logger.warn(err);
					callback({ rid: rid, error: err });
				}
			}
		});
	};

	// closechannel
	var CLOSECHANNEL_EVENT = "closechannel";
	var registerCloseChannelListener = function (socket) {
		socket.on(CLOSECHANNEL_EVENT, function (data, callback) {
			var rid = data.rid; // request ID
			if (socket._limituser) {
				callback({ rid: rid, error: "forbidden" });
			} else {
				try {
					var fundingTxIdBuffer = BufferUtil.hexToBuffer(data.funding_txid);
					var revFundingTxIdBuffer = BufferUtil.reverse(fundingTxIdBuffer);
					var closeChannelRequest = {
						channel_point: {
							funding_txid: revFundingTxIdBuffer,
							output_index: Number(data.output_index)
						},
						force: !!data.force
					};
					debug("closeChannelRequest", closeChannelRequest);

					var call = lightning.closeChannel(closeChannelRequest);
					call.on("data", function (data) {
						logger.debug("CloseChannel Data", data);
						socket.emit(CLOSECHANNEL_EVENT, { rid: rid, evt: "data", data: data });
					});
					call.on("end", function () {
						logger.debug("CloseChannel End");
						socket.emit(CLOSECHANNEL_EVENT, { rid: rid, evt: "end" });
					});
					call.on("error", function (err) {
						logger.debug("CloseChannel Error", err);
						err.error = err.message;
						socket.emit(CLOSECHANNEL_EVENT, { rid: rid, evt: "error", data: err });
					});
					call.on("status", function (status) {
						logger.debug("CloseChannel Status", status);
						socket.emit(CLOSECHANNEL_EVENT, { rid: rid, evt: "status", data: status });
					});
					callback({ rid: rid, message: "close channel pending" });
				} catch (err) {
					logger.warn(err);
					callback({ rid: rid, error: err });
				}
			}
		});
	};

};
