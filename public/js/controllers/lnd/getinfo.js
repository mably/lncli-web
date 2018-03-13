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
				if ($scope.info.uris && $scope.info.uris.length > 0) {
					$scope.node_uri = $scope.info.uris[0];
					$scope.node_address = $scope.node_uri.substr($scope.node_uri.indexOf("@") + 1);
				} else {
					delete $scope.node_uri;
					delete $scope.node_address;
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

		$scope.blockhashCopied = function (info) {
			info.blockhashCopied = true;
			$timeout(function () {
				info.blockhashCopied = false;
			}, 500);
		};

		$scope.openBlockInExplorerByHash = function (blockHash) {
			if (blockHash) {
				$window.open(lncli.getBlockByHashURL(blockHash), "_blank");
			}
		};

		$scope.openBlockInExplorerByHeight = function (blockHeight) {
			if (blockHeight) {
				$window.open(lncli.getBlockByHeightURL(blockHeight), "_blank");
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
