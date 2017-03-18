(function () {

	lnwebcli.controller("ModalAddPeerCtrl", ["$rootScope", "$scope", "$uibModalInstance", "defaults", "lncli", "config", controller]);

	function controller ($rootScope, $scope, $uibModalInstance, defaults, lncli, config) {

		var $ctrl = this;

		$ctrl.spinner = 0;

		$ctrl.values = defaults;

		$ctrl.ok = function () {
			$ctrl.spinner++;
			lncli.connectPeer($ctrl.values.pubkey, $ctrl.values.host).then(function(response) {
				$ctrl.spinner--;
				console.log("AddPeer", response);
				if (response.data.error) {
					if ($ctrl.isClosed) {
						lncli.alert(response.data.error);
					} else {
						$ctrl.warning = response.data.error;
					}
				} else {
					$ctrl.warning = null;
					$rootScope.$broadcast(config.events.PEER_REFRESH, response);
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

		$ctrl.cancel = function () {
			$uibModalInstance.dismiss('cancel');
		};
		
		$ctrl.dismissAlert = function() {
			$ctrl.warning = null;
		}

		$scope.$on("modal.closing", function (event, reason, closed) {
			console.log("modal.closing: " + (closed ? "close" : "dismiss") + "(" + reason + ")");
			$ctrl.isClosed = true;
		});

	}

})();
