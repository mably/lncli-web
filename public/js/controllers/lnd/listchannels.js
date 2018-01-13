(function () {
	"use strict";

	module.exports = function ($scope, $timeout, $window, $uibModal, $, lncli, config) {

		$scope.spinner = 0;
		$scope.nextRefresh = null;
		$scope.numberOfChannels = 0;
		$scope.pageSizes = lncli.getConfigValue(config.keys.PAGE_SIZES, config.defaults.PAGE_SIZES);
		$scope.cfg = {};
		$scope.cfg.itemsPerPage = lncli.getConfigValue(config.keys.LISTCHANNELS_PAGESIZE, $scope.pageSizes[0]);

		$scope.refresh = function () {
			lncli.getKnownPeers(true).then(function (knownPeers) {
				$scope.knownPeers = knownPeers;
				$scope.spinner++;
				$scope.updateNextRefresh();
				lncli.listChannels().then(function (response) {
					$scope.spinner--;
					console.log(response);
					$scope.data = JSON.stringify(response.data, null, "\t");
					$scope.channels = response.data.channels;
					$scope.numberOfChannels = $scope.channels.length;
				}, function (err) {
					$scope.spinner--;
					$scope.numberOfChannels = 0;
					console.log("Error:", err);
					lncli.alert(err.message || err.statusText);
				});
			});
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

		$scope.refresh();

	};

})();
