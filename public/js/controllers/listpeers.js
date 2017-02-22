(function () {

	lnwebcli.controller("ListPeersCtrl", ["$scope", "$timeout", "$uibModal", "lncli", "config", controller]);

	function controller($scope, $timeout, $uibModal, lncli, config) {

		var $ctrl = this;

		$scope.spinner = 0;
		$scope.nextRefresh = null;

		$scope.refresh = function() {
			$scope.spinner++;
			$scope.updateNextRefresh();
			lncli.listPeers().then(function(response) {
				$scope.spinner--;
				console.log(response);
				$scope.data = JSON.stringify(response.data, null, "\t");
				$scope.peers = response.data.peers;
			}, function(err) {
				$scope.spinner--;
				console.log('Error:', err);
				lncli.alert(err.message || err.statusText);
			});
		};

		$scope.updateNextRefresh = function () {
			$timeout.cancel($scope.nextRefresh);
			$scope.nextRefresh = $timeout($scope.refresh,
				lncli.getConfigValue(config.keys.AUTO_REFRESH, config.defaults.AUTO_REFRESH));
		}

		$scope.add = function() {

			var modalInstance = $uibModal.open({
				animation: true,
				ariaLabelledBy: "addpeer-modal-title",
				ariaDescribedBy: "addpeer-modal-body",
				templateUrl: "templates/partials/addpeer.html",
				controller: "ModalAddPeerCtrl",
				controllerAs: "$ctrl",
				size: "lg",
				resolve: {
					defaults: function () {
						return {
							pubkey: "036a0c5ea35df8a528b98edf6f290b28676d51d0fe202b073fe677612a39c0aa09",
							host: "159.203.125.125:10011"
						};
					}
				}
			});

			modalInstance.rendered.then(function() {
				$("#addpeer-pubkey").focus();
			});

			modalInstance.result.then(function (values) {
				console.log("values", values);
				$scope.refresh();
			}, function () {
				console.log('Modal dismissed at: ' + new Date());
			});

		};

		$scope.pubkeyCopied = function(peer) {
			peer.pubkeyCopied = true;
			$timeout(function() {
				peer.pubkeyCopied = false;
			}, 500);
		}

		$scope.addressCopied = function(peer) {
			peer.addressCopied = true;
			$timeout(function() {
				peer.addressCopied = false;
			}, 500);
		}

		$scope.$on(config.events.PEER_REFRESH, function(event, args) {
			console.log("Received event PEER_REFRESH", event, args);
			$scope.refresh();
		});

		$scope.refresh();

	}

})();
