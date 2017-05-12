(function () {

	lnwebcli.controller("ModalSignMessageCtrl", ["$uibModalInstance", "defaults", "lncli", controller]);

	function controller($uibModalInstance, defaults, lncli) {

		var $ctrl = this;

		$ctrl.spinner = 0;

		$ctrl.values = defaults;
		$ctrl.signature = null;

		$ctrl.ok = function () {
			$ctrl.spinner++;
			lncli.signMessage($ctrl.values.message).then(function (response) {
				$ctrl.spinner--;
				console.log("SignMessage", response);
				if (response.data.error) {
					$ctrl.signature = null;
					if ($ctrl.isClosed) {
						lncli.alert(response.data.error);
					} else {
						$ctrl.warning = response.data.error;
					}
				} else {
					$ctrl.warning = null;
					$ctrl.signature = response.data.signature;
				}
			}, function (err) {
				$ctrl.spinner--;
				console.log(err);
				$ctrl.signature = null;
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
