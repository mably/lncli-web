(function () {

	slacktipapp.controller("ModalSendTipCtrl", ["$scope", "$uibModalInstance", "defaults", "slacktip", controller]);

	function controller($scope, $uibModalInstance, defaults, slacktip) {

		var $ctrl = this;

		$ctrl.spinner = 0;

		$ctrl.values = defaults;

		$ctrl.ok = function () {
			$ctrl.spinner++;
			slacktip.sendTip($ctrl.values.userid, $ctrl.values.teamid, $ctrl.values.amount).then(function (response) {
				$ctrl.spinner--;
				console.log("SendTip", response);
				if (response.data.error) {
					if ($ctrl.isClosed) {
						slacktip.alert(response.data.error);
					} else {
						$ctrl.warning = response.data.error;
					}
				} else {
					$ctrl.warning = null;
					$uibModalInstance.close($ctrl.values);
				}
			}, function (err) {
				$ctrl.spinner--;
				console.log(err);
				var errmsg = err.message || err.statusText;
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
