(function lncli() {
  module.exports = function factory(
    $rootScope, $filter, $http, $timeout, $interval, $q, ngToast, bootbox, localStorageService,
    $, config, uuid, webNotification, iosocket, utils,
  ) {
    const self = this;

    const API = {
      GETINFO: '/api/lnd/getinfo',
      GETNODEINFO: '/api/lnd/getnodeinfo',
      GETNETWORKINFO: '/api/lnd/getnetworkinfo',
      WALLETBALANCE: '/api/lnd/walletbalance',
      CHANNELBALANCE: '/api/lnd/channelbalance',
      LISTPEERS: '/api/lnd/listpeers',
      LISTCHANNELS: '/api/lnd/listchannels',
      PENDINGCHANNELS: '/api/lnd/pendingchannels',
      LISTPAYMENTS: '/api/lnd/listpayments',
      LISTINVOICES: '/api/lnd/listinvoices',
      FORWARDINGHISTORY: '/api/lnd/forwardinghistory',
      CONNECTPEER: '/api/lnd/connectpeer',
      DISCONNECTPEER: '/api/lnd/disconnectpeer',
      ADDINVOICE: '/api/lnd/addinvoice',
      SENDCOINS: '/api/lnd/sendcoins',
      SENDPAYMENT: '/api/lnd/sendpayment',
      SENDTOROUTE: '/api/lnd/sendtoroute',
      DECODEPAYREQ: '/api/lnd/decodepayreq',
      QUERYROUTE: '/api/lnd/queryroute',
      NEWADDRESS: '/api/lnd/newaddress',
      RENDERGRAPH: '/api/lnd/rendergraph',
      SIGNMESSAGE: '/api/lnd/signmessage',
      VERIFYMESSAGE: '/api/lnd/verifymessage',
    };

    const BLOCKCHAIN_INFO_TICKER_URL = 'https://blockchain.info/ticker';
    const PRICE_CACHE_MAXAGE = 30 * 1000;

    this.restrictedUser = false;

    let infoCache = null;
    let peersCache = null;
    let channelsCache = null;
    let knownPeersCache = null;
    let configCache = null;
    let addressesCache = null;
    let channelsFetchers = null;
    let pricesCache = null;
    let pricesFetchers = null;
    const wsRequestListeners = {};

    // endpoint parameter -> LND Chrome Extension, window.serverRootPath -> Electron
    const endPoint = utils.getUrlParameterByName('endpoint') || window.serverRootPath;

    const serverUrl = path => (endPoint ? endPoint + path : path);

    this.getEndPoint = () => (endPoint || window.location.origin);

    const isSecure = () => (endPoint
      ? endPoint.toLowerCase().startsWith('https:')
      : window.location.protocol.startsWith('https'));

    const socket = iosocket.connect(serverUrl('/'), { secure: isSecure() });

    const refreshLogFilterPattern = () => {
      const logFilterPattern = self.getConfigValue(config.keys.LOG_FILTER_PATTERN);
      if (!self.restrictedUser && logFilterPattern) {
        $('#logpanel').show();
        socket.emit(config.events.LOGFILTER_WS, { rid: uuid.v4(), logFilterPattern });
      } else {
        $('#logpanel').hide();
      }
    };

    const onConfigUpdate = () => {
      refreshLogFilterPattern();
    };

    const wsRequestListenersFilter = (response) => {
      if (Object.prototype.hasOwnProperty.call(wsRequestListeners, response.rid)) {
        return wsRequestListeners[response.rid].callback(response);
      }
      return true;
    };

    this.registerWSRequestListener = (requestId, callback, expires) => {
      const deferred = $q.defer();
      const expires2 = expires || new Date().getTime() + 5 * 60 * 1000; // defaults to five minutes
      wsRequestListeners[requestId] = {
        expires2,
        callback,
        deferred,
      };
      return deferred.promise;
    };

    this.unregisterWSRequestListener = (requestId) => {
      if (Object.prototype.hasOwnProperty.call(wsRequestListeners, requestId)) {
        const requestListener = wsRequestListeners[requestId];
        requestListener.deferred.resolve();
        delete wsRequestListeners[requestId];
      }
    };

    /* const wsListenersCleaner = */ $interval(() => {
      let count = 0;
      const now = new Date().getTime();
      Object.entries(wsRequestListeners).forEach(([requestId, requestListener]) => {
        if (requestListener.expires < now) {
          self.unregisterWSRequestListener(requestId);
          count += 1;
        }
      });
      console.log(`${count} websocket listeners cleaned`);
    }, 60 * 1000); // every 60 seconds

    let notifLines = 0;
    this.notify = (type, message) => {
      console.log(`Notification (${type}) :`, message);
      if (message) {
        $timeout(() => {
          if (type === config.notif.INFO) {
            ngToast.info({
              content: message,
            });
          } else if (type === config.notif.SUCCESS) {
            ngToast.success({
              content: message,
            });
          } else if (type === config.notif.WARNING) {
            ngToast.warning({
              content: message,
            });
          }
          webNotification.showNotification('Lnd Web Client notification', {
            body: message,
            icon: 'favicon.ico',
            onClick(event) {
              console.log('Web notification clicked');
              event.currentTarget.close();
            },
            autoClose: 4000, // 4 seconds
          }, (error /* , hide */) => {
            if (error) {
              self.alert(`Unable to show web notification: ${error.message}`);
            } else {
              console.log('Web notification shown');
            }
          });
        });
        let index = -1;
        for ((index = message.indexOf('\n', index + 1)); index > -1;) {
          notifLines += 1;
        }
        const $notifObj = $('#notifications');
        let notifHtml = $notifObj.html();
        index = -1;
        const maxLogBuffer = self.getConfigValue(
          config.keys.MAX_NOTIF_BUFFER, config.defaults.MAX_NOTIF_BUFFER,
        );
        while (notifLines > maxLogBuffer) {
          index = notifHtml.indexOf('\n', index + 1);
          notifLines -= 1;
        }
        notifHtml = notifHtml.substring(index + 1);
        const now = $filter('date')(new Date(), 'yyyy-MM-dd HH:mm:ss Z');
        $notifObj.html(`${notifHtml + now} - ${type} - ${message}\n`);
        self.nextTick(() => {
          $notifObj.scrollTop($notifObj[0].scrollHeight);
        });
      }
    };

    this.alert = (message) => {
      if (message && message.length > 0) {
        bootbox.alert(message);
      }
    };

    const fetchConfig = () => {
      configCache = localStorageService.get('config'); // update cache
      if (!configCache) { configCache = {}; }
      return configCache;
    };

    const writeConfig = (configToWrite) => {
      localStorageService.set('config', configToWrite);
      configCache = configToWrite; // update cache
      onConfigUpdate();
    };

    const fetchAddresses = () => {
      addressesCache = localStorageService.get('addresses'); // update cache
      if (!addressesCache) { addressesCache = {}; }
      return addressesCache;
    };

    const writeAddresses = (addresses) => {
      localStorageService.set('addresses', addresses);
      addressesCache = addresses; // update cache
    };

    const fetchKnownPeers = () => {
      knownPeersCache = localStorageService.get('known_peers'); // update cache
      if (!knownPeersCache) { knownPeersCache = {}; }
      return knownPeersCache;
    };

    const writeKnownPeers = (knownPeers) => {
      localStorageService.set('known_peers', knownPeers);
      knownPeersCache = knownPeers; // update cache
    };

    const updateKnownPeers = (peers, peersFromLnd) => {
      const knownPeers = fetchKnownPeers();
      for (let i = 0; i < peers.length; i += 1) {
        const peer = peers[i];
        let knownPeer = knownPeers[peer.pub_key] || {};
        const knownPeerAddress = knownPeer.address;
        knownPeer = Object.assign(knownPeer, peer);
        if (peersFromLnd) {
          if (knownPeer.custom_alias && !peer.custom_alias) {
            // inject custom alias into lnd peer for easy display use
            peer.custom_alias = knownPeer.custom_alias;
            // inject color into lnd peer for easy display use
            peer.color = knownPeer.color;
          }
          if (knownPeerAddress && (knownPeerAddress !== peer.address)) {
            const peerHostPort = peer.address.split(':');
            const knownPeerHostPort = knownPeerAddress.split(':');
            knownPeer.address = `${peerHostPort[0]}:${knownPeerHostPort[1]}`; // keep overriden port
          }
          knownPeer.lastseen = new Date().getTime();
        }
        knownPeers[knownPeer.pub_key] = knownPeer;
      }
      writeKnownPeers(knownPeers);
      return knownPeers;
    };

    const convertPropertiesToArray = obj => Object.values(obj);

    this.getInfo = (useCache) => {
      const deferred = $q.defer();
      if (useCache && infoCache) {
        deferred.resolve(infoCache);
      } else {
        $http.get(serverUrl(API.GETINFO)).then((response) => {
          infoCache = response;
          deferred.resolve(response);
        }, (err) => {
          deferred.reject(err);
        });
      }
      return deferred.promise;
    };

    const updateKnownPeerWithNodeInfo = (response) => {
      if (response.data && response.data.node) {
        const { node } = response.data;
        self.getKnownPeer(true, node.pub_key).then((knownPeerGot) => {
          const knownPeer = knownPeerGot || {};
          const previousKnownPeer = angular.copy(knownPeer);
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
            const re = /^[a-fA-F0-9]+$/g;
            if (!re.test(node.alias)) {
              knownPeer.custom_alias = node.alias;
            }
          }
          // Save updated known peer
          self.editKnownPeer(knownPeer).then((knownPeerEdited) => {
            if (!angular.equals(previousKnownPeer, knownPeerEdited)) {
              // broadcast if known peer updated
              $rootScope.$broadcast(config.events.PEER_REFRESH, knownPeerEdited);
            }
          }, (err) => {
            console.log(err);
          });
        }, (err) => {
          console.log(err);
        });
      }
    };

    this.getNodeInfo = (pubkey) => {
      const deferred = $q.defer();
      const data = { pubkey };
      $http.post(serverUrl(API.GETNODEINFO), data).then((response) => {
        updateKnownPeerWithNodeInfo(response);
        deferred.resolve(response);
      }, (err) => {
        deferred.reject(err);
      });
      return deferred.promise;
    };

    this.getNetworkInfo = () => $http.get(serverUrl(API.GETNETWORKINFO));

    this.walletBalance = () => $http.get(serverUrl(API.WALLETBALANCE));

    this.channelBalance = () => $http.get(serverUrl(API.CHANNELBALANCE));

    this.getConfigValue = (name, defaultValue) => {
      const configuration = configCache || fetchConfig();
      let value;
      if (Object.prototype.hasOwnProperty.call(configuration, name)) {
        value = configuration[name];
      } else if (defaultValue) {
        configuration[name] = defaultValue;
        writeConfig(configuration);
        value = defaultValue;
      }
      return value;
    };

    this.setConfigValue = (name, value) => {
      const configuration = configCache || fetchConfig();
      configuration[name] = value;
      writeConfig(configuration);
      return true;
    };

    this.getConfigValues = () => {
      const configuration = configCache || fetchConfig();
      return angular.copy(configuration);
    };

    this.setConfigValues = (values) => {
      const deferred = $q.defer();
      try {
        if (values) {
          const configuration = configCache || fetchConfig();
          Object.entries(values).forEach(([name, value]) => {
            configuration[name] = value;
          });
          writeConfig(configuration);
        }
        deferred.resolve(true);
      } catch (err) {
        deferred.reject(err);
      }
      return deferred.promise;
    };

    this.getAddresses = () => {
      const addresses = addressesCache || fetchAddresses();
      return angular.copy(addresses);
    };

    this.addAddress = (name, address) => {
      const addresses = addressesCache || fetchAddresses();
      addresses[name] = address;
      writeAddresses(addresses);
      return true;
    };

    this.addAddresses = (newAddresses) => {
      const deferred = $q.defer();
      try {
        if (newAddresses) {
          const addresses = addressesCache || fetchAddresses();
          Object.entries(newAddresses).forEach(([name, address]) => {
            addresses[name] = address;
          });
          writeAddresses(addresses);
        }
        deferred.resolve(true);
      } catch (err) {
        deferred.reject(err);
      }
      return deferred.promise;
    };

    this.listPeers = (useCache) => {
      const deferred = $q.defer();
      if (useCache && peersCache) {
        deferred.resolve(peersCache);
      } else {
        $http.get(serverUrl(API.LISTPEERS)).then((response) => {
          if (response.data && response.data.peers) {
            updateKnownPeers(response.data.peers, true);
          }
          peersCache = response;
          deferred.resolve(response);
        }, (err) => {
          deferred.reject(err);
        });
      }
      return deferred.promise;
    };

    this.getKnownPeers = (useCache) => {
      const deferred = $q.defer();
      if (useCache && knownPeersCache) {
        deferred.resolve(knownPeersCache);
      } else {
        deferred.resolve(fetchKnownPeers());
      }
      return deferred.promise;
    };

    this.getKnownPeer = (useCache, nodePubKey) => {
      const deferred = $q.defer();
      self.getKnownPeers(useCache).then((knownPeers) => {
        if (knownPeers) {
          deferred.resolve(knownPeers[nodePubKey]);
        } else {
          deferred.reject('Peer not found');
        }
      }, (err) => {
        deferred.reject(err);
      });
      return deferred.promise;
    };

    this.listKnownPeers = (useCache) => {
      const deferred = $q.defer();
      if (useCache && knownPeersCache) {
        deferred.resolve(convertPropertiesToArray(knownPeersCache));
      } else {
        deferred.resolve(convertPropertiesToArray(fetchKnownPeers()));
      }
      return deferred.promise;
    };

    this.importKnownPeers = (knownPeers) => {
      const deferred = $q.defer();
      deferred.resolve(updateKnownPeers(knownPeers, false));
      return deferred.promise;
    };

    this.editKnownPeer = (knownPeer) => {
      const deferred = $q.defer();
      updateKnownPeers([knownPeer], false);
      deferred.resolve(knownPeer);
      return deferred.promise;
    };

    this.removeKnownPeer = (knownPeerPubKey) => {
      const deferred = $q.defer();
      const knownPeers = fetchKnownPeers();
      if (Object.prototype.hasOwnProperty.call(knownPeers, knownPeerPubKey)) {
        delete knownPeers[knownPeerPubKey];
        writeKnownPeers(knownPeers);
        deferred.resolve(true);
      } else {
        deferred.resolve(false);
      }
      return deferred.promise;
    };

    this.listChannels = (useCache) => {
      const deferred = $q.defer();
      if (useCache && channelsCache) {
        deferred.resolve(channelsCache);
      } else if (channelsFetchers) {
        channelsFetchers.push(deferred);
      } else {
        channelsFetchers = [];
        channelsFetchers.push(deferred);
        $http.get(serverUrl(API.LISTCHANNELS)).then((response) => {
          channelsCache = response;
          while (channelsFetchers.length) {
            try {
              channelsFetchers.pop().resolve(response);
            } catch (e) {
              // Nothing to do
            }
          }
          channelsFetchers = null;
        }, (err) => {
          while (channelsFetchers.length) {
            try {
              channelsFetchers.pop().reject(err);
            } catch (e) {
              // Nothing to do
            }
          }
          channelsFetchers = null;
        });
      }
      return deferred.promise;
    };

    this.pendingChannels = () => $http.get(serverUrl(API.PENDINGCHANNELS));

    this.listPayments = () => $http.get(serverUrl(API.LISTPAYMENTS));

    this.listInvoices = () => $http.get(serverUrl(API.LISTINVOICES));

    this.forwardingHistory = () => $http.get(serverUrl(API.FORWARDINGHISTORY));

    this.connectPeer = (pubkey, host) => {
      const data = { pubkey, host };
      return $http.post(serverUrl(API.CONNECTPEER), data);
    };

    this.disconnectPeer = (pubkey) => {
      const data = { pubkey };
      return $http.post(serverUrl(API.DISCONNECTPEER), data);
    };

    this.openChannel = (
      pubkey, localamt, pushamt, satperbyte,
      targetconf, remotecsvdelay, privatechan,
    ) => {
      const deferred = $q.defer();
      const data = {
        rid: uuid.v4(),
        pubkey,
        localamt,
        pushamt,
        satperbyte,
        targetconf,
        remotecsvdelay,
        privatechan,
      };
      socket.emit(config.events.OPENCHANNEL_WS, data, (response) => {
        if (response.error) {
          deferred.reject(response.error);
        } else {
          deferred.resolve(response);
        }
      });
      return deferred.promise;
    };

    this.closeChannel = (fundingTxId, outputIndex, force) => {
      const deferred = $q.defer();
      const data = {
        rid: uuid.v4(), funding_txid: fundingTxId, output_index: outputIndex, force,
      };
      socket.emit(config.events.CLOSECHANNEL_WS, data, (response) => {
        if (response.error) {
          deferred.reject(response.error);
        } else {
          deferred.resolve(response);
        }
      });
      return deferred.promise;
    };

    this.addInvoice = (memo, value, expiry) => {
      const data = { memo, value, expiry };
      return $http.post(serverUrl(API.ADDINVOICE), data);
    };

    this.sendCoins = (addr, amount) => {
      const data = { addr, amount };
      return $http.post(serverUrl(API.SENDCOINS), data);
    };

    this.sendPayment = (payreq, amount = null) => {
      const data = { payreq };
      if (amount) { data.amt = amount; }
      return $http.post(serverUrl(API.SENDPAYMENT), data);
    };

    this.sendToRoute = (payhash, routes) => {
      const data = { payhash, routes };
      return $http.post(serverUrl(API.SENDTOROUTE), data);
    };

    this.decodePayReq = (payreq) => {
      const data = { payreq };
      return $http.post(serverUrl(API.DECODEPAYREQ), data);
    };

    this.queryRoute = (pubkey, amount) => {
      const data = { pubkey, amt: amount };
      return $http.post(serverUrl(API.QUERYROUTE), data);
    };

    this.newAddress = (type) => {
      const data = { type };
      return $http.post(serverUrl(API.NEWADDRESS), data);
    };

    this.renderGraph = () => {
      const deferred = $q.defer();
      self.getKnownPeers(true).then((knownPeers) => {
        const data = { peers: knownPeers };
        $http.post(serverUrl(API.RENDERGRAPH), data).then((response) => {
          deferred.resolve(response);
        }, (err) => {
          deferred.reject(err);
        });
      }, (err) => {
        deferred.reject(err);
      });
      return deferred.promise;
    };

    this.signMessage = (message) => {
      const data = { msg: message };
      return $http.post(serverUrl(API.SIGNMESSAGE), data);
    };

    this.verifyMessage = (message, signature) => {
      const data = { msg: message, signature };
      return $http.post(serverUrl(API.VERIFYMESSAGE), data);
    };

    const isTestnet = () => ((infoCache && infoCache.data) ? infoCache.data.testnet : true);

    this.getTransactionURL = (txId) => {
      let transactionUrl;
      if (isTestnet()) {
        transactionUrl = self.getConfigValue(
          config.keys.EXPLORER_TX_BITCOIN_TESTNET, config.defaults.EXPLORER_TX_BITCOIN_TESTNET,
        );
      } else {
        transactionUrl = self.getConfigValue(
          config.keys.EXPLORER_TX_BITCOIN_MAINNET, config.defaults.EXPLORER_TX_BITCOIN_MAINNET,
        );
      }
      return utils.format(transactionUrl, txId);
    };

    this.getBlockByHashURL = (hash) => {
      let blockUrl;
      if (isTestnet()) {
        blockUrl = self.getConfigValue(
          config.keys.EXPLORER_BLKHASH_BITCOIN_TESTNET,
          config.defaults.EXPLORER_BLKHASH_BITCOIN_TESTNET,
        );
      } else {
        blockUrl = self.getConfigValue(
          config.keys.EXPLORER_BLKHASH_BITCOIN_MAINNET,
          config.defaults.EXPLORER_BLKHASH_BITCOIN_MAINNET,
        );
      }
      return utils.format(blockUrl, hash);
    };

    this.getBlockByHeightURL = (height) => {
      let blockUrl;
      if (isTestnet()) {
        blockUrl = self.getConfigValue(
          config.keys.EXPLORER_BLKHEIGHT_BITCOIN_TESTNET,
          config.defaults.EXPLORER_BLKHEIGHT_BITCOIN_TESTNET,
        );
      } else {
        blockUrl = self.getConfigValue(
          config.keys.EXPLORER_BLKHEIGHT_BITCOIN_MAINNET,
          config.defaults.EXPLORER_BLKHEIGHT_BITCOIN_MAINNET,
        );
      }
      return utils.format(blockUrl, height);
    };

    this.getCoinPrice = (useCache, currency) => {
      const deferred = $q.defer();
      const now = new Date().getTime();
      if (useCache && pricesCache && (pricesCache.ts > (now - PRICE_CACHE_MAXAGE))) {
        try {
          const price = pricesCache.data[currency.toUpperCase()].last;
          deferred.resolve(price);
        } catch (err) {
          deferred.reject(err);
        }
      } else if (pricesFetchers) {
        pricesFetchers.push(deferred);
      } else {
        pricesFetchers = [];
        pricesFetchers.push(deferred);
        $http.get(BLOCKCHAIN_INFO_TICKER_URL).then((response) => {
          try {
            pricesCache = { data: response.data, ts: now };
            const price = pricesCache.data[currency.toUpperCase()].last;
            while (pricesFetchers.length) {
              try {
                pricesFetchers.pop().resolve(price);
              } catch (e) {
                // Nothing to do
              }
            }
          } catch (err) {
            while (pricesFetchers.length) {
              try {
                pricesFetchers.pop().reject(err);
              } catch (e) {
                // Nothing to do
              }
            }
          }
          pricesFetchers = null;
        }, (err) => {
          while (pricesFetchers.length) {
            try {
              pricesFetchers.pop().reject(err);
            } catch (e) {
              // Nothing to do
            }
          }
          pricesFetchers = null;
        });
      }
      return deferred.promise;
    };

    socket.on(config.events.INVOICE_WS, (data) => {
      console.log('Invoice received:', data);
      self.notify(config.notif.SUCCESS, `Payment received: ${data.value}, ${data.memo}`);
      $rootScope.$broadcast(config.events.INVOICE_REFRESH, data);
    });

    socket.on(config.events.HELLO_WS, (data) => {
      console.log('Hello event received:', data);
      self.restrictedUser = data.limitUser;
      onConfigUpdate();
      const helloMsg = `${(data && data.remoteAddress) ? `${data.remoteAddress} s` : 'S'}ucessfully connected!`;
      self.notify(config.notif.SUCCESS, helloMsg);
    });

    const resolvedPromise = typeof Promise === 'undefined' ? null : Promise.resolve();
    this.nextTick = resolvedPromise
      ? (fn) => { resolvedPromise.then(fn); }
      : (fn) => { setTimeout(fn); };

    let logLines = 0;
    socket.on(config.events.LOG_WS, (message) => {
      console.log('Log message:', message);
      if (message.data) {
        const logNotifyPattern = self.getConfigValue(
          config.keys.LOG_NOTIFY_PATTERN, config.defaults.LOG_NOTIFY_PATTERN,
        );
        let logPatternRE = null;
        if (logNotifyPattern) {
          logPatternRE = new RegExp(logNotifyPattern);
        }
        let index = -1;
        let previndex = 0;
        for ((index = message.data.indexOf('\n', index + 1)); index > -1;) {
          if (logPatternRE) {
            const logLine = message.data.substr(previndex, (index - previndex));
            if (logLine.match(logPatternRE)) {
              self.notify(config.notif.WARNING, logLine);
            }
          }
          previndex = index + 1;
          logLines += 1;
        }
        const $tailObj = $('#tail');
        let logs = $tailObj.html();
        index = -1;
        const maxLogBuffer = self.getConfigValue(
          config.keys.MAX_LOG_BUFFER, config.defaults.MAX_LOG_BUFFER,
        );
        while (logLines > maxLogBuffer) {
          index = logs.indexOf('\n', index + 1);
          logLines -= 1;
        }
        logs = logs.substring(index + 1);
        $tailObj.html(logs + message.data);
        self.nextTick(() => {
          $tailObj.scrollTop($tailObj[0].scrollHeight);
        });
      }
    });

    socket.on(config.events.OPENCHANNEL_WS, (response) => {
      console.log('OpenChannel WS event', response);
      $timeout(() => {
        if (response.evt && response.rid) { // valid event
          if (wsRequestListenersFilter(response)) {
            if ((response.evt === 'error') && response.data.error) {
              const errMsg = response.data.error;
              self.notify(config.notif.WARNING, errMsg);
            } else if ((response.evt === 'status')) {
              const statusMsg = response.data.details;
              self.notify(config.notif.INFO, statusMsg);
            } else if ((response.evt === 'data') && response.data.update) {
              let dataMsg;
              const { update } = response.data; // TODO
              if (update === 'chan_pending') {
                const txId = response.data.chan_pending.txid;
                dataMsg = `Channel opening pending... (txid = ${utils.buffer2hexa(txId, true)})`;
                $rootScope.$broadcast(config.events.CHANNEL_REFRESH, response);
              } else if (update === 'confirmation') {
                const blockHeight = response.data.confirmation.block_height;
                const numConfsLeft = response.data.confirmation.num_confs_left;
                dataMsg = `Channel opening, ${numConfsLeft} confirmations left... (block height ${blockHeight})`;
              } else if (update === 'chan_open') {
                const fundingTxId = response.data.chan_open.channel_point.funding_txid;
                dataMsg = `Channel is opened... (funding txid = ${utils.buffer2hexa(fundingTxId, true)})`;
                $rootScope.$broadcast(config.events.CHANNEL_REFRESH, response);
              } else {
                dataMsg = update;
              }
              self.notify(config.notif.INFO, dataMsg);
            }
          }
        }
      });
    });

    socket.on(config.events.CLOSECHANNEL_WS, (response) => {
      console.log('CloseChannel WS event', response);
      $timeout(() => {
        if (response.evt && response.rid) { // valid event
          if (wsRequestListenersFilter(response)) {
            if ((response.evt === 'error') && response.data.error) {
              const errMsg = response.data.error;
              self.notify(config.notif.WARNING, errMsg);
            } else if ((response.evt === 'status')) {
              const statusMsg = response.data.details;
              self.notify(config.notif.INFO, statusMsg);
            } else if ((response.evt === 'data') && response.data.update) {
              let dataMsg;
              const { update } = response.data; // TODO
              if (update === 'close_pending') {
                const txId = response.data.close_pending.txid;
                dataMsg = `Channel close pending... (txid = ${utils.buffer2hexa(txId, true)})`;
                $rootScope.$broadcast(config.events.CHANNEL_REFRESH, response);
              } else if (update === 'chan_close') {
                const closingTxId = response.data.chan_close.closing_txid;
                dataMsg = `Channel has been closed... (closing txid = ${utils.buffer2hexa(closingTxId, true)})`;
                $rootScope.$broadcast(config.events.CHANNEL_REFRESH, response);
              } else {
                dataMsg = update;
              }
              self.notify(config.notif.INFO, dataMsg);
            }
          }
        }
      });
    });

    Object.seal(this);
  };
}());
