(function () {

	lnwebcli.controller("ModalSendPaymentCtrl", ["$uibModalInstance", "defaults", "lncli", controller]);

	function controller ($uibModalInstance, defaults, lncli) {

		var $ctrl = this;

		$ctrl.values = defaults;
		$ctrl.payment = null;

		$ctrl.ok = function () {
			lncli.sendPayment($ctrl.values.payreq).then(function(response) {
				console.log("SendPayment", response);
				if (response.data.error) {
					$ctrl.warning = response.data.error;
				} else {
					$ctrl.warning = null;
					$uibModalInstance.close($ctrl.values);
				}
			}, function (err) {
				console.log(err);
				bootbox.alert(err.message);
			});
		};

		$ctrl.decode = function () {
			lncli.decodePayReq($ctrl.values.payreq).then(function(response) {
				console.log("DecodePayReq", response);
				if (response.data.error) {
					$ctrl.payment = null;
					$ctrl.warning = response.data.error;
				} else {
					$ctrl.warning = null;
					$ctrl.payment = response.data;
				}
			}, function (err) {
				console.log(err);
				$ctrl.payment = null;
				bootbox.alert(err.message);
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
