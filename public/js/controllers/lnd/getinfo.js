(function () {
	"use strict";

	module.exports = function ($scope, $timeout, $window, $uibModal, lncli, config) {

		$scope.spinner = 0;
		$scope.nextRefresh = null;

		$scope.refresh = function () {
			$scope.spinner++;
			$scope.updateNextRefresh();
			$scope.endpoint = lncli.getEndPoint();
			lncli.getInfo(false).then(function (response) {
				$scope.spinner--;
				console.log(response);
				$scope.data = JSON.stringify(response.data, null, "\t");
				$scope.info = response.data;
				if (response.data.address) {
					$scope.node_uri = response.data.identity_pubkey + "@" + response.data.address;
				} else {
					delete $scope.node_uri;
				}
			}, function (err) {
				$scope.spinner--;
				console.log("Error:", err);
				lncli.alert(err.message || err.statusText);
			});
		};

		$scope.updateNextRefresh = function () {
			$timeout.cancel($scope.nextRefresh);
			$scope.nextRefresh = $timeout($scope.refresh,
				lncli.getConfigValue(config.keys.AUTO_REFRESH, config.defaults.AUTO_REFRESH));
		};

		$scope.pubkeyCopied = function (info) {
			info.pubkeyCopied = true;
			$timeout(function () {
				info.pubkeyCopied = false;
			}, 500);
		};

		$scope.nodeuriCopied = function (info) {
			info.nodeuriCopied = true;
			$timeout(function () {
				info.nodeuriCopied = false;
			}, 500);
		};

		$scope.openBlockInExplorerByHash = function (blockHash) {
			if (blockHash) {
				$window.open("https://testnet.smartbit.com.au/block/" + blockHash, "_blank");
			}
		};

		$scope.openBlockInExplorerByHeight = function (blockHeight) {
			if (blockHeight) {
				$window.open("https://testnet.smartbit.com.au/block/" + blockHeight, "_blank");
			}
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
							size: (size) ? size : 300
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

		$scope.refresh();

	};

})();
