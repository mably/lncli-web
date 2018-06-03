(function () {
	"use strict";

	module.exports = function ($uibModalInstance, settings, lncli, config) {

		var $ctrl = this;

		$ctrl.values = settings;
		$ctrl.amountMainUnits = config.defaults.AMOUNT_UNITS;
		$ctrl.amountAltUnits = config.defaults.AMOUNT_UNITS;

		$ctrl.ok = function () {
			lncli.setConfigValues($ctrl.values).then(function (response) {
				console.log("EditConfig", response);
				$ctrl.warning = null;
				$uibModalInstance.close($ctrl.values);
			}, function (err) {
				$ctrl.warning = err;
			});
		};

		$ctrl.cancel = function () {
			$uibModalInstance.dismiss("cancel");
		};

		$ctrl.dismissAlert = function () {
			$ctrl.warning = null;
		};

	};

})();
