(function () {

	lnwebcli.controller("GetNetworkInfoCtrl", ["$scope", "lncli", controller]);

	function controller($scope, lncli) {

		$scope.spinner = 0;
	
		$scope.refresh = function () {
			$scope.spinner++;
			lncli.getNetworkInfo().then(function(response) {
				$scope.spinner--;
				console.log(response);
				$scope.data = JSON.stringify(response.data, null, "\t");
				$scope.info = response.data;
			}, function(err) {
				$scope.spinner--;
				console.log('Error: ' + err);
			});
		}

		$scope.refresh();
	}

})();
