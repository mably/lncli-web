(function () {
	"use strict";

	module.exports = function ($rootScope, $scope, $timeout, $window, $uibModal, $, $q, bootbox, lncli, config) {

		$scope.spinner = 0;
		$scope.nextRefresh = null;
		$scope.numberOfChannels = 0;
		$scope.pageSizes = lncli.getConfigValue(config.keys.PAGE_SIZES, config.defaults.PAGE_SIZES);
		$scope.cfg = {};
		$scope.cfg.itemsPerPage = lncli.getConfigValue(config.keys.LISTCHANNELS_PAGESIZE, $scope.pageSizes[0]);
		$scope.cfg.listVisible = lncli.getConfigValue(config.keys.LISTCHANNELS_LISTVISIBLE, true);
		$scope.form = {};
		$scope.form.checkbox = false;

		$scope.refresh = function () {
			lncli.getKnownPeers(true).then(function (knownPeers) {
				$scope.knownPeers = knownPeers;
				$scope.spinner++;
				$scope.updateNextRefresh();
				lncli.listChannels().then(function (response) {
					$scope.spinner--;
					console.log(response);
					$scope.data = JSON.stringify(response.data, null, "\t");
					$scope.channels = processChannels(response.data.channels);
					$scope.numberOfChannels = $scope.channels.length;
					$scope.form.checkbox = false;
				}, function (err) {
					$scope.spinner--;
					$scope.numberOfChannels = 0;
					console.log("Error:", err);
					lncli.alert(err.message || err.statusText);
				});
			});
		};

		var processChannels = function (channels) {
			channels.forEach(function (channel) {
				channel.capacity = parseInt(channel.capacity);
				channel.local_balance = parseInt(channel.local_balance);
				channel.remote_balance = parseInt(channel.remote_balance);
				channel.total_satoshis_sent = parseInt(channel.total_satoshis_sent);
				channel.total_satoshis_received = parseInt(channel.total_satoshis_received);
				channel.num_updates = parseInt(channel.num_updates);
			});
			return channels;
		};

		$scope.updateNextRefresh = function () {
			$timeout.cancel($scope.nextRefresh);
			$scope.nextRefresh = $timeout($scope.refresh,
				lncli.getConfigValue(config.keys.AUTO_REFRESH, config.defaults.AUTO_REFRESH));
		};

		$scope.add = function () {

			lncli.listPeers(true).then(function (peersResponse) {

				if (peersResponse && peersResponse.data && peersResponse.data.peers && peersResponse.data.peers.length > 0) {

					var modalInstance = $uibModal.open({
						animation: true,
						ariaLabelledBy: "openchannel-modal-title",
						ariaDescribedBy: "openchannel-modal-body",
						templateUrl: "templates/partials/lnd/openchannel.html",
						controller: "ModalOpenChannelCtrl",
						controllerAs: "$ctrl",
						size: "lg",
						resolve: {
							defaults: function () {
								return {
									peers: peersResponse.data.peers,
									pubkey: "03c892e3f3f077ea1e381c081abb36491a2502bc43ed37ffb82e264224f325ff27",
									localamt: "10000",
									pushamt: "5000",
									numconf: "1"
								};
							}
						}
					});

					modalInstance.rendered.then(function () {
						$("#openchannel-pubkey").focus();
					});

					modalInstance.result.then(function (values) {
						console.log("values", values);
					}, function () {
						console.log("Modal dismissed at: " + new Date());
					});

				} else {

					lncli.alert("You cannot open a channel, you are not connected to any peers!");

				}

			});

		};

		$scope.close = function (channel) {

			var modalInstance = $uibModal.open({
				animation: true,
				ariaLabelledBy: "closechannel-modal-title",
				ariaDescribedBy: "closechannel-modal-body",
				templateUrl: "templates/partials/lnd/closechannel.html",
				controller: "ModalCloseChannelCtrl",
				controllerAs: "$ctrl",
				size: "lg",
				resolve: {
					channel: angular.copy(channel)
				}
			});

			modalInstance.rendered.then(function () {
				$("#closechannel-force").focus();
			});

			modalInstance.result.then(function (values) {
				console.log("values", values);
			}, function () {
				console.log("Modal dismissed at: " + new Date());
			});

		};

		var closeChannelBatch = function () {
			var promises = [];
			$scope.spinner++;
			$scope.channels.forEach(function (channel) {
				if (channel.selected) {
					var deferred = $q.defer();
					promises.push(deferred.promise);
					var channelPoint = channel.channel_point.split(":");
					lncli.closeChannel(channelPoint[0], channelPoint[1], false).then(function (response) {
						console.log("CloseChannelBatch", response);
						var requestId = response.rid;
						// timer to not wait indefinitely for first websocket event
						var waitTimer = $timeout(function () {
							lncli.unregisterWSRequestListener(requestId);
							deferred.resolve({ error: "no response" });
						}, 5000); // Wait 5 seconds maximmum for socket response
						// We wait for first websocket event to check for errors
						lncli.registerWSRequestListener(requestId, function (response) {
							$timeout.cancel(waitTimer);
							lncli.unregisterWSRequestListener(requestId);
							if (response.evt === "error") {
								deferred.resolve({ error: response.data.error });
								lncli.alert(response.data.error);
							} else {
								deferred.resolve(response);
							}
						});
					}, function (err) {
						console.log(err);
						deferred.resolve({ error: err.message });
						lncli.alert(err.message);
					});
				}
			});
			if (promises.length > 0) {
				$q.all(promises).then(function (responses) {
					console.log("All promises - ok", responses);
					$scope.spinner--;
					$rootScope.$broadcast(config.events.CHANNEL_REFRESH, responses);
				}, function (err) {
					console.log("All promises - error", err);
					$scope.spinner--;
					$rootScope.$broadcast(config.events.CHANNEL_REFRESH, responses);
				});
			} else {
				console.log("No promises");
				$scope.spinner--;
			}
		};

		$scope.closeBatch = function (confirm = true) {
			if (hasSelected()) {
				if (confirm) {
					bootbox.confirm("Do you really want to cooperatively close those selected channels?", function (result) {
						if (result) {
							closeChannelBatch();
						}
					});
				} else {
					closeChannelBatch();
				}
			} else {
				bootbox.alert("You need to select some channels first.");
			}
		};

		$scope.dismissWarning = function () {
			$scope.warning = null;
		};

		$scope.channelPeerAlias = function (channel) {
			var knownPeer = $scope.knownPeers[channel.remote_pubkey];
			return knownPeer ? knownPeer.alias : null;
		};

		$scope.pubkeyCopied = function (channel) {
			channel.pubkeyCopied = true;
			$timeout(function () {
				channel.pubkeyCopied = false;
			}, 500);
		};

		$scope.chanpointCopied = function (channel) {
			channel.chanpointCopied = true;
			$timeout(function () {
				channel.chanpointCopied = false;
			}, 500);
		};

		$scope.openChannelPointInExplorer = function (channel) {
			if (channel.channel_point) {
				var txId = channel.channel_point.split(":")[0];
				$window.open("https://testnet.smartbit.com.au/tx/" + txId, "_blank");
			}
		};

		$scope.$on(config.events.CHANNEL_REFRESH, function (event, args) {
			console.log("Received event CHANNEL_REFRESH", event, args);
			$scope.refresh();
		});

		$scope.pageSizeChanged = function () {
			lncli.setConfigValue(config.keys.LISTCHANNELS_PAGESIZE, $scope.cfg.itemsPerPage);
		};

		var hasSelected = function () {
			return $scope.channels.some(function (channel) {
				return channel.selected;
			});
		};

		$scope.selectAll = function (stChannels) {
			stChannels.forEach(function (channel) {
				channel.selected = $scope.form.checkbox;
			});
		};

		$scope.toggle = function () {
			$scope.cfg.listVisible = !$scope.cfg.listVisible;
			lncli.setConfigValue(config.keys.LISTCHANNELS_LISTVISIBLE, $scope.cfg.listVisible);
		};

		$scope.refresh();

	};

})();
