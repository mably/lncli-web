(function () {

	slacktipapp.controller("UserCtrl", ["$scope", "$timeout", "$uibModal", "slacktip", "config", controller]);

	function controller($scope, $timeout, $uibModal, slacktip, config) {

		var $ctrl = this;

		$scope.spinner = 0;

		$scope.refresh = function () {
			$scope.spinner++;
			slacktip.getUser(false).then(function(response) {
				$scope.spinner--;
				console.log(response);
				$scope.data = JSON.stringify(response.data, null, "\t");
				$scope.info = response.data;
			}, function(err) {
				$scope.spinner--;
				console.log('Error:', err);
				slacktip.alert(err.message || err.statusText);
			});
		}

		$scope.refresh();
	}

})();
