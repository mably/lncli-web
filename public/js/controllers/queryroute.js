(function () {

	lnwebcli.controller("ModalQueryRouteCtrl", ["$scope", "$uibModalInstance", "defaults", "lncli", controller]);

	function controller ($scope, $uibModalInstance, defaults, lncli) {

		var $ctrl = this;
		
		$ctrl.spinner = 0;

		$ctrl.values = defaults;
		$ctrl.route = null;

		$ctrl.queryRoute = function () {
			$ctrl.spinner++;
			lncli.queryRoute($ctrl.values.pubkey, $ctrl.values.amount).then(function(response) {
				$ctrl.spinner--;
				console.log("QueryRoute", response);
				if (response.data.error) {
					$ctrl.route = null;
					if ($ctrl.isClosed) {
						lncli.alert(response.data.error);
					} else {
						$ctrl.warning = response.data.error;
					}
				} else {
					$ctrl.warning = null;
					$ctrl.route = angular.toJson(response.data, 4);
				}
			}, function (err) {
				$ctrl.spinner--;
				console.log(err);
				$ctrl.route = null;
				var errmsg = err.message || err.statusText;
				if ($ctrl.isClosed) {
					lncli.alert(errmsg);
				} else {
					$ctrl.warning = errmsg;
				}
			});
		};

		$ctrl.cancel = function () {
			$uibModalInstance.dismiss("cancel");
		};

		$ctrl.dismissAlert = function () {
			$ctrl.warning = null;
		};

		$scope.$on("modal.closing", function (event, reason, closed) {
			console.log("modal.closing: " + (closed ? "close" : "dismiss") + "(" + reason + ")");
			$ctrl.isClosed = true;
		});
	}
})();
