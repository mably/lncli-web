(function () {
	"use strict";

	module.exports = function ($rootScope, $filter, $http, $timeout, $interval, $q, ngToast, bootbox, localStorageService, $, config, uuid, webNotification, iosocket, utils) {

		var _this = this;

		var API = {
			GETINFO: "/api/lnd/getinfo",
			GETNODEINFO: "/api/lnd/getnodeinfo",
			GETNETWORKINFO: "/api/lnd/getnetworkinfo",
			WALLETBALANCE: "/api/lnd/walletbalance",
			CHANNELBALANCE: "/api/lnd/channelbalance",
			LISTPEERS: "/api/lnd/listpeers",
			LISTCHANNELS: "/api/lnd/listchannels",
			PENDINGCHANNELS: "/api/lnd/pendingchannels",
			LISTPAYMENTS: "/api/lnd/listpayments",
			LISTINVOICES: "/api/lnd/listinvoices",
			FORWARDINGHISTORY: "/api/lnd/forwardinghistory",
			CONNECTPEER: "/api/lnd/connectpeer",
			DISCONNECTPEER: "/api/lnd/disconnectpeer",
			ADDINVOICE: "/api/lnd/addinvoice",
			SENDCOINS: "/api/lnd/sendcoins",
			SENDPAYMENT: "/api/lnd/sendpayment",
			DECODEPAYREQ: "/api/lnd/decodepayreq",
			QUERYROUTE: "/api/lnd/queryroute",
			NEWADDRESS: "/api/lnd/newaddress",
			RENDERGRAPH: "/api/lnd/rendergraph",
			SIGNMESSAGE: "/api/lnd/signmessage",
			VERIFYMESSAGE: "/api/lnd/verifymessage"
		};

		var BLOCKCHAIN_INFO_TICKER_URL = "https://blockchain.info/ticker";
		var PRICE_CACHE_MAXAGE = 30 * 1000;

		this.restrictedUser = false;

		var infoCache = null;
		var peersCache = null;
		var channelsCache = null;
		var knownPeersCache = null;
		var configCache = null;
		var addressesCache = null;
		var channelsFetchers = null;
		var pricesCache = null;
		var pricesFetchers = null;
		var wsRequestListeners = {};

		var endPoint = utils.getUrlParameterByName("endpoint") || window.serverRootPath; // endpoint parameter -> LND Chrome Extension, window.serverRootPath -> Electron

		var serverUrl = function (path) {
			return endPoint ? endPoint + path : path;
		};

		this.getEndPoint = function () {
			return endPoint ? endPoint : window.location.origin;
		};

		var isSecure = function () {
			return endPoint ? endPoint.toLowerCase().startsWith("https:") : location.protocol.startsWith("https");
		};

		var socket = iosocket.connect(serverUrl("/"), { secure: isSecure() });

		socket.on(config.events.INVOICE_WS, function (data) {
			console.log("Invoice received:", data);
			_this.notify(config.notif.SUCCESS, "Payment received: " + data.value + ", " + data.memo);
			$rootScope.$broadcast(config.events.INVOICE_REFRESH, data);
		});

		socket.on(config.events.HELLO_WS, function (data) {
			console.log("Hello event received:", data);
			_this.restrictedUser = data.limitUser;
			onConfigUpdate();
			var helloMsg = ((data && data.remoteAddress) ? data.remoteAddress + " s" : "S") + "ucessfully connected!";
			_this.notify(config.notif.SUCCESS, helloMsg);
		});

		var resolvedPromise = typeof Promise == "undefined" ? null : Promise.resolve();
		this.nextTick = resolvedPromise ? function (fn) { resolvedPromise.then(fn); } : function (fn) { setTimeout(fn); };

		var logLines = 0;
		socket.on(config.events.LOG_WS, function (message) {
			console.log("Log message:", message);
			if (message.data) {
				var logNotifyPattern = _this.getConfigValue(
					config.keys.LOG_NOTIFY_PATTERN, config.defaults.LOG_NOTIFY_PATTERN);
				var logPatternRE = null;
				if (logNotifyPattern) {
					logPatternRE = new RegExp(logNotifyPattern);
				}
				var index = -1;
				var previndex = 0;
				while ((index = message.data.indexOf("\n", index + 1)) > -1) {
					if (logPatternRE) {
						var logLine = message.data.substr(previndex, (index - previndex));
						if (logLine.match(logPatternRE)) {
							_this.notify(config.notif.WARNING, logLine);
						}
					}
					previndex = index + 1;
					logLines++;
				}
				var $tailObj = $("#tail");
				var logs = $tailObj.html();
				index = -1;
				var maxLogBuffer = _this.getConfigValue(
					config.keys.MAX_LOG_BUFFER, config.defaults.MAX_LOG_BUFFER);
				while (logLines > maxLogBuffer) {
					index = logs.indexOf("\n", index + 1);
					logLines--;
				}
				logs = logs.substring(index + 1);
				$tailObj.html(logs + message.data);
				_this.nextTick(function () {
					$tailObj.scrollTop($tailObj[0].scrollHeight);
				});
			}
		});

		socket.on(config.events.OPENCHANNEL_WS, function (response) {
			console.log("OpenChannel WS event", response);
			$timeout(function () {
				if (response.evt && response.rid) { // valid event
					if (wsRequestListenersFilter(response)) {
						if ((response.evt === "error") && response.data.error) {
							var errMsg = response.data.error;
							_this.notify(config.notif.WARNING, errMsg);
						} else if ((response.evt === "status")) {
							var statusMsg = response.data.details;
							_this.notify(config.notif.INFO, statusMsg);
						} else if ((response.evt === "data") && response.data.update) {
							var dataMsg;
							var update = response.data.update; // TODO
							if (update === "chan_pending") {
								var txId = response.data.chan_pending.txid;
								dataMsg = "Channel opening pending... (txid = " + utils.buffer2hexa(txId, true) + ")";
								$rootScope.$broadcast(config.events.CHANNEL_REFRESH, response);
							} else if (update === "confirmation") {
								var blockHeight = response.data.confirmation.block_height;
								var numConfsLeft = response.data.confirmation.num_confs_left;
								dataMsg = "Channel opening, " + numConfsLeft + " confirmations left... (block height " + blockHeight + ")";
							} else if (update === "chan_open") {
								var fundingTxId = response.data.chan_open.channel_point.funding_txid;
								dataMsg = "Channel is opened... (funding txid = " + utils.buffer2hexa(fundingTxId, true) + ")";
								$rootScope.$broadcast(config.events.CHANNEL_REFRESH, response);
							} else {
								dataMsg = update;
							}
							_this.notify(config.notif.INFO, dataMsg);
						}
					}
				}
			});
		});

		socket.on(config.events.CLOSECHANNEL_WS, function (response) {
			console.log("CloseChannel WS event", response);
			$timeout(function () {
				if (response.evt && response.rid) { // valid event
					if (wsRequestListenersFilter(response)) {
						if ((response.evt === "error") && response.data.error) {
							var errMsg = response.data.error;
							_this.notify(config.notif.WARNING, errMsg);
						} else if ((response.evt === "status")) {
							var statusMsg = response.data.details;
							_this.notify(config.notif.INFO, statusMsg);
						} else if ((response.evt === "data") && response.data.update) {
							var dataMsg;
							var update = response.data.update; // TODO
							if (update === "close_pending") {
								var txId = response.data.close_pending.txid;
								dataMsg = "Channel close pending... (txid = " + utils.buffer2hexa(txId, true) + ")";
								$rootScope.$broadcast(config.events.CHANNEL_REFRESH, response);
							} else if (update === "chan_close") {
								var closingTxId = response.data.chan_close.closing_txid;
								dataMsg = "Channel has been closed... (closing txid = " + utils.buffer2hexa(closingTxId, true) + ")";
								$rootScope.$broadcast(config.events.CHANNEL_REFRESH, response);
							} else {
								dataMsg = update;
							}
							_this.notify(config.notif.INFO, dataMsg);
						}
					}
				}
			});
		});

		var wsRequestListenersFilter = function (response) {
			if (wsRequestListeners.hasOwnProperty(response.rid)) {
				return wsRequestListeners[response.rid].callback(response);
			} else {
				return true;
			}
		};

		this.registerWSRequestListener = function (requestId, callback, expires) {
			var deferred = $q.defer();
			expires = expires || new Date().getTime() + 5 * 60 * 1000; // defaults to five minutes
			wsRequestListeners[requestId] = {
				expires: expires,
				callback: callback,
				deferred: deferred
			};
			return deferred.promise;
		};

		this.unregisterWSRequestListener = function (requestId) {
			if (wsRequestListeners.hasOwnProperty(requestId)) {
				var requestListener = wsRequestListeners[requestId];
				requestListener.deferred.resolve();
				delete wsRequestListeners[requestId];
			}
		};

		var wsListenersCleaner = $interval(function () {
			var count = 0;
			var now = new Date().getTime();
			for (var requestId in wsRequestListeners) {
				_this.unregisterWSRequestListener();
				if (wsRequestListeners.hasOwnProperty(requestId)) {
					var requestListener = wsRequestListeners[requestId];
					if (requestListener.expires < now) {
						_this.unregisterWSRequestListener(requestId);
					}
				}
			}
			console.log(count + " websocket listeners cleaned");
		}, 60 * 1000); // every 60 seconds

		var notifLines = 0;
		this.notify = function (type, message) {
			console.log("Notification (" + type + ") :", message);
			if (message) {
				$timeout(function () {
					if (type === config.notif.INFO) {
						ngToast.info({
							content: message
						});
					} else if (type === config.notif.SUCCESS) {
						ngToast.success({
							content: message
						});
					} else if (type === config.notif.WARNING) {
						ngToast.warning({
							content: message
						});
					}
					webNotification.showNotification("Lnd Web Client notification", {
						body: message,
						icon: "favicon.ico",
						onClick: function (event) {
							console.log("Web notification clicked");
							event.currentTarget.close();
						},
						autoClose: 4000 // 4 seconds
					}, function onShow(error, hide) {
						if (error) {
							_this.alert("Unable to show web notification: " + error.message);
						} else {
							console.log("Web notification shown");
						}
					});
				});
				var index = -1;
				while ((index = message.indexOf("\n", index + 1)) > -1) {
					notifLines++;
				}
				var $notifObj = $("#notifications");
				var notifHtml = $notifObj.html();
				index = -1;
				var maxLogBuffer = _this.getConfigValue(
					config.keys.MAX_NOTIF_BUFFER, config.defaults.MAX_NOTIF_BUFFER);
				while (notifLines > maxLogBuffer) {
					index = notifHtml.indexOf("\n", index + 1);
					notifLines--;
				}
				notifHtml = notifHtml.substring(index + 1);
				var now = $filter("date")(new Date(), "yyyy-MM-dd HH:mm:ss Z");
				$notifObj.html(notifHtml + now + " - " + type + " - " + message + "\n");
				_this.nextTick(function () {
					$notifObj.scrollTop($notifObj[0].scrollHeight);
				});
			}
		};

		this.alert = function (message) {
			if (message && message.length > 0) {
				bootbox.alert(message);
			}
		};

		var fetchConfig = function () {
			configCache = localStorageService.get("config"); // update cache
			if (!configCache) { configCache = {}; }
			return configCache;
		};

		var writeConfig = function (config) {
			localStorageService.set("config", config);
			configCache = config; // update cache
			onConfigUpdate();
		};

		var fetchAddresses = function () {
			addressesCache = localStorageService.get("addresses"); // update cache
			if (!addressesCache) { addressesCache = {}; }
			return addressesCache;
		};

		var writeAddresses = function (addresses) {
			localStorageService.set("addresses", addresses);
			addressesCache = addresses; // update cache
		};

		var updateKnownPeers = function (peers, peersFromLnd) {
			var knownPeers = fetchKnownPeers();
			for (var i = 0; i < peers.length; i++) {
				var peer = peers[i];
				var knownPeer = knownPeers[peer.pub_key] || {};
				var knownPeerAddress = knownPeer.address;
				knownPeer = Object.assign(knownPeer, peer);
				if (peersFromLnd) {
					if (knownPeer.custom_alias && !peer.custom_alias) {
						// inject custom alias into lnd peer for easy display use
						peer.custom_alias = knownPeer.custom_alias;
						// inject color into lnd peer for easy display use
						peer.color = knownPeer.color;
					}
					if (knownPeerAddress && (knownPeerAddress != peer.address)) {
						var peerHostPort = peer.address.split(":");
						var knownPeerHostPort = knownPeer.address.split(":");
						knownPeer.address = peerHostPort[0] + ":" + knownPeerHostPort[1]; // keep overriden port
					}
					knownPeer.lastseen = new Date().getTime();
				}
				knownPeers[knownPeer.pub_key] = knownPeer;
			}
			writeKnownPeers(knownPeers);
			return knownPeers;
		};

		var fetchKnownPeers = function () {
			knownPeersCache = localStorageService.get("known_peers"); // update cache
			if (!knownPeersCache) { knownPeersCache = {}; }
			return knownPeersCache;
		};

		var writeKnownPeers = function (knownPeers) {
			localStorageService.set("known_peers", knownPeers);
			knownPeersCache = knownPeers; // update cache
		};

		var convertPropertiesToArray = function (obj) {
			var array = [];
			for (var key in obj) {
				array.push(obj[key]);
			}
			return array;
		};

		this.getInfo = function (useCache) {
			var deferred = $q.defer();
			if (useCache && infoCache) {
				deferred.resolve(infoCache);
			} else {
				$http.get(serverUrl(API.GETINFO)).then(function (response) {
					infoCache = response;
					deferred.resolve(response);
				}, function (err) {
					deferred.reject(err);
				});
			}
			return deferred.promise;
		};

		var updateKnownPeerWithNodeInfo = function (response) {
			if (response.data && response.data.node) {
				var node = response.data.node;
				_this.getKnownPeer(true, node.pub_key).then(function (knownPeer) {
					knownPeer = knownPeer || {};
					var previousKnownPeer = angular.copy(knownPeer);
					knownPeer.pub_key = node.pub_key;
					knownPeer.lastseen = new Date().getTime();
					knownPeer.last_update = node.last_update;
					knownPeer.alias = node.alias;
					knownPeer.color = node.color;
					if (node.addresses.length > 0) {
						// use node public address by default
						knownPeer.address = node.addresses[0].addr;
					}
					if (!knownPeer.custom_alias) {
						// Define node alias as custom alias if not hexa string
						var re = /^[a-fA-F0-9]+$/g;
						if (!re.test(node.alias)) {
							knownPeer.custom_alias = node.alias;
						}
					}
					// Save updated known peer
					_this.editKnownPeer(knownPeer).then(function (knownPeer) {
						if (!angular.equals(previousKnownPeer, knownPeer)) { // broadcast if known peer updated
							$rootScope.$broadcast(config.events.PEER_REFRESH, knownPeer);
						}
					}, function (err) {
						console.log(err);
					});
				}, function (err) {
					console.log(err);
				});
			}
		};

		this.getNodeInfo = function (pubkey) {
			var deferred = $q.defer();
			var data = { pubkey: pubkey };
			$http.post(serverUrl(API.GETNODEINFO), data).then(function (response) {
				updateKnownPeerWithNodeInfo(response);
				deferred.resolve(response);
			}, function (err) {
				deferred.reject(err);
			});
			return deferred.promise;
		};

		this.getNetworkInfo = function () {
			return $http.get(serverUrl(API.GETNETWORKINFO));
		};

		this.walletBalance = function () {
			return $http.get(serverUrl(API.WALLETBALANCE));
		};

		this.channelBalance = function () {
			return $http.get(serverUrl(API.CHANNELBALANCE));
		};

		this.getConfigValue = function (name, defaultValue) {
			var config = configCache ? configCache : fetchConfig();
			var value;
			if (config.hasOwnProperty(name)) {
				value = config[name];
			} else if (defaultValue) {
				config[name] = defaultValue;
				writeConfig(config);
				value = defaultValue;
			}
			return value;
		};

		this.setConfigValue = function (name, value) {
			var config = configCache ? configCache : fetchConfig();
			config[name] = value;
			writeConfig(config);
			return true;
		};

		this.getConfigValues = function () {
			var config = configCache ? configCache : fetchConfig();
			return angular.copy(config);
		};

		this.setConfigValues = function (values) {
			var deferred = $q.defer();
			try {
				if (values) {
					var config = configCache ? configCache : fetchConfig();
					for (var name in values) {
						if (values.hasOwnProperty(name)) {
							config[name] = values[name];
						}
					}
					writeConfig(config);
				}
				deferred.resolve(true);
			} catch (err) {
				deferred.reject(err);
			}
			return deferred.promise;
		};

		this.getAddresses = function () {
			var addresses = addressesCache ? addressesCache : fetchAddresses();
			return angular.copy(addresses);
		};

		this.addAddress = function (name, address) {
			var addresses = addressesCache ? addressesCache : fetchAddresses();
			addresses[name] = address;
			writeAddresses(addresses);
			return true;
		};

		this.addAddresses = function (newAddresses) {
			var deferred = $q.defer();
			try {
				if (values) {
					var addresses = addressesCache ? addressesCache : fetchAddresses();
					for (var name in newAddresses) {
						if (newAddresses.hasOwnProperty(name)) {
							addresses[name] = newAddresses[name];
						}
					}
					writeAddresses(addresses);
				}
				deferred.resolve(true);
			} catch (err) {
				deferred.reject(err);
			}
			return deferred.promise;
		};

		this.listPeers = function (useCache) {
			var deferred = $q.defer();
			if (useCache && peersCache) {
				deferred.resolve(peersCache);
			} else {
				$http.get(serverUrl(API.LISTPEERS)).then(function (response) {
					if (response.data && response.data.peers) {
						updateKnownPeers(response.data.peers, true);
					}
					peersCache = response;
					deferred.resolve(response);
				}, function (err) {
					deferred.reject(err);
				});
			}
			return deferred.promise;
		};

		this.getKnownPeers = function (useCache) {
			var deferred = $q.defer();
			if (useCache && knownPeersCache) {
				deferred.resolve(knownPeersCache);
			} else {
				deferred.resolve(fetchKnownPeers());
			}
			return deferred.promise;
		};

		this.getKnownPeer = function (useCache, nodePubKey) {
			var deferred = $q.defer();
			_this.getKnownPeers(useCache).then(function (knownPeers) {
				if (knownPeers) {
					deferred.resolve(knownPeers[nodePubKey]);
				} else {
					deferred.reject("Peer not found");
				}
			}, function (err) {
				deferred.reject(err);
			});
			return deferred.promise;
		};

		this.listKnownPeers = function (useCache) {
			var deferred = $q.defer();
			if (useCache && knownPeersCache) {
				deferred.resolve(convertPropertiesToArray(knownPeersCache));
			} else {
				deferred.resolve(convertPropertiesToArray(fetchKnownPeers()));
			}
			return deferred.promise;
		};

		this.importKnownPeers = function (knownPeers) {
			var deferred = $q.defer();
			deferred.resolve(updateKnownPeers(knownPeers, false));
			return deferred.promise;
		};

		this.editKnownPeer = function (knownPeer) {
			var deferred = $q.defer();
			updateKnownPeers([knownPeer], false);
			deferred.resolve(knownPeer);
			return deferred.promise;
		};

		this.removeKnownPeer = function (knownPeerPubKey) {
			var deferred = $q.defer();
			var knownPeers = fetchKnownPeers();
			if (knownPeers.hasOwnProperty(knownPeerPubKey)) {
				delete knownPeers[knownPeerPubKey];
				writeKnownPeers(knownPeers);
				deferred.resolve(true);
			} else {
				deferred.resolve(false);
			}
			return deferred.promise;
		};

		this.listChannels = function (useCache) {
			var deferred = $q.defer();
			if (useCache && channelsCache) {
				deferred.resolve(channelsCache);
			} else {
				if (channelsFetchers) {
					channelsFetchers.push(deferred);
				} else {
					channelsFetchers = [];
					channelsFetchers.push(deferred);
					$http.get(serverUrl(API.LISTCHANNELS)).then(function (response) {
						channelsCache = response;
						while (channelsFetchers.length) {
							try {
								channelsFetchers.pop().resolve(response);
							} catch (e) {
							}
						}
						channelsFetchers = null;
					}, function (err) {
						while (channelsFetchers.length) {
							try {
								channelsFetchers.pop().reject(err);
							} catch (e) {
							}
						}
						channelsFetchers = null;
					});
				}
			}
			return deferred.promise;
		};

		this.pendingChannels = function () {
			return $http.get(serverUrl(API.PENDINGCHANNELS));
		};

		this.listPayments = function () {
			return $http.get(serverUrl(API.LISTPAYMENTS));
		};

		this.listInvoices = function () {
			return $http.get(serverUrl(API.LISTINVOICES));
		};

		this.forwardingHistory = function () {
			return $http.get(serverUrl(API.FORWARDINGHISTORY));
		};

		this.connectPeer = function (pubkey, host) {
			var data = { pubkey: pubkey, host: host };
			return $http.post(serverUrl(API.CONNECTPEER), data);
		};

		this.disconnectPeer = function (pubkey) {
			var data = { pubkey: pubkey };
			return $http.post(serverUrl(API.DISCONNECTPEER), data);
		};

		this.openChannel = function (pubkey, localamt, pushamt, satperbyte, targetconf, remotecsvdelay, privatechan) {
			var deferred = $q.defer();
			var data = {
				rid: uuid.v4(),
				pubkey: pubkey, localamt: localamt, pushamt: pushamt,
				satperbyte: satperbyte, targetconf: targetconf,
				remotecsvdelay: remotecsvdelay, privatechan: privatechan
			};
			socket.emit(config.events.OPENCHANNEL_WS, data, function (response) {
				if (response.error) {
					deferred.reject(response.error);
				} else {
					deferred.resolve(response);
				}
			});
			return deferred.promise;
		};

		this.closeChannel = function (fundingTxId, outputIndex, force) {
			var deferred = $q.defer();
			var data = { rid: uuid.v4(), funding_txid: fundingTxId, output_index: outputIndex, force: force };
			socket.emit(config.events.CLOSECHANNEL_WS, data, function (response) {
				if (response.error) {
					deferred.reject(response.error);
				} else {
					deferred.resolve(response);
				}
			});
			return deferred.promise;
		};

		this.addInvoice = function (memo, value, expiry) {
			var data = { memo: memo, value: value, expiry: expiry };
			return $http.post(serverUrl(API.ADDINVOICE), data);
		};

		this.sendCoins = function (addr, amount) {
			var data = { addr: addr, amount: amount };
			return $http.post(serverUrl(API.SENDCOINS), data);
		};

		this.sendPayment = function (payreq, amount = null) {
			var data = { payreq: payreq };
			if (amount) { data.amt = amount; }
			return $http.post(serverUrl(API.SENDPAYMENT), data);
		};

		this.decodePayReq = function (payreq) {
			var data = { payreq: payreq };
			return $http.post(serverUrl(API.DECODEPAYREQ), data);
		};

		this.queryRoute = function (pubkey, amount) {
			var data = { pubkey: pubkey, amt: amount };
			return $http.post(serverUrl(API.QUERYROUTE), data);
		};

		this.newAddress = function (type) {
			var data = { type: type };
			return $http.post(serverUrl(API.NEWADDRESS), data);
		};

		this.renderGraph = function () {
			var deferred = $q.defer();
			_this.getKnownPeers(true).then(function (knownPeers) {
				var data = { peers: knownPeers };
				$http.post(serverUrl(API.RENDERGRAPH), data).then(function (response) {
					deferred.resolve(response);
				}, function (err) {
					deferred.reject(err);
				});
			}, function (err) {
				deferred.reject(err);
			});
			return deferred.promise;
		};

		this.signMessage = function (message) {
			var data = { msg: message };
			return $http.post(serverUrl(API.SIGNMESSAGE), data);
		};

		this.verifyMessage = function (message, signature) {
			var data = { msg: message, signature: signature };
			return $http.post(serverUrl(API.VERIFYMESSAGE), data);
		};

		var onConfigUpdate = function () {
			refreshLogFilterPattern();
		};

		var refreshLogFilterPattern = function () {
			var logFilterPattern = _this.getConfigValue(config.keys.LOG_FILTER_PATTERN);
			if (!_this.restrictedUser && logFilterPattern) {
				$("#logpanel").show();
				socket.emit(config.events.LOGFILTER_WS, { rid: uuid.v4(), logFilterPattern: logFilterPattern });
			} else {
				$("#logpanel").hide();
			}
		};

		var isTestnet = function () {
			return (infoCache && infoCache.data) ? infoCache.data.testnet : true;
		};

		this.getTransactionURL = function (txId) {
			var transactionUrl;
			if (isTestnet()) {
				transactionUrl = _this.getConfigValue(
					config.keys.EXPLORER_TX_BITCOIN_TESTNET, config.defaults.EXPLORER_TX_BITCOIN_TESTNET);
			} else {
				transactionUrl = _this.getConfigValue(
					config.keys.EXPLORER_TX_BITCOIN_MAINNET, config.defaults.EXPLORER_TX_BITCOIN_MAINNET);
			}
			return utils.format(transactionUrl, txId);
		};

		this.getBlockByHashURL = function (hash) {
			var blockUrl;
			if (isTestnet()) {
				blockUrl = _this.getConfigValue(
					config.keys.EXPLORER_BLKHASH_BITCOIN_TESTNET, config.defaults.EXPLORER_BLKHASH_BITCOIN_TESTNET);
			} else {
				blockUrl = _this.getConfigValue(
					config.keys.EXPLORER_BLKHASH_BITCOIN_MAINNET, config.defaults.EXPLORER_BLKHASH_BITCOIN_MAINNET);
			}
			return utils.format(blockUrl, hash);
		};

		this.getBlockByHeightURL = function (height) {
			var blockUrl;
			if (isTestnet()) {
				blockUrl = _this.getConfigValue(
					config.keys.EXPLORER_BLKHEIGHT_BITCOIN_TESTNET, config.defaults.EXPLORER_BLKHEIGHT_BITCOIN_TESTNET);
			} else {
				blockUrl = _this.getConfigValue(
					config.keys.EXPLORER_BLKHEIGHT_BITCOIN_MAINNET, config.defaults.EXPLORER_BLKHEIGHT_BITCOIN_MAINNET);
			}
			return utils.format(blockUrl, height);
		};

		this.getCoinPrice = function (useCache, currency) {
			var deferred = $q.defer();
			var now = new Date().getTime();
			if (useCache && pricesCache && (pricesCache.ts > (now - PRICE_CACHE_MAXAGE))) {
				try {
					var price = pricesCache.data[currency.toUpperCase()].last;
					deferred.resolve(price);
				} catch (err) {
					deferred.reject(err);
				}
			} else {
				if (pricesFetchers) {
					pricesFetchers.push(deferred);
				} else {
					pricesFetchers = [];
					pricesFetchers.push(deferred);
					$http.get(BLOCKCHAIN_INFO_TICKER_URL).then(function (response) {
						try {
							pricesCache = { data: response.data, ts: now };
							var price = pricesCache.data[currency.toUpperCase()].last;
							while (pricesFetchers.length) {
								try {
									pricesFetchers.pop().resolve(price);
								} catch (e) {
								}
							}
						} catch (err) {
							while (pricesFetchers.length) {
								try {
									pricesFetchers.pop().reject(err);
								} catch (e) {
								}
							}
						}
						pricesFetchers = null;
					}, function (err) {
						while (pricesFetchers.length) {
							try {
								pricesFetchers.pop().reject(err);
							} catch (e) {
							}
						}
						pricesFetchers = null;
					});
				}
			}
			return deferred.promise;
		};

		Object.seal(this);
	};

})();
