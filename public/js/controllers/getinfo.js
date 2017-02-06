(function () {

	lnwebcli.controller("GetInfoCtrl", ["$scope", "lncli", controller]);

	function controller($scope, lncli) {

		$scope.refresh = function () {
			lncli.getInfo().then(function(response) {
				console.log(response);
				$scope.data = JSON.stringify(response.data, null, "\t");
				$scope.info = response.data;
			}, function(err) {
				console.log('Error: ' + err);
			});
		}

		$scope.refresh();

	}

})();
