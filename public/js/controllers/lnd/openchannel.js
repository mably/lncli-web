(function () {
	"use strict";

	module.exports = function ($scope, $timeout, $uibModalInstance, defaults, lncli) {

		var $ctrl = this;

		var listenersIds = [];

		$ctrl.spinner = 0;

		$ctrl.values = defaults;

		$ctrl.ok = function () {
			if (checkform()) {
				$ctrl.spinner++;
				lncli.openChannel($ctrl.values.pubkey, $ctrl.values.localamt, $ctrl.values.pushamt, $ctrl.values.satperbyte,
						$ctrl.values.targetconf, $ctrl.values.remotecsvdelay, $ctrl.values.privatechan).then(function (response) {
					console.log("OpenChannel", response);
					var requestId = response.rid;
					// timer to not wait indefinitely for first websocket event
					var waitTimer = $timeout(function () {
						$ctrl.spinner--;
						listenersIds.splice(listenersIds.indexOf(requestId), 1);
						lncli.unregisterWSRequestListener(requestId);
						$uibModalInstance.close($ctrl.values);
					}, 15000); // Wait 5 seconds maximmum for socket response
					listenersIds.push(requestId);
					// We wait for first websocket event to check for errors
					lncli.registerWSRequestListener(requestId, function (response) {
						$ctrl.spinner--;
						$timeout.cancel(waitTimer);
						listenersIds.splice(listenersIds.indexOf(requestId), 1);
						lncli.unregisterWSRequestListener(requestId);
						if ($ctrl.isClosed) {
							return true;
						} else {
							if (response.evt === "error") {
								$ctrl.warning = response.data.error;
								return false;
							} else {
								$timeout(function () {
									$uibModalInstance.close($ctrl.values);
								});
								return true;
							}
						}
					});
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
			}
		};

		$ctrl.cancel = function () {
			$uibModalInstance.dismiss("cancel");
		};

		$ctrl.dismissAlert = function () {
			$ctrl.warning = null;
		};

		var checkform = function () {
			$ctrl.warning = null;
			if (!$ctrl.values.pubkey) {
				$ctrl.warning = "Remote node pubkey is required.";
				return false;
			}
			if (!$ctrl.values.localamt || $ctrl.values.localamt <= 0) {
				$ctrl.warning = "A non-zero local amount is required.";
				return false;
			}
			return true;
		};

		var unregisterWSRequestListeners = function () {
			for (var i = 0; i < listenersIds.length; i++) {
				lncli.unregisterWSRequestListener(listenersIds[i]);
			}
			listenersIds.length = 0;
		};

		$scope.$on("modal.closing", function (event, reason, closed) {
			console.log("modal.closing: " + (closed ? "close" : "dismiss") + "(" + reason + ")");
			$ctrl.isClosed = true;
			$ctrl.warning = null;
			unregisterWSRequestListeners();
		});

	};

})();
