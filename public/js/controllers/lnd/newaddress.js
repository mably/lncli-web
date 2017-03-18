(function () {

	lnwebcli.controller("ModalNewAddressCtrl", ["$uibModalInstance", "defaults", "lncli", controller]);

	function controller ($uibModalInstance, defaults, lncli) {

		var $ctrl = this;

		$ctrl.values = defaults;
		$ctrl.addressTypes = [
			{name : "WITNESS_PUBKEY_HASH", id : 0},
			{name : "NESTED_PUBKEY_HASH", id : 1},
			{name : "PUBKEY_HASH", id : 2},
		];

		$ctrl.ok = function () {
			lncli.newAddress($ctrl.values.type).then(function(response) {
				console.log("NewAddress", response);
				$ctrl.warning = null;
				$ctrl.success = JSON.stringify(response.data, null, "\t");
				var address = angular.copy(response.data);
				address.created = Math.floor(Date.now() / 1000);
				address.type = $ctrl.values.type;
				lncli.addAddress(address.address, address);
			}, function (err) {
				$ctrl.warning = err;
				$ctrl.success = null;
			});
		};

		$ctrl.close = function () {
			$uibModalInstance.close($ctrl.values);
		};

		$ctrl.dismissWarning = function() {
			$ctrl.warning = null;
		}

		$ctrl.dismissSuccess = function() {
			$ctrl.success = null;
		}

	}

})();
