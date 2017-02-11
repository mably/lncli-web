(function () {

	lnwebcli.controller("ModalOpenChannelCtrl", ["$scope", "$uibModalInstance", "defaults", "lncli", controller]);

	function controller ($scope, $uibModalInstance, defaults, lncli) {

		var $ctrl = this;

		$ctrl.spinner = 0;

		$ctrl.values = defaults;

		$ctrl.ok = function () {
			$ctrl.spinner++;
			lncli.openChannel($ctrl.values.pubkey, $ctrl.values.localamt, $ctrl.values.pushamt, $ctrl.values.numconf).then(function(response) {
				$ctrl.spinner--;
				console.log("OpenChannel", response);
				if (response.data.error) {
					if ($ctrl.isClosed) {
						bootbox.alert(response.data.error);
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
					bootbox.alert(errmsg);
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
