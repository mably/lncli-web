(function () {

	lnwebcli.controller("ModalEditKnownPeerCtrl", ["$rootScope", "$uibModalInstance", "knownpeer", "lncli", "config", controller]);

	function controller ($rootScope, $uibModalInstance, knownpeer, lncli, config) {

		var $ctrl = this;

		$ctrl.values = knownpeer;

		$ctrl.ok = function () {
			lncli.editKnownPeer($ctrl.values).then(function(response) {
				console.log("EditKnownPeer", response);
				$ctrl.warning = null;
				$rootScope.$broadcast(config.events.PEER_REFRESH, response);
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
