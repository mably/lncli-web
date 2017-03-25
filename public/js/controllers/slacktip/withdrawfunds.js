(function () {

	slacktipapp.controller("ModalWithdrawFundsCtrl", ["$rootScope", "$scope", "$uibModalInstance", "defaults", "slacktip", "config", controller]);

	function controller($rootScope, $scope, $uibModalInstance, defaults, slacktip, config) {

		var $ctrl = this;

		$ctrl.spinner = 0;

		$ctrl.values = defaults;

		$ctrl.ok = function () {
			$ctrl.spinner++;
			slacktip.withdrawFunds($ctrl.values.payreq).then(function (response) {
				$ctrl.spinner--;
				console.log("WithdrawFunds", response);
				if (response.data.error) {
					if ($ctrl.isClosed) {
						slacktip.alert(response.data.error);
					} else {
						$ctrl.warning = response.data.error;
					}
				} else {
					$ctrl.warning = null;
					$rootScope.$broadcast(config.events.USER_REFRESH, response);
					$uibModalInstance.close($ctrl.values);
				}
			}, function (err) {
				$ctrl.spinner--;
				console.log(err);
				var errmsg = err.data.error || err.statusText;
				if ($ctrl.isClosed) {
					slacktip.alert(errmsg);
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
