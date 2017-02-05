(function () {

	lnwebcli.controller("PendingChannelsCtrl", ["$scope", "lncli", controller]);

	function controller($scope, lncli) {

		$scope.refresh = function () {
			lncli.pendingChannels().then(function(response) {
				console.log(response);
				$scope.data = JSON.stringify(response.data, null, "\t");
				$scope.channels = response.data.pending_channels;
			}, function(err) {
				console.log('Error: ' + err);
			});
		};

		$scope.refresh();

	}
})();
