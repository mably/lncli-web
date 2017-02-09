(function () {

	lnwebcli.controller("ModalImportKnownPeersCtrl", ["$uibModalInstance", "defaults", "lncli", controller]);

	function controller ($uibModalInstance, defaults, lncli) {

		var $ctrl = this;

		$ctrl.values = defaults;

		$ctrl.ok = function () {
			lncli.importKnownPeers(JSON.parse($ctrl.values.peersjson)).then(function(response) {
				console.log("ImportKnownPeers", response);
				$ctrl.warning = null;
				$uibModalInstance.close($ctrl.values);
			}, function (err) {
				alert(err);
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
