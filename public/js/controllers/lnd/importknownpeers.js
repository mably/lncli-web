(function () {

	lnwebcli.controller("ModalImportKnownPeersCtrl", ["$uibModalInstance", "defaults", "lncli", controller]);

	function controller ($uibModalInstance, defaults, lncli) {

		var $ctrl = this;

		$ctrl.values = defaults;

		$ctrl.ok = function () {
			try {
				var peersObj = JSON.parse($ctrl.values.peersjson);
				lncli.importKnownPeers(peersObj).then(function(response) {
					console.log("ImportKnownPeers", response);
					$ctrl.warning = null;
					$uibModalInstance.close($ctrl.values);
					lncli.alert("Peers successfully imported!");
				}, function (err) {
					console.log(err);
					lncli.alert(err.message);
				});
			} catch (err) {
				$ctrl.warning = err.message;
			}
		};

		$ctrl.cancel = function () {
			$uibModalInstance.dismiss('cancel');
		};
		
		$ctrl.dismissAlert = function() {
			$ctrl.warning = null;
		}

	}

})();
