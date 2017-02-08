(function () {

	lnwebcli.controller("PendingChannelsCtrl", ["$scope", "$timeout", "$window", "lncli", controller]);

	function controller($scope, $timeout, $window, lncli) {

		$scope.refresh = function () {
			lncli.getKnownPeers(true).then(function(knownPeers) {
				$scope.knownPeers = knownPeers;
				lncli.pendingChannels().then(function(response) {
					console.log(response);
					$scope.data = JSON.stringify(response.data, null, "\t");
					$scope.channels = response.data.pending_channels;
				}, function(err) {
					console.log('Error: ' + err);
				});
			});
		};

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

		$scope.refresh();

	}
})();
