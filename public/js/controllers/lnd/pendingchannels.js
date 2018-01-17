(function () {
	"use strict";

	module.exports = function ($scope, $timeout, $window, lncli, config) {

		$scope.spinner = 0;
		$scope.nextRefresh = null;
		$scope.numberOfOpeningChannels = 0;
		$scope.numberOfClosingChannels = 0;
		$scope.numberOfForceClosingChannels = 0;
		$scope.pageSizes = lncli.getConfigValue(config.keys.PAGE_SIZES, config.defaults.PAGE_SIZES);
		$scope.cfg = {};
		$scope.cfg.itemsPerPage = lncli.getConfigValue(config.keys.LISTPENDINGCHANNELS_PAGESIZE, $scope.pageSizes[0]);
		$scope.cfg.listVisible = lncli.getConfigValue(config.keys.LISTPENDINGCHANNELS_LISTVISIBLE, true);

		$scope.refresh = function () {
			lncli.getKnownPeers(true).then(function (knownPeers) {
				$scope.knownPeers = knownPeers;
				$scope.spinner++;
				$scope.updateNextRefresh();
				lncli.pendingChannels().then(function (response) {
					$scope.spinner--;
					console.log(response);
					$scope.data = JSON.stringify(response.data, null, "\t");
					$scope.pending_open_channels = response.data.pending_open_channels;
					$scope.numberOfOpeningChannels = $scope.pending_open_channels.length;
					$scope.pending_closing_channels = response.data.pending_closing_channels;
					$scope.numberOfClosingChannels = $scope.pending_closing_channels.length;
					$scope.pending_force_closing_channels = response.data.pending_force_closing_channels;
					$scope.numberOfForceClosingChannels = $scope.pending_force_closing_channels.length;
				}, function (err) {
					$scope.spinner--;
					$scope.numberOfOpeningChannels = 0;
					$scope.numberOfClosingChannels = 0;
					$scope.numberOfForceClosingChannels = 0;
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

		$scope.channelPeerAlias = function (pendingChannel) {
			var knownPeer = $scope.knownPeers[pendingChannel.channel.remote_node_pub];
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

		$scope.closingTxCopied = function (channel) {
			channel.closingTxCopied = true;
			$timeout(function () {
				channel.closingTxCopied = false;
			}, 500);
		};

		$scope.openClosingTxInExplorer = function (closingTxId) {
			if (closingTxId) {
				$window.open("https://testnet.smartbit.com.au/tx/" + closingTxId, "_blank");
			}
		};

		$scope.$on(config.events.CHANNEL_REFRESH, function (event, args) {
			console.log("Received event CHANNEL_REFRESH", event, args);
			$scope.refresh();
		});

		$scope.pageSizeChanged = function () {
			lncli.setConfigValue(config.keys.LISTPENDINGCHANNELS_PAGESIZE, $scope.cfg.itemsPerPage);
		};

		$scope.toggle = function () {
			$scope.cfg.listVisible = !$scope.cfg.listVisible;
			lncli.setConfigValue(config.keys.LISTPENDINGCHANNELS_LISTVISIBLE, $scope.cfg.listVisible);
		};

		$scope.refresh();

	};
})();
