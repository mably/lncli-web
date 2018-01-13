(function () {
	"use strict";

	module.exports = function ($rootScope, $scope, $timeout, $uibModal, $, bootbox, lncli, config) {

		var $ctrl = this;

		$scope.spinner = 0;
		$scope.nextRefresh = null;
		$scope.numberOfPeers = 0;
		$scope.pageSizes = lncli.getConfigValue(config.keys.PAGE_SIZES, config.defaults.PAGE_SIZES);
		$scope.cfg = {};
		$scope.cfg.itemsPerPage = lncli.getConfigValue(config.keys.LISTPEERS_PAGESIZE, $scope.pageSizes[0]);

		$scope.refresh = function () {
			$scope.spinner++;
			$scope.updateNextRefresh();
			lncli.listPeers().then(function (response) {
				$scope.spinner--;
				console.log(response);
				$scope.data = JSON.stringify(response.data, null, "\t");
				$scope.peers = response.data.peers;
				$scope.numberOfPeers = $scope.peers.length;
			}, function (err) {
				$scope.spinner--;
				$scope.numberOfPeers = 0;
				console.log("Error:", err);
				lncli.alert(err.message || err.statusText);
			});
		};

		$scope.updateNextRefresh = function () {
			$timeout.cancel($scope.nextRefresh);
			$scope.nextRefresh = $timeout($scope.refresh,
				lncli.getConfigValue(config.keys.AUTO_REFRESH, config.defaults.AUTO_REFRESH));
		};

		$scope.add = function () {

			var modalInstance = $uibModal.open({
				animation: true,
				ariaLabelledBy: "addpeer-modal-title",
				ariaDescribedBy: "addpeer-modal-body",
				templateUrl: "templates/partials/lnd/addpeer.html",
				controller: "ModalAddPeerCtrl",
				controllerAs: "$ctrl",
				size: "lg",
				resolve: {
					defaults: function () {
						return {
							pubkey: "",
							host: ""
						};
					}
				}
			});

			modalInstance.rendered.then(function () {
				$("#addpeer-pubkey").focus();
			});

			modalInstance.result.then(function (values) {
				console.log("values", values);
				$scope.refresh();
			}, function () {
				console.log("Modal dismissed at: " + new Date());
			});

		};

		$scope.disconnect = function (peer) {
			bootbox.confirm("Do you really want to disconnect from that peer?", function (result) {
				if (result) {
					$scope.spinner++;
					lncli.disconnectPeer(peer.pub_key).then(function (response) {
						$scope.spinner--;
						console.log("DisconnectPeer", response);
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
				}
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

		$scope.showQRCode = function (data, size) {

			var modalInstance = $uibModal.open({
				animation: true,
				ariaLabelledBy: "qrcode-modal-title",
				ariaDescribedBy: "qrcode-modal-body",
				templateUrl: "templates/partials/lnd/qrcode.html",
				controller: "ModalQRCodeCtrl",
				controllerAs: "$ctrl",
				size: "lg",
				resolve: {
					qrcode: function () {
						return {
							data: data,
							size: (size) ? size : 200
						};
					}
				}
			});

			modalInstance.result.then(function (values) {
				console.log("values", values);
			}, function () {
				console.log("Modal dismissed at: " + new Date());
			});

		};

		$scope.$on(config.events.PEER_REFRESH, function (event, args) {
			console.log("Received event PEER_REFRESH", event, args);
			$scope.refresh();
		});

		$scope.pageSizeChanged = function () {
			lncli.setConfigValue(config.keys.LISTPEERS_PAGESIZE, $scope.cfg.itemsPerPage);
		};

		$scope.refresh();

	};

})();
