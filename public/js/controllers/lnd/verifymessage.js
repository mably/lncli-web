(function () {

	lnwebcli.controller("ModalVerifyMessageCtrl", ["$uibModalInstance", "defaults", "lncli", controller]);

	function controller($uibModalInstance, defaults, lncli) {

		var $ctrl = this;

		$ctrl.spinner = 0;

		$ctrl.values = defaults;
		$ctrl.data = null;

		$ctrl.ok = function () {
			$ctrl.spinner++;
			lncli.verifyMessage($ctrl.values.message, $ctrl.values.signature).then(function (response) {
				$ctrl.spinner--;
				console.log("VerifyMessage", response);
				if (response.data.error) {
					$ctrl.data = null;
					if ($ctrl.isClosed) {
						lncli.alert(response.data.error);
					} else {
						$ctrl.warning = response.data.error;
					}
				} else {
					$ctrl.warning = null;
					$ctrl.data = angular.toJson(response.data, 4);
				}
			}, function (err) {
				$ctrl.spinner--;
				console.log(err);
				$ctrl.data = null;
				var errmsg = err.message || err.statusText;
				if ($ctrl.isClosed) {
					lncli.alert(errmsg);
				} else {
					$ctrl.warning = errmsg;
				}
			});
		};

		$ctrl.close = function () {
			$uibModalInstance.close($ctrl.values);
		};

		$ctrl.dismissWarning = function () {
			$ctrl.warning = null;
		};

		$ctrl.dismissSuccess = function () {
			$ctrl.success = null;
		};

	}

})();
