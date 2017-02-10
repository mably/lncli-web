(function () {

	lnwebcli.controller("ModalOpenChannelCtrl", ["$uibModalInstance", "defaults", "lncli", controller]);

	function controller ($uibModalInstance, defaults, lncli) {

		var $ctrl = this;

		$ctrl.spinner = 0;

		$ctrl.values = defaults;

		$ctrl.ok = function () {
			$ctrl.spinner++;
			lncli.openChannel($ctrl.values.pubkey, $ctrl.values.localamt, $ctrl.values.pushamt, $ctrl.values.numconf).then(function(response) {
				$ctrl.spinner--;
				console.log("OpenChannel", response);
				if (response.data.error) {
					$ctrl.warning = response.data.error;
				} else {
					$ctrl.warning = null;
					$uibModalInstance.close($ctrl.values);
				}
			}, function (err) {
				$ctrl.spinner--;
				console.log(err);
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
