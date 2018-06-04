(function () {
	"use strict";

	module.exports = function ($scope, $timeout, $uibModal, $, lncli, config) {

		$scope.spinner = 0;
		$scope.nextRefresh = null;
		$scope.lastRefreshed = null;
		$scope.numberOfForwards = 0;
		$scope.pageSizes = lncli.getConfigValue(config.keys.PAGE_SIZES, config.defaults.PAGE_SIZES);
		$scope.cfg = {};
		$scope.cfg.itemsPerPage = lncli.getConfigValue(config.keys.FORWARDINGHISTORY_PAGESIZE, $scope.pageSizes[0]);
		$scope.cfg.listVisible = lncli.getConfigValue(config.keys.FORWARDINGHISTORY_LISTVISIBLE, true);

		$scope.refresh = function () {
			if ($scope.cfg.listVisible) {
				lncli.getKnownPeers(true).then(function (knownPeers) {
					$scope.knownPeers = knownPeers;
					lncli.listChannels(true).then(function (response) {

						$scope.data = JSON.stringify(response.data, null, "\t");
						$scope.channels = processChannels(response.data.channels);

						$scope.lastRefreshed = Date.now();
						$scope.updateNextRefresh();
						$scope.spinner++;
						lncli.forwardingHistory().then(function (response) {
							$scope.spinner--;
							console.log(response);
							$scope.data = JSON.stringify(response.data, null, "\t");
							$scope.forwards = processForwards(response.data.forwarding_events);
							$scope.numberOfForwards = $scope.forwards.length;
						}, function (err) {
							$scope.spinner--;
							$scope.numberOfForwards = 0;
							console.log("Error:", err);
							lncli.alert(err.message || err.statusText);
						});

					});
				});
			}
		};

		var processChannels = function (channels) {
			var processedChannels = {};
			channels.forEach(function (channel) {
				processedChannels[channel.chan_id] = channel.remote_pubkey;
			});
			return processedChannels;
		};

		var processForwards = function (forwards) {
			forwards.forEach(function (forward) {
				forward.amt_in = parseInt(forward.amt_in);
				forward.amt_out = parseInt(forward.amt_out);
				forward.fee = parseInt(forward.fee);
			});
			return forwards;
		};

		var getRefreshPeriod = function () {
			return lncli.getConfigValue(config.keys.AUTO_REFRESH, config.defaults.AUTO_REFRESH);
		};

		$scope.updateNextRefresh = function () {
			$timeout.cancel($scope.nextRefresh);
			$scope.nextRefresh = $timeout($scope.refresh, getRefreshPeriod());
		};

		$scope.channelPeerAlias = function (chanid) {
			var alias;
			var pubkey = $scope.channels[chanid];
			if (pubkey) {
				var knownPeer = $scope.knownPeers[pubkey];
				alias = knownPeer ? knownPeer.custom_alias : null;
			} else {
				alias = null;
			}
			return alias;
		};

		$scope.pageSizeChanged = function () {
			lncli.setConfigValue(config.keys.FORWARDINGHISTORY_PAGESIZE, $scope.cfg.itemsPerPage);
		};

		$scope.toggle = function () {
			$scope.cfg.listVisible = !$scope.cfg.listVisible;
			lncli.setConfigValue(config.keys.FORWARDINGHISTORY_LISTVISIBLE, $scope.cfg.listVisible);
			if ($scope.cfg.listVisible) {
				// Refresh if not been refreshed for more than refresh period
				if (Date.now() - $scope.lastRefreshed > getRefreshPeriod()) {
					$scope.refresh();
				}
			}
		};

		$scope.refresh();

	};

})();
