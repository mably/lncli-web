(function () {
	"use strict";

	module.exports = function ($scope, $timeout, $uibModal, $, lncli, config) {

		$scope.spinner = 0;
		$scope.nextRefresh = null;
		$scope.numberOfInvoices = 0;
		$scope.pageSizes = lncli.getConfigValue(config.keys.PAGE_SIZES, config.defaults.PAGE_SIZES);
		$scope.cfg = {};
		$scope.cfg.itemsPerPage = lncli.getConfigValue(config.keys.LISTINVOICES_PAGESIZE, $scope.pageSizes[0]);

		$scope.refresh = function () {
			$scope.spinner++;
			$scope.updateNextRefresh();
			lncli.listInvoices().then(function (response) {
				$scope.spinner--;
				console.log(response);
				$scope.data = JSON.stringify(response.data, null, "\t");
				$scope.invoices = response.data.invoices;
				$scope.numberOfInvoices = $scope.invoices.length;
			}, function (err) {
				$scope.spinner--;
				$scope.numberOfInvoices = 0;
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

			var expiryTime = lncli.getConfigValue(
					config.keys.INVOICE_EXPIRY, config.defaults.INVOICE_EXPIRY);

			var modalInstance = $uibModal.open({
				animation: true,
				ariaLabelledBy: "addinvoice-modal-title",
				ariaDescribedBy: "addinvoice-modal-body",
				templateUrl: "templates/partials/lnd/addinvoice.html",
				controller: "ModalAddInvoiceCtrl",
				controllerAs: "$ctrl",
				size: "lg",
				resolve: {
					defaults: function () {
						return {
							memo: "test",
							value: "1000",
							expiry: expiryTime
						};
					}
				}
			});

			modalInstance.rendered.then(function () {
				$("#addinvoice-memo").focus();
			});

			modalInstance.result.then(function (values) {
				console.log("values", values);
				$scope.refresh();
			}, function () {
				console.log("Modal dismissed at: " + new Date());
			});

		};

		$scope.payreqCopied = function (invoice) {
			invoice.payreqCopied = true;
			$timeout(function () {
				invoice.payreqCopied = false;
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

		$scope.pageSizeChanged = function () {
			lncli.setConfigValue(config.keys.LISTINVOICES_PAGESIZE, $scope.cfg.itemsPerPage);
		};

		$scope.refresh();

	};

})();
