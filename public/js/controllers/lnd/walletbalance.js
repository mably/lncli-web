(function () {
	"use strict";

	module.exports = function ($scope, $timeout, $uibModal, $, lncli, config) {

		$scope.spinner = 0;
		$scope.nextRefresh = null;

		$scope.refresh = function () {
			$scope.spinner++;
			$scope.updateNextRefresh();
			lncli.walletBalance().then(function (response) {
				$scope.spinner--;
				console.log(response);
				$scope.data = JSON.stringify(response.data, null, "\t");
				$scope.info = response.data;
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

		$scope.newAddress = function () {

			var modalInstance = $uibModal.open(config.modals.NEW_ADDRESS);

			modalInstance.rendered.then(function () {
				$("#newaddress-type").focus();
			});

			modalInstance.result.then(function (values) {
				console.log("values", values);
			}, function () {
				console.log("Modal dismissed at: " + new Date());
			});

		};

		$scope.sendCoins = function () {

			var modalInstance = $uibModal.open(config.modals.SEND_COINS);

			modalInstance.rendered.then(function () {
				$("#sendcoins-addr").focus();
			});

			modalInstance.result.then(function (values) {
				console.log("values", values);
				$scope.refresh();
			}, function () {
				console.log("Modal dismissed at: " + new Date());
			});

		};

		$scope.$on(config.events.BALANCE_REFRESH, function (event, args) {
			console.log("Received event BALANCE_REFRESH", event, args);
			$scope.refresh();
		});

		$scope.refresh();

	};

})();
