"use strict";
(function () {

	lnwebcli.service("lncli", ["$http", "$q", "localStorageService", service]);

	function service($http, $q, localStorageService) {
		
		var API = {
			LISTPEERS: "/api/listpeers",
			LISTCHANNELS: "/api/listchannels",
			OPENCHANNEL: "/api/openchannel",
			CLOSECHANNEL: "/api/closechannel"
		};

		var peersCache = null;
		var channelsCache = null;
		var knownPeersCache = null;
		
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

		this.getInfo = function() {
			return $http.get('/api/getinfo');
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
					deferred.reject(response);
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

		this.listChannels = function(useCache) {
			var deferred = $q.defer();
			if (useCache && channelsCache) {
				deferred.resolve(channelsCache);
			} else {
				$http.get(API.LISTCHANNELS).then(function (response) {
					channelsCache = response;
					deferred.resolve(response);
				}, function (err) {
					deferred.reject(response);
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

		this.editKnownPeer = function(knownPeer) {
			var deferred = $q.defer();
			updateKnownPeers([knownPeer]);
			deferred.resolve(knownPeer);
			return deferred.promise;
		};

		Object.seal(this);
	}

})();
