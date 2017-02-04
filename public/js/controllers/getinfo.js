(function () {

	lnwebcli.controller("GetInfoCtrl", ["$scope", "lncli", controller]);

	function controller($scope, lncli) {

		lncli.getInfo().then(function(response) {
				console.log(response);
				$scope.info = JSON.stringify(response.data, null, "\t");
			}, function(err) {
				console.log('Error: ' + err);
			});

	}

})();
