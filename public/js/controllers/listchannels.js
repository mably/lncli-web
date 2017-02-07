(function () {

	lnwebcli.controller("ListChannelsCtrl", ["$scope", "$uibModal", "lncli", controller]);

	function controller($scope, $uibModal, lncli) {

		$scope.refresh = function() {
			lncli.listChannels().then(function(response) {
				console.log(response);
				$scope.data = JSON.stringify(response.data, null, "\t");
				$scope.channels = response.data.channels;
			}, function(err) {
				console.log('Error: ' + err);
			});
		};

		$scope.add = function() {

			lncli.listPeers(true).then(function(peersResponse) {

				if (peersResponse && peersResponse.data && peersResponse.data.peers && peersResponse.data.peers.length > 0) {

					var modalInstance = $uibModal.open({
						animation: true,
						ariaLabelledBy: "modal-title",
						ariaDescribedBy: "modal-body",
						templateUrl: "templates/partials/openchannel.html",
						controller: "ModalOpenChannelCtrl",
						controllerAs: "$ctrl",
						size: "lg",
						resolve: {
							defaults: function () {
								return {
									peers: peersResponse.data.peers,
									pubkey: "03c892e3f3f077ea1e381c081abb36491a2502bc43ed37ffb82e264224f325ff27",
									localamt: "10000",
									pushamt: "1000",
									numconf: "1"
								};
							}
						}
					});

					modalInstance.result.then(function (values) {
						console.log("values", values);
					}, function () {
						console.log('Modal dismissed at: ' + new Date());
					});

				} else {

					bootbox.alert("You cannot open a channel, you are not connected to any peers!");

				}

			});

		};
		
		$scope.close = function(channel) {
			var channelPoint = channel.channel_point.split(":");
			lncli.closeChannel(channelPoint[0], channelPoint[1], false).then(function(response) {
				console.log(response);
			}, function(err) {
				console.log('Error', err);
			});
		}
		
		$scope.dismissWarning = function() {
			$scope.warning = null;
		}

		$scope.refresh();

	}

})();
