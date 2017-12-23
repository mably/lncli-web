(function () {
	"use strict";

	module.exports = function ($scope, $uibModalInstance, defaults, lncli) {

		var $ctrl = this;

		$ctrl.spinner = 0;

		$ctrl.values = defaults;
		$ctrl.nodeInfo = null;

		$ctrl.getNodeInfo = function () {
			$ctrl.spinner++;
			lncli.getNodeInfo($ctrl.values.pubkey).then(function (response) {
				$ctrl.spinner--;
				console.log("NodeInfo", response);
				if (response.data.error) {
					$ctrl.nodeInfo = null;
					if ($ctrl.isClosed) {
						lncli.alert(response.data.error);
					} else {
						$ctrl.warning = response.data.error;
					}
				} else {
					$ctrl.warning = null;
					$ctrl.nodeInfo = angular.toJson(response.data, 4);
				}
			}, function (err) {
				$ctrl.spinner--;
				console.log(err);
				$ctrl.nodeInfo = null;
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
