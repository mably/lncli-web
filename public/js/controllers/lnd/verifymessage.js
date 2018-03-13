(function () {
	"use strict";

	module.exports = function ($uibModalInstance, defaults, lncli) {

		var $ctrl = this;

		$ctrl.spinner = 0;

		$ctrl.values = defaults;
		$ctrl.success = null;
		$ctrl.warning = null;
		$ctrl.data = null;

		$ctrl.ok = function () {
			$ctrl.spinner++;
			lncli.verifyMessage($ctrl.values.message, $ctrl.values.signature).then(function (response) {
				$ctrl.spinner--;
				console.log("VerifyMessage", response);
				if (response.data.error) {
					$ctrl.data = null;
					if ($ctrl.isClosed) {
						lncli.alert(response.data.error);
					} else {
						$ctrl.success = null;
						$ctrl.warning = response.data.error;
					}
				} else {
					$ctrl.data = response.data;
					if (response.data.valid) {
						$ctrl.warning = null;
						$ctrl.success = "Message signature successfully verified.";
						lncli.getKnownPeer(true, response.data.pubkey).then(function (signingPeer) {
							$ctrl.data.custom_alias = signingPeer.custom_alias;
						}, function (err) {
							console.log(err);
						});
					} else {
						$ctrl.success = null;
						$ctrl.warning = "Signature is invalid.";
					}
				}
			}, function (err) {
				$ctrl.spinner--;
				console.log(err);
				$ctrl.data = null;
				var errmsg = err.message || err.statusText;
				if ($ctrl.isClosed) {
					lncli.alert(errmsg);
				} else {
					$ctrl.success = null;
					$ctrl.warning = errmsg;
				}
			});
		};

		$ctrl.close = function () {
			$uibModalInstance.close($ctrl.values);
		};

		$ctrl.dismissWarning = function () {
			$ctrl.warning = null;
		};

		$ctrl.dismissSuccess = function () {
			$ctrl.success = null;
		};

	};

})();
