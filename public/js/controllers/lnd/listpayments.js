(function () {
	"use strict";

	module.exports = function ($scope, $timeout, $uibModal, $, lncli, config) {

		$scope.spinner = 0;
		$scope.nextRefresh = null;
		$scope.numberOfPayments = 0;
		$scope.pageSizes = lncli.getConfigValue(config.keys.PAGE_SIZES, config.defaults.PAGE_SIZES);
		$scope.cfg = {};
		$scope.cfg.itemsPerPage = lncli.getConfigValue(config.keys.LISTPAYMENTS_PAGESIZE, $scope.pageSizes[0]);
		$scope.cfg.listVisible = lncli.getConfigValue(config.keys.LISTPAYMENTS_LISTVISIBLE, true);

		$scope.refresh = function () {
			$scope.spinner++;
			$scope.updateNextRefresh();
			lncli.listPayments().then(function (response) {
				$scope.spinner--;
				console.log(response);
				$scope.data = JSON.stringify(response.data, null, "\t");
				$scope.payments = processPayments(response.data.payments);
				$scope.numberOfPayments = $scope.payments.length;
			}, function (err) {
				$scope.spinner--;
				$scope.numberOfPayments = 0;
				console.log("Error:", err);
				lncli.alert(err.message || err.statusText);
			});
		};

		var processPayments = function (payments) {
			payments.forEach(function (payment) {
				payment.value = parseInt(payment.value);
				payment.fee = parseInt(payment.fee);
			});
			return payments;
		};

		$scope.updateNextRefresh = function () {
			$timeout.cancel($scope.nextRefresh);
			$scope.nextRefresh = $timeout($scope.refresh,
				lncli.getConfigValue(config.keys.AUTO_REFRESH, config.defaults.AUTO_REFRESH));
		};

		$scope.add = function () {

			var modalInstance = $uibModal.open({
				animation: true,
				ariaLabelledBy: "sendpayment-modal-title",
				ariaDescribedBy: "sendpayment-modal-body",
				templateUrl: "templates/partials/lnd/sendpayment.html",
				controller: "ModalSendPaymentCtrl",
				controllerAs: "$ctrl",
				size: "lg",
				resolve: {
					defaults: function () {
						return {
							payreq: ""
						};
					}
				}
			});

			modalInstance.rendered.then(function () {
				$("#sendpayment-payreq").focus();
			});

			modalInstance.result.then(function (values) {
				console.log("values", values);
				$scope.refresh();
			}, function () {
				console.log("Modal dismissed at: " + new Date());
			});

		};

		$scope.pageSizeChanged = function () {
			lncli.setConfigValue(config.keys.LISTPAYMENTS_PAGESIZE, $scope.cfg.itemsPerPage);
		};

		$scope.toggle = function () {
			$scope.cfg.listVisible = !$scope.cfg.listVisible;
			lncli.setConfigValue(config.keys.LISTPAYMENTS_LISTVISIBLE, $scope.cfg.listVisible);
		};

		$scope.refresh();

	};

})();
