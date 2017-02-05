(function () {

	lnwebcli.controller("ListKnownPeersCtrl", ["$scope", "$uibModal", "lncli", controller]);

	function controller($scope, $uibModal, lncli) {

		var $ctrl = this;

		$scope.refresh = function() {
			lncli.listKnownPeers().then(function(response) {
				console.log(response);
				$scope.data = JSON.stringify(response, null, "\t");
				$scope.peers = response;
			}, function(err) {
				console.log('Error: ' + err);
			});
		};

		$scope.connect = function(peer) {
			lncli.connectPeer(peer.pub_key, peer.address).then(function(response) {
				console.log("ConnectKnownPeer", response);
				if (response.data.error) {
					alert(response.data.error);
				}
			}, function (err) {
				alert(err);
			});
		};

		$scope.edit = function(peer) {
			var modalInstance = $uibModal.open({
				animation: true,
				ariaLabelledBy: "editknownpeer-modal-title",
				ariaDescribedBy: "editknownpeer-modal-body",
				templateUrl: "templates/partials/editknownpeer.html",
				controller: "ModalEditKnownPeerCtrl",
				controllerAs: "$ctrl",
				size: "lg",
				resolve: {
					knownpeer: function () {
						var peerTemp = {};
						angular.copy(peer, peerTemp);
						return peerTemp;
					}
				}
			});

			modalInstance.result.then(function (values) {
				console.log("EditKnownPeer updated values", values);
				$scope.refresh();
			}, function () {
				console.log('Modal EditKnownPeer dismissed at: ' + new Date());
			});
		};

		$scope.refresh();

	}

})();
