(function () {
	"use strict";

	module.exports = function ($rootScope, $scope, $timeout, $uibModal, $, bootbox, lncli, config) {

		var $ctrl = this;

		$scope.spinner = 0;
		$scope.numberOfPeers = 0;
		$scope.pageSizes = lncli.getConfigValue(config.keys.PAGE_SIZES, config.defaults.PAGE_SIZES);
		$scope.cfg = {};
		$scope.cfg.itemsPerPage = lncli.getConfigValue(config.keys.LISTKNOWNPEERS_PAGESIZE, $scope.pageSizes[0]);

		$scope.refresh = function () {
			$scope.spinner++;
			lncli.listKnownPeers().then(function (response) {
				$scope.spinner--;
				console.log(response);
				$scope.data = JSON.stringify(response, null, "\t");
				$scope.peers = response;
				$scope.numberOfPeers = $scope.peers.length;
			}, function (err) {
				$scope.spinner--;
				$scope.numberOfPeers = 0;
				console.log("Error:", err);
				lncli.alert(err.message || err.statusText);
			});
		};

		$scope.connect = function (peer) {
			$scope.spinner++;
			lncli.connectPeer(peer.pub_key, peer.address).then(function (response) {
				$scope.spinner--;
				console.log("ConnectKnownPeer", response);
				if (response.data.error) {
					lncli.alert(response.data.error);
				} else {
					$rootScope.$broadcast(config.events.PEER_REFRESH, response);
				}
			}, function (err) {
				$scope.spinner--;
				console.log(err);
				lncli.alert(err.message || err.statusText);
			});
		};

		$scope.edit = function (peer) {
			var modalInstance = $uibModal.open({
				animation: true,
				ariaLabelledBy: "editknownpeer-modal-title",
				ariaDescribedBy: "editknownpeer-modal-body",
				templateUrl: "templates/partials/lnd/editknownpeer.html",
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

			modalInstance.rendered.then(function () {
				$("#editknownpeer-alias").focus();
			});

			modalInstance.result.then(function (values) {
				console.log("EditKnownPeer updated values", values);
				$scope.refresh();
			}, function () {
				console.log("Modal EditKnownPeer dismissed at: " + new Date());
			});
		};

		$scope.remove = function (peer) {
			bootbox.confirm("Do you really want to remove that peer?", function (result) {
				if (result) {
					lncli.removeKnownPeer(peer.pub_key).then(function (response) {
						console.log("RemoveKnownPeer removed=", response);
						$scope.refresh();
					}, function (err) {
						console.log(err);
						lncli.alert(err.message);
					});
				}
			});
		};

		$scope.import = function () {
			var modalInstance = $uibModal.open({
				animation: true,
				ariaLabelledBy: "importknownpeers-modal-title",
				ariaDescribedBy: "importknownpeers-modal-body",
				templateUrl: "templates/partials/lnd/importknownpeers.html",
				controller: "ModalImportKnownPeersCtrl",
				controllerAs: "$ctrl",
				size: "lg",
				resolve: {
					defaults: {
						peersjson: angular.toJson($scope.peers, 4)
					}
				}
			});

			modalInstance.rendered.then(function () {
				$("#importknownpeers-peersjson").focus();
			});

			modalInstance.result.then(function (values) {
				console.log("ImportKnownPeers updated values", values);
				$scope.refresh();
			}, function () {
				console.log("Modal ImportKnownPeers dismissed at: " + new Date());
			});
		};

		$scope.pubkeyCopied = function (peer) {
			peer.pubkeyCopied = true;
			$timeout(function () {
				peer.pubkeyCopied = false;
			}, 500);
		};

		$scope.addressCopied = function (peer) {
			peer.addressCopied = true;
			$timeout(function () {
				peer.addressCopied = false;
			}, 500);
		};

		$scope.$on(config.events.PEER_REFRESH, function (event, args) {
			console.log("Received event PEER_REFRESH", event, args);
			$scope.refresh();
		});

		$scope.pageSizeChanged = function () {
			lncli.setConfigValue(config.keys.LISTKNOWNPEERS_PAGESIZE, $scope.cfg.itemsPerPage);
		};

		$scope.refresh();

	};

})();
