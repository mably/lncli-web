(function () {

	lnwebcli.controller("ModalSendPaymentCtrl", ["$scope", "$uibModalInstance", "defaults", "lncli", controller]);

	function controller ($scope, $uibModalInstance, defaults, lncli) {

		var $ctrl = this;

		$ctrl.spinner = 0;

		$ctrl.values = defaults;
		$ctrl.decodedPayment = null;

		$ctrl.ok = function () {
			$ctrl.spinner++;
			lncli.sendPayment($ctrl.values.payreq).then(function(response) {
				$ctrl.spinner--;
				console.log("SendPayment", response);
				if (response.data.error) {
					if ($ctrl.isClosed) {
						lncli.alert(response.data.error);
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
					lncli.alert(errmsg);
				} else {
					$ctrl.warning = errmsg;
				}
			});
		};

		$ctrl.decode = function () {
			$ctrl.spinner++;
			lncli.decodePayReq($ctrl.values.payreq).then(function(response) {
				$ctrl.spinner--;
				console.log("DecodePayReq", response);
				if (response.data.error) {
					$ctrl.decodedPayment = null;
					if ($ctrl.isClosed) {
						lncli.alert(response.data.error);
					} else {
						$ctrl.warning = response.data.error;
					}
				} else {
					$ctrl.warning = null;
					$ctrl.decodedPayment = response.data;
				}
			}, function (err) {
				$ctrl.spinner--;
				console.log(err);
				$ctrl.decodedPayment = null;
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
