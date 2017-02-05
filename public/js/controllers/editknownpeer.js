(function () {

	lnwebcli.controller("ModalEditKnownPeerCtrl", ["$uibModalInstance", "knownpeer", "lncli", controller]);

	function controller ($uibModalInstance, knownpeer, lncli) {

		var $ctrl = this;

		$ctrl.values = knownpeer;

		$ctrl.ok = function () {
			lncli.editKnownPeer($ctrl.values).then(function(response) {
				console.log("EditKnownPeer", response);
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
