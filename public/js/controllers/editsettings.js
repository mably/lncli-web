(function () {

	lnwebcli.controller("ModalEditSettingsCtrl", ["$uibModalInstance", "settings", "lncli", controller]);

	function controller ($uibModalInstance, settings, lncli) {

		var $ctrl = this;

		$ctrl.values = settings;

		$ctrl.ok = function () {
			lncli.setConfigValues($ctrl.values).then(function(response) {
				console.log("EditConfig", response);
				$ctrl.warning = null;
				$uibModalInstance.close($ctrl.values);
			}, function (err) {
				$ctrl.warning = err;
			});
		};

		$ctrl.cancel = function () {
			$uibModalInstance.dismiss('cancel');
		};
		
		$ctrl.dismissAlert = function() {
			$ctrl.warning = null;
		}

	}

})();
