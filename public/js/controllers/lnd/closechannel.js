(function () {
	"use strict";

	module.exports = function ($rootScope, $scope, $timeout, $uibModalInstance, channel, lncli) {

		var $ctrl = this;

		var listenersIds = [];

		$ctrl.spinner = 0;

		$ctrl.channel = channel;

		$ctrl.ok = function () {
			var channelPoint = $ctrl.channel.channel_point.split(":");
			var force = $ctrl.channel.forceclose;
			$ctrl.spinner++;
			lncli.closeChannel(channelPoint[0], channelPoint[1], force).then(function (response) {
				console.log("CloseChannel", response);
				var requestId = response.rid;
				// timer to not wait indefinitely for first websocket event
				var waitTimer = $timeout(function () {
					$ctrl.spinner--;
					listenersIds.splice(listenersIds.indexOf(requestId), 1);
					lncli.unregisterWSRequestListener(requestId);
					$uibModalInstance.close($ctrl.values);
				}, 5000); // Wait 5 seconds maximmum for socket response
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
							$rootScope.$broadcast(config.events.CHANNEL_REFRESH, response);
							$timeout(function () {
								$uibModalInstance.close($ctrl.values);
							});
							return true;
						}
					}
				});
			}, function (err) {
				$ctrl.spinner--;
				console.log("Error", err);
				var errmsg = err.message || err.statusText;
				if ($ctrl.isClosed) {
					lncli.alert(errmsg);
				} else {
					$ctrl.warning = errmsg;
				}
			});
		};

		$ctrl.cancel = function () {
			$uibModalInstance.dismiss("cancel");
		};

		$ctrl.dismissAlert = function () {
			$ctrl.warning = null;
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
