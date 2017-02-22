(function () {

	lnwebcli.controller("PendingChannelsCtrl", ["$scope", "$timeout", "$window", "lncli", "config", controller]);

	function controller($scope, $timeout, $window, lncli, config) {

		$scope.spinner = 0;
		$scope.nextRefresh = null;

		$scope.refresh = function () {
			lncli.getKnownPeers(true).then(function(knownPeers) {
				$scope.knownPeers = knownPeers;
				$scope.spinner++;
				$scope.updateNextRefresh();
				lncli.pendingChannels().then(function(response) {
					$scope.spinner--;
					console.log(response);
					$scope.data = JSON.stringify(response.data, null, "\t");
					$scope.channels = response.data.pending_channels;
				}, function(err) {
					$scope.spinner--;
					console.log('Error:', err);
					lncli.alert(err.message || err.statusText);
				});
			});
		};

		$scope.updateNextRefresh = function () {
			$timeout.cancel($scope.nextRefresh);
			$scope.nextRefresh = $timeout($scope.refresh,
				lncli.getConfigValue(config.keys.AUTO_REFRESH, config.defaults.AUTO_REFRESH));
		}

		$scope.channelPeerAlias = function(channel) {
			var knownPeer = $scope.knownPeers[channel.identity_key];
			return knownPeer ? knownPeer.alias : null;
		}

		$scope.pubkeyCopied = function(channel) {
			channel.pubkeyCopied = true;
			$timeout(function() {
				channel.pubkeyCopied = false;
			}, 500);
		}

		$scope.chanpointCopied = function(channel) {
			channel.chanpointCopied = true;
			$timeout(function() {
				channel.chanpointCopied = false;
			}, 500);
		}

		$scope.openChannelPointInExplorer = function (channel) {
			if (channel.channel_point) {
				var txId = channel.channel_point.split(':')[0];
				$window.open("https://testnet.smartbit.com.au/tx/" + txId, "_blank");
			}
		}

		$scope.$on(config.events.CHANNEL_REFRESH, function(event, args) {
			console.log("Received event CHANNEL_REFRESH", event, args);
			$scope.refresh();
		});

		$scope.refresh();

	}
})();
