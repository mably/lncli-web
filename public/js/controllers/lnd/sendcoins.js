(function () {
	"use strict";

	module.exports = function ($scope, $uibModalInstance, defaults, lncli) {

		var $ctrl = this;

		$ctrl.spinner = 0;

		$ctrl.values = defaults;

		$ctrl.ok = function () {
			$ctrl.spinner++;
			lncli.sendCoins($ctrl.values.addr, $ctrl.values.amount).then(function (response) {
				$ctrl.spinner--;
				console.log("SendCoins", response);
				if (response.data.error) {
					if ($ctrl.isClosed) {
						lncli.alert(response.data.error);
					} else {
						$ctrl.warning = response.data.error;
					}
				} else {
					$ctrl.warning = null;
					$uibModalInstance.close($ctrl.values);
					lncli.notify("INFO", "Tx " + response.data.txid + " successfully sent.");
				}
			}, function (err) {
				$ctrl.spinner--;
				console.log(err);
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
	};
})();
