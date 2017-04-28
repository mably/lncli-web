// app/routes.js

const debug = require("debug")("lncliweb:routes");
const logger = require("winston");
const request = require("request");

// expose the routes to our app with module.exports
module.exports = function (app, lightning, db) {

	// api ---------------------------------------------------------------------

	// get lnd network info
	app.get("/api/lnd/getnetworkinfo", function (req, res) {
		lightning.getNetworkInfo({}, function (err, response) {
			if (err) {
				logger.debug("GetNetworkInfo Error:", err);
				err.error = err.message;
				res.send(err);
			} else {
				logger.debug("GetNetworkInfo:", response);
				res.json(response);
			}
		});
	});

	// get lnd node info
	app.get("/api/lnd/getinfo", function (req, res) {
		lightning.getInfo({}, function (err, response) {
			if (err) {
				logger.debug("GetInfo Error:", err);
				err.error = err.message;
				res.send(err);
			} else {
				logger.debug("GetInfo:", response);
				res.json(response);
			}
		});
	});

	// get lnd node active channels list
	app.get("/api/lnd/listpeers", function (req, res) {
		lightning.listPeers({}, function (err, response) {
			if (err) {
				logger.debug("ListPeers Error:", err);
				err.error = err.message;
				res.send(err);
			} else {
				logger.debug("ListPeers:", response);
				res.json(response);
			}
		});
	});

	// get lnd node active channels list
	app.get("/api/lnd/listchannels", function (req, res) {
		lightning.listChannels({}, function (err, response) {
			if (err) {
				logger.debug("ListChannels Error:", err);
				err.error = err.message;
				res.send(err);
			} else {
				logger.debug("ListChannels:", response);
				res.json(response);
			}
		});
	});

	// get lnd node pending channels list
	app.get("/api/lnd/pendingchannels", function (req, res) {
		lightning.pendingChannels({}, function (err, response) {
			if (err) {
				logger.debug("PendingChannels Error:", err);
				err.error = err.message;
				res.send(err);
			} else {
				logger.debug("PendingChannels:", response);
				res.json(response);
			}
		});
	});

	// get lnd node payments list
	app.get("/api/lnd/listpayments", function (req, res) {
		lightning.listPayments({}, function (err, response) {
			if (err) {
				logger.debug("ListPayments Error:", err);
				err.error = err.message;
				res.send(err);
			} else {
				logger.debug("ListPayments:", response);
				res.json(response);
			}
		});
	});

	// get lnd node invoices list
	app.get("/api/lnd/listinvoices", function (req, res) {
		lightning.listInvoices({}, function (err, response) {
			if (err) {
				logger.debug("ListInvoices Error:", err);
				err.error = err.message;
				res.send(err);
			} else {
				logger.debug("ListInvoices:", response);
				res.json(response);
			}
		});
	});

	// get the lnd node wallet balance
	app.get("/api/lnd/walletbalance", function (req, res) {
		lightning.walletBalance({}, function (err, response) {
			if (err) {
				logger.debug("WalletBalance Error:", err);
				err.error = err.message;
				res.send(err);
			} else {
				logger.debug("WalletBalance:", response);
				res.json(response);
			}
		});
	});

	// get the lnd node channel balance
	app.get("/api/lnd/channelbalance", function (req, res) {
		lightning.channelBalance({}, function (err, response) {
			if (err) {
				logger.debug("ChannelBalance Error:", err);
				err.error = err.message;
				res.send(err);
			} else {
				logger.debug("ChannelBalance:", response);
				res.json(response);
			}
		});
	});

	// connect peer to lnd node
	app.post("/api/lnd/connectpeer", function (req, res) {
		if (req.limituser) {
			return res.sendStatus(403); // forbidden
		} else {
			lightning.connectPeer({ addr: { pubkey: req.body.pubkey, host: req.body.host }, perm: false }, function (err, response) {
				if (err) {
					logger.debug("ConnectPeer Error:", err);
					err.error = err.message;
					res.send(err);
				} else {
					logger.debug("ConnectPeer:", response);
					res.json(response);
				}
			});
		}
	});

	// addinvoice
	app.post("/api/lnd/addinvoice", function (req, res) {
		if (req.limituser) {
			return res.sendStatus(403); // forbidden
		} else {
			lightning.addInvoice({ memo: req.body.memo, value: req.body.value }, function (err, response) {
				if (err) {
					logger.debug("AddInvoice Error:", err);
					err.error = err.message;
					res.send(err);
				} else {
					logger.debug("AddInvoice:", response);
					res.json(response);
				}
			});
		}
	});

	// sendpayment
	app.post("/api/lnd/sendpayment", function (req, res) {
		if (req.limituser) {
			return res.sendStatus(403); // forbidden
		} else {
			var paymentRequest = { payment_request: req.body.payreq };
			logger.debug("Sending payment", paymentRequest);
			lightning.sendPaymentSync(paymentRequest, function (err, response) {
				if (err) {
					logger.debug("SendPayment Error:", err);
					err.error = err.message;
					res.send(err);
				} else {
					logger.debug("SendPayment:", response);
					res.json(response);
				}
			});
		}
	});

	// decodepayreq
	app.post("/api/lnd/decodepayreq", function (req, res) {
		lightning.decodePayReq({ pay_req: req.body.payreq }, function (err, response) {
			if (err) {
				logger.debug("DecodePayReq Error:", err);
				err.error = err.message;
				res.send(err);
			} else {
				logger.debug("DecodePayReq:", response);
				res.json(response);
			}
		});
	});

	// queryroute
	app.post("/api/lnd/queryroute", function (req, res) {
		lightning.queryRoutes({ pub_key: req.body.pubkey, amt: req.body.amt }, function (err, response) {
			if (err) {
				logger.debug("QueryRoute Error:", err);
				err.error = err.message;
				res.send(err);
			} else {
				logger.debug("QueryRoute:", response);
				res.json(response);
			}
		});
	});

	// newaddress
	app.post("/api/lnd/newaddress", function (req, res) {
		lightning.newAddress({ type: req.body.type }, function (err, response) {
			if (err) {
				logger.debug("NewAddress Error:", err);
				err.error = err.message;
				res.send(err);
			} else {
				logger.debug("NewAddress:", response);
				res.json(response);
			}
		});
	});

	// application -------------------------------------------------------------
	app.get("*", function (req, res) {
		res.sendFile("lnd.html", { root: __dirname + "/../public/" }); // load the single view file (angular will handle the page changes on the front-end)
	});

};
