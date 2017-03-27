(function () {
	"use strict";

	slacktipapp.service("slacktip", ["$rootScope", "$filter", "$http", "$timeout", "$interval", "$q", "ngToast", "localStorageService", "config", "uuid", "webNotification", Service]);

	function Service($rootScope, $filter, $http, $timeout, $interval, $q, ngToast, localStorageService, config, uuid, webNotification) {

		var _this = this;

		var API = {
			LOGOUT: "/api/logout",
			GETUSER: "/api/slacktip/getuser",
			ADDINVOICE: "/api/slacktip/addinvoice",
			WITHDRAWFUNDS: "/api/slacktip/withdrawfunds",
			SENDTIP: "/api/slacktip/sendtip"
		};

		var configCache = null;
		var wsRequestListeners = {};

		var userCache = null;

		var serverUrl = function (path) {
			return window.serverRootPath ? window.serverRootPath + path : path;
		};

		var socket = io.connect(serverUrl("/"), { secure: location.protocol === "https" });

		socket.on(config.events.HELLO_WS, function (data) {
			console.log("Hello event received:", data);
			var helloMsg = ((data && data.remoteAddress) ? data.remoteAddress + " s" : "S") + "ucessfully connected!";
			_this.notify(config.notif.SUCCESS, helloMsg);
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
				if ($notifObj) {
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
					$notifObj.scrollTop($notifObj[0].scrollHeight);
				}
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
		};

		this.getConfigValue = function (name, defaultValue) {
			var config = configCache ? configCache : fetchConfig();
			var value = config[name];
			if (!value && defaultValue) {
				config[name] = defaultValue;
				writeConfig(config);
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

		this.getUser = function (useCache) {
			var deferred = $q.defer();
			if (useCache && userCache) {
				deferred.resolve(userCache);
			} else {
				$http.get(serverUrl(API.GETUSER)).then(function (response) {
					userCache = response;
					deferred.resolve(response);
				}, function (err) {
					deferred.reject(err);
				});
			}
			return deferred.promise;
		};

		this.addInvoice = function (memo, value) {
			var data = { memo: memo, value: value };
			return $http.post(serverUrl(API.ADDINVOICE), data);
		};

		this.withdrawFunds = function (payreq) {
			var data = { payreq: payreq };
			return $http.post(serverUrl(API.WITHDRAWFUNDS), data);
		};

		this.sendTip = function (userid, teamid, amount) {
			var data = { userid: userid, teamid: teamid, amount: amount };
			return $http.post(serverUrl(API.SENDTIP), data);
		};

		this.logout = function () {
			return $http.get(serverUrl(API.LOGOUT));
		};

		Object.seal(this);
	}

})();
