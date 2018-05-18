// app/routes.js

const debug = require("debug")("lncliweb:routes");
const logger = require("winston");
const request = require("request");
const graphviz = require("graphviz");
const commandExistsSync = require("command-exists").sync;

const DEFAULT_MAX_NUM_ROUTES_TO_QUERY = 10;

// expose the routes to our app with module.exports
module.exports = function (app, lightning, db, config) {

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

	// get lnd info
	app.get("/api/lnd/getinfo", function (req, res) {
		lightning.getInfo({}, function (err, response) {
			if (err) {
				logger.debug("GetInfo Error:", err);
				err.error = err.message;
				res.send(err);
			} else {
				logger.debug("GetInfo:", response);
				if (!response.uris || response.uris.length === 0) {
					if (config.lndAddress) {
						response.uris = [
							response.identity_pubkey + "@" + config.lndAddress
						];
					}
				}
				res.json(response);
			}
		});
	});

	// get lnd node info
	app.post("/api/lnd/getnodeinfo", function (req, res) {
		lightning.getNodeInfo({ pub_key: req.body.pubkey }, function (err, response) {
			if (err) {
				logger.debug("GetNodeInfo Error:", err);
				err.error = err.message;
				res.send(err);
			} else {
				logger.debug("GetNodeInfo:", response);
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

	// get lnd node opened channels list
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

	// get lnd node forwarding history
	app.get("/api/lnd/forwardinghistory", function (req, res) {
		lightning.forwardingHistory({}, function (err, response) {
			if (err) {
				logger.debug("ForwardingHistory Error:", err);
				err.error = err.message;
				res.send(err);
			} else {
				logger.debug("ForwardingHistory:", response);
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
			var connectRequest = { addr: { pubkey: req.body.pubkey, host: req.body.host }, perm: true };
			logger.debug("ConnectPeer Request:", connectRequest);
			lightning.connectPeer(connectRequest, function (err, response) {
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

	// disconnect peer from lnd node
	app.post("/api/lnd/disconnectpeer", function (req, res) {
		if (req.limituser) {
			return res.sendStatus(403); // forbidden
		} else {
			var disconnectRequest = { pub_key: req.body.pubkey };
			logger.debug("DisconnectPeer Request:", disconnectRequest);
			lightning.disconnectPeer(disconnectRequest, function (err, response) {
				if (err) {
					logger.debug("DisconnectPeer Error:", err);
					err.error = err.message;
					res.send(err);
				} else {
					logger.debug("DisconnectPeer:", response);
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
			var invoiceRequest = { memo: req.body.memo };
			if (req.body.value) {
				invoiceRequest.value = req.body.value;
			}
			if (req.body.expiry) {
				invoiceRequest.expiry = req.body.expiry;
			}
			lightning.addInvoice(invoiceRequest, function (err, response) {
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
			if (req.body.amt) {
				paymentRequest.amt = req.body.amt;
			}
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
		var numRoutes = config.maxNumRoutesToQuery || DEFAULT_MAX_NUM_ROUTES_TO_QUERY;
		lightning.queryRoutes({ pub_key: req.body.pubkey, amt: req.body.amt, num_routes: numRoutes }, function (err, response) {
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

	// sendcoins
	app.post("/api/lnd/sendcoins", function (req, res) {
		if (req.limituser) {
			return res.sendStatus(403); // forbidden
		} else {
			var sendCoinsRequest = { addr: req.body.addr, amount: req.body.amount };
			logger.debug("SendCoins", sendCoinsRequest);
			lightning.sendCoins(sendCoinsRequest, function (err, response) {
				if (err) {
					logger.debug("SendCoins Error:", err);
					err.error = err.message;
					res.send(err);
				} else {
					logger.debug("SendCoins:", response);
					res.json(response);
				}
			});
		}
	});

	// rendergraph
	app.post("/api/lnd/rendergraph", function (req, res) {
		if (req.limituser) {
			return res.sendStatus(403); // forbidden
		} else {
			if (commandExistsSync("dot")) {
				lightning.describeGraph({}, function (err, response) {
					if (err) {
						logger.debug("DescribeGraph Error:", err);
						err.error = err.message;
						res.send(err);
					} else {
						logger.debug("DescribeGraph:", response);

						var peers = req.body.peers || {};

						var nodesMap = {};
						var nodes = response.nodes;
						var i;
						var node;
						for (i = 0; i < nodes.length; i++) {
							node = nodes[i];
							nodesMap[node.pub_key] = node;
						}

						var channeledNodes = {};
						var edges = response.edges;
						var edge;
						for (i = 0; i < edges.length; i++) {
							edge = edges[i];
							if (nodesMap[edge.node1_pub] && nodesMap[edge.node2_pub]) { // skip buggy edges
								channeledNodes[edge.node1_pub] = edge.node1_pub;
								channeledNodes[edge.node2_pub] = edge.node2_pub;
							}
						}

						// Create digraph
						var graphName = "LightningNetwork";
						var g = graphviz.graph(graphName);

						for (var nodePubKey in channeledNodes) {
							if (channeledNodes.hasOwnProperty(nodePubKey)) {
								// Add node
								node = nodesMap[nodePubKey];
								var peer = peers[nodePubKey];
								var nodeLabel;
								if (peer && peer.alias) {
									nodeLabel = peer.alias;
								} else {
									nodeLabel = node.pub_key.substr(0, 10);
								}
								console.log(node, nodeLabel);
								g.addNode(node.pub_key, { label: nodeLabel });
							}
						}

						for (i = 0; i < edges.length; i++) {
							// Add edge
							edge = edges[i];
							if (channeledNodes[edge.node1_pub] && channeledNodes[edge.node2_pub]) { // skip buggy edges
								var edgeLabel = " " + edge.channel_id.substr(0, 10);
								g.addEdge(edge.node1_pub, edge.node2_pub, { label: edgeLabel, fontsize: "12.0" });
							}
						}

						// Print the dot script
						console.log(g.to_dot());

						// Set GraphViz path (if not in your path)
						//g.setGraphVizPath("/usr/local/bin");
						// Generate a SVG output
						g.output("svg", __dirname + "/../data/networkgraph.svg");

						res.json(response);
					}
				});
			} else {
				logger.debug("Missing graphviz");
				return res.status(500).send("Missing graphviz");
			}
		}
	});

	// networkgraph.svg
	app.get("/api/lnd/networkgraph.svg", function (req, res) {
		if (req.limituser) {
			return res.sendStatus(403); // forbidden
		} else {
			res.sendFile("networkgraph.svg", { root: __dirname + "/../data/" });
		}
	});

	// signmessage
	app.post("/api/lnd/signmessage", function (req, res) {
		if (req.limituser) {
			return res.sendStatus(403); // forbidden
		} else {
			lightning.signMessage({ msg: Buffer.from(req.body.msg, "utf8") }, function (err, response) {
				if (err) {
					logger.debug("SignMessage Error:", err);
					err.error = err.message;
					res.send(err);
				} else {
					logger.debug("SignMessage:", response);
					res.json(response);
				}
			});
		}
	});

	// verifymessage
	app.post("/api/lnd/verifymessage", function (req, res) {
		lightning.verifyMessage({ msg: Buffer.from(req.body.msg, "utf8"), signature: req.body.signature }, function (err, response) {
			if (err) {
				logger.debug("VerifyMessage Error:", err);
				err.error = err.message;
				res.send(err);
			} else {
				logger.debug("VerifyMessage:", response);
				res.json(response);
			}
		});
	});

	// ln-payreq-auth.html
	app.get("/ln-payreq-auth.html", function (req, res) {
		res.send("Payment verified!");
	});

	// ln-sign-auth.html
	app.get("/ln-sign-auth.html", function (req, res) {
		res.send("Signature verified! Authentication message was properly signed by node " + req.userpubkey + ".");
	});

	// ln-signpayreq-auth.html
	app.get("/ln-signpayreq-auth.html", function (req, res) {
		res.send("Payment and signature verified! Authentication message was properly signed by node " + req.userpubkey + ".");
	});

	// application -------------------------------------------------------------
	app.get("*", function (req, res) {
		res.sendFile("lnd.html", { root: __dirname + "/../public/" }); // load the single view file (angular will handle the page changes on the front-end)
	});

};
