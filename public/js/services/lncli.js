"use strict";
(function () {

	lnwebcli.service("lncli", ["$http", "$timeout", "$q", "ngToast", "localStorageService", service]);

	function service($http, $timeout, $q, ngToast, localStorageService) {
		
		var API = {
			GETINFO: "/api/getinfo",
			LISTPEERS: "/api/listpeers",
			LISTCHANNELS: "/api/listchannels",
			OPENCHANNEL: "/api/openchannel",
			CLOSECHANNEL: "/api/closechannel"
		};

		var socket = io.connect("/", { secure: "https" === location.protocol });

		socket.on("invoice", function(data) {
			console.log("Invoice received:", data);
			$timeout(function() {
				ngToast.success({
					content: "Payment received: " + data.value + ", " + data.memo
				});
			});
		});

		socket.on("hello", function(data) {
			console.log("Hello event received:", data);
			var helloMsg = ((data && data.remoteAddress) ? data.remoteAddress + " s" : "S") + "ucessfully connected!"
			$timeout(function() {
				ngToast.success({
					content: helloMsg
				});
			});
		});

		var infoCache = null;
		var peersCache = null;
		var channelsCache = null;
		var knownPeersCache = null;
		var configCache = null;

		var fetchConfig= function () {
			configCache = localStorageService.get("config"); // update cache
			if (!configCache) { configCache = {}; }
			return configCache;
		}

		var writeConfig = function (config) {
			localStorageService.set("config", config);
			configCache = config; // update cache
		}

		var updateKnownPeers = function (peers) {
			var knownPeers = fetchKnownPeers();
			for (var i = 0; i < peers.length; i++) {
				var peer = peers[i];
				var knownPeer = knownPeers[peer.pub_key];
				if (knownPeer && knownPeer.alias && !peer.alias) {
					peer.alias = knownPeer.alias; // to keep peer alias around
				}
				knownPeers[peer.pub_key] = peer;
			}
			writeKnownPeers(knownPeers);
			return knownPeers;
		}

		var fetchKnownPeers = function () {
			knownPeersCache = localStorageService.get("known_peers"); // update cache
			if (!knownPeersCache) { knownPeersCache = {}; }
			return knownPeersCache;
		}

		var writeKnownPeers = function (knownPeers) {
			localStorageService.set("known_peers", knownPeers);
			knownPeersCache = knownPeers; // update cache
		};

		var convertPropertiesToArray = function (obj) {
			var array = [];
			for(var key in obj) {
				array.push(obj[key]);
			}
			return array;
		};

		this.getInfo = function(useCache) {
			var deferred = $q.defer();
			if (useCache && infoCache) {
				deferred.resolve(infoCache);
			} else {
				$http.get(API.GETINFO).then(function (response) {
					infoCache = response;
					deferred.resolve(response);
				}, function (err) {
					deferred.reject(err);
				});
			}
			return deferred.promise;
		};

		this.getNetworkInfo = function() {
			return $http.get('/api/getnetworkinfo');
		};

		this.walletBalance = function() {
			return $http.get('/api/walletbalance');
		};

		this.channelBalance = function() {
			return $http.get('/api/channelbalance');
		};

		this.getConfigValue = function(name, defaultValue) {
			var config = configCache ? configCache : fetchConfig();
			var value = config[name];
			if (!value && defaultValue) {
				config[name] = defaultValue;
				writeConfig(config);
			}
			return value;
		}

		this.setConfigValue = function(name, value) {
			var config = configCache ? configCache : fetchConfig();
			config[name] = value;
			writeConfig(config);
			return true;
		}

		this.getConfigValues = function() {
			var config = configCache ? configCache : fetchConfig();
			return angular.copy(config);
		}

		this.setConfigValues = function(values) {
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
		}

		this.listPeers = function(useCache) {
			var deferred = $q.defer();
			if (useCache && peersCache) {
				deferred.resolve(peersCache);
			} else {
				$http.get(API.LISTPEERS).then(function (response) {
					if (response.data && response.data.peers) {
						updateKnownPeers(response.data.peers);
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
			deferred.resolve(updateKnownPeers(knownPeers));
			return deferred.promise;
		};

		this.editKnownPeer = function(knownPeer) {
			var deferred = $q.defer();
			updateKnownPeers([knownPeer]);
			deferred.resolve(knownPeer);
			return deferred.promise;
		};

		this.removeKnownPeer = function(knownPeerPubKey) {
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

		this.listChannels = function(useCache) {
			var deferred = $q.defer();
			if (useCache && channelsCache) {
				deferred.resolve(channelsCache);
			} else {
				$http.get(API.LISTCHANNELS).then(function (response) {
					channelsCache = response;
					deferred.resolve(response);
				}, function (err) {
					deferred.reject(err);
				});
			}
			return deferred.promise;
		};

		this.pendingChannels = function() {
			return $http.get('/api/pendingchannels');
		};

		this.listPayments = function() {
			return $http.get('/api/listpayments');
		};

		this.listInvoices = function() {
			return $http.get('/api/listinvoices');
		};

		this.connectPeer = function(pubkey, host) {
			var data = { pubkey: pubkey, host: host };
			return $http.post('/api/connectpeer', data);
		};

		this.openChannel = function(pubkey, localamt, pushamt, numconf) {
			var data = { pubkey: pubkey, localamt: localamt, pushamt: pushamt, numconf: numconf };
			return $http.post(API.OPENCHANNEL, data);
		};

		this.closeChannel = function(funding_txid, output_index, force) {
			var data = { funding_txid: funding_txid, output_index: output_index, force: force };
			return $http.post(API.CLOSECHANNEL, data);
		};

		this.addInvoice = function(memo, value) {
			var data = { memo: memo, value: value };
			return $http.post('/api/addinvoice', data);
		};

		this.sendPayment = function(payreq) {
			var data = { payreq: payreq };
			return $http.post('/api/sendpayment', data);
		};

		this.decodePayReq = function(payreq) {
			var data = { payreq: payreq };
			return $http.post('/api/decodepayreq', data);
		};

		this.queryRoute = function(pubkey, amount) {
			var data = { pubkey: pubkey, amt: amount };
			return $http.post('/api/queryroute', data);
		};

		Object.seal(this);
	}

})();
