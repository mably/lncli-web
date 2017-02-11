(function () {

	lnwebcli.controller("ModalCloseChannelCtrl", ["$uibModalInstance", "channel", "lncli", controller]);

	function controller ($uibModalInstance, channel, lncli) {

		var $ctrl = this;

		$ctrl.spinner = 0;

		$ctrl.channel = channel;

		$ctrl.ok = function () {
			var channelPoint = $ctrl.channel.channel_point.split(":");
			var force = $ctrl.channel.forceclose;
			$ctrl.spinner++;
			lncli.closeChannel(channelPoint[0], channelPoint[1], force).then(function(response) {
				$ctrl.spinner--;
				console.log("CloseChannel", response);
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
			}, function(err) {
				$ctrl.spinner--;
				console.log('Error', err);
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
