// app/routes.js

const debug = require("debug")("lncliweb:routes");
const logger = require("winston");
const request = require("request");
const graphviz = require("graphviz");
const commandExistsSync = require("command-exists").sync;

const DEFAULT_MAX_NUM_ROUTES_TO_QUERY = 10;
const DEFAULT_FINAL_CLTV_DELTA = 144;

// expose the routes to our app with module.exports
module.exports = function (app, lightning, db, config) {

        var lightningRPCAdapter = function(methodName, options) {
            return async function(req, res) {

                options = options || {};

                if (options.isLimitedToAuthorizedUser && req.limituser) {
                    return res.sendStatus(403);
                }

                var params = {};
                if (options.preHook) {
                    params = options.preHook(req);
                }

                try {
                    logger.info(methodName, params);
                    let response = await lightning.call(methodName, params);
                    if (options.postHook) {
                        response = options.postHook(response);
                    }
                    res.json(response);
                } catch(e) {
                    res.json({ error: e });
                }
            }
        };

	// api ---------------------------------------------------------------------
	app.get("/api/lnd/getnetworkinfo", lightningRPCAdapter("getNetworkInfo"));
	app.post("/api/lnd/getnodeinfo", lightningRPCAdapter("getNodeInfo"));
	app.get("/api/lnd/listpeers", lightningRPCAdapter("listPeers"));
	app.get("/api/lnd/listhannels", lightningRPCAdapter("listChannels"));
	app.get("/api/lnd/listpeers", lightningRPCAdapter("listPeers"));
	app.get("/api/lnd/listchannels", lightningRPCAdapter("listChannels"));
	app.get("/api/lnd/pendingchannels", lightningRPCAdapter("pendingChannels"));
	app.get("/api/lnd/listpayments", lightningRPCAdapter("listPayments"));
	app.get("/api/lnd/listinvoices", lightningRPCAdapter("listInvoices"));
	app.get("/api/lnd/forwardinghistory", lightningRPCAdapter("forwardingHistory"));
	app.get("/api/lnd/walletbalance", lightningRPCAdapter("walletBalance"));
	app.get("/api/lnd/channelbalance", lightningRPCAdapter("channelBalance"));

	app.get("/api/lnd/getinfo", lightningRPCAdapter("getInfo", {
            postHook: (response) => {
                if ((!response.uris || response.uris.length === 0) && (config.lndAddress)) {
                    response.uris = [response.identity_pubkey + "@" + config.lndAddress];
                }
                return response;
            }
        }));

	app.get("/api/lnd/connectPeer", lightningRPCAdapter("connectPeer", {
            isLimitedToAuthorizedUser: true,
            preHook: (req) => {
	        return { addr: { pubkey: req.body.pubkey, host: req.body.host }, perm: true };
            }
        }));

	app.post("/api/lnd/disconnectPeer", lightningRPCAdapter("disconnectPeer", {
            isLimitedToAuthorizedUser: true,
            preHook: (req) => {
	        return {pub_key: req.body.pubkey};
            }
        }));

	app.post("/api/lnd/addinvoice", lightningRPCAdapter("addInvoice", {
            isLimitedToAuthorizedUser: true,
            preHook: (req) => {
                var invoiceRequest = { memo: req.body.memo };
                if (req.body.value) {
                    invoiceRequest.value = req.body.value;
                }
                if (req.body.expiry) {
                    invoiceRequest.expiry = req.body.expiry;
                }
                return invoiceRequest;
            }
        }));

	app.post("/api/lnd/sendpayment", lightningRPCAdapter("addInvoice", {
            isLimitedToAuthorizedUser: true,
            preHook: (req) => {
                var paymentRequest = { payment_request: req.body.payreq };
                if (req.body.amt) {
                    paymentRequest.amt = req.body.amt;
                }
                return paymentRequest;
            }
        }));

	app.post("/api/lnd/decodepayreq", lightningRPCAdapter("decodePayReq", {
            isLimitedToAuthorizedUser: true,
            preHook: (req) => {
                return {pay_req: req.body.payreq};
            }
        }));

	app.post("/api/lnd/queryroute", lightningRPCAdapter("queryRoutes", {
            preHook: (req) => {
		var numRoutes = config.maxNumRoutesToQuery || DEFAULT_MAX_NUM_ROUTES_TO_QUERY;
		var finalCltvDelta = config.finalCltvDelta || DEFAULT_FINAL_CLTV_DELTA;
                return {
                    pub_key: req.body.pubkey,
                    amt: req.body.amt,
                    num_routes: numRoutes,
                    final_cltv_delta: finalCltvDelta
                };
            }
        }));

	app.post("/api/lnd/sendtoroute", lightningRPCAdapter("sendToRouteSync", {
            isLimitedToAuthorizedUser: true,
            preHook: (req) => {
                return {
                    payment_hash_string: req.body.payhash,
                    routes: JSON.parse(req.body.routes)
                };
            }
        }));

	app.post("/api/lnd/newaddress", lightningRPCAdapter("newAddress", {
            isLimitedToAuthorizedUser: true,
            preHook: (req) => {
                return {type: req.body.type};
            }
        }));
        /*

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
        */

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
