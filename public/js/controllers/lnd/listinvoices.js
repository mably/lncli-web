(function () {
	"use strict";

	module.exports = function ($scope, $timeout, $uibModal, $, lncli, config, utils) {

		$scope.spinner = 0;
		$scope.nextRefresh = null;
		$scope.lastRefreshed = null;
		$scope.numberOfInvoices = 0;
		$scope.pageSizes = lncli.getConfigValue(config.keys.PAGE_SIZES, config.defaults.PAGE_SIZES);
		$scope.cfg = {};
		$scope.cfg.itemsPerPage = lncli.getConfigValue(config.keys.LISTINVOICES_PAGESIZE, $scope.pageSizes[0]);
		$scope.cfg.listVisible = lncli.getConfigValue(config.keys.LISTINVOICES_LISTVISIBLE, true);

		$scope.refresh = function () {
			if ($scope.cfg.listVisible) {
				$scope.lastRefreshed = Date.now();
				$scope.updateNextRefresh();
				$scope.spinner++;
				lncli.listInvoices().then(function (response) {
					$scope.spinner--;
					console.log(response);
					$scope.data = JSON.stringify(response.data, null, "\t");
					$scope.invoices = processInvoices(response.data.invoices);
					$scope.numberOfInvoices = $scope.invoices.length;
				}, function (err) {
					$scope.spinner--;
					$scope.numberOfInvoices = 0;
					console.log("Error:", err);
					lncli.alert(err.message || err.statusText);
				});
			}
		};

		var processInvoices = function (invoices) {
			invoices.forEach(function (invoice) {
				invoice.value = parseInt(invoice.value);
				invoice.hash = utils.buffer2hexa(invoice.r_hash.data, false);
			});
			return invoices;
		};

		var getRefreshPeriod = function () {
			return lncli.getConfigValue(config.keys.AUTO_REFRESH, config.defaults.AUTO_REFRESH);
		};

		$scope.updateNextRefresh = function () {
			$timeout.cancel($scope.nextRefresh);
			$scope.nextRefresh = $timeout($scope.refresh, getRefreshPeriod());
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

		$scope.$on(config.events.INVOICE_REFRESH, function (event, args) {
			console.log("Received event INVOICE_REFRESH", event, args);
			$scope.refresh();
		});

		$scope.pageSizeChanged = function () {
			lncli.setConfigValue(config.keys.LISTINVOICES_PAGESIZE, $scope.cfg.itemsPerPage);
		};

		$scope.toggle = function () {
			$scope.cfg.listVisible = !$scope.cfg.listVisible;
			lncli.setConfigValue(config.keys.LISTINVOICES_LISTVISIBLE, $scope.cfg.listVisible);
			if ($scope.cfg.listVisible) {
				// Refresh if not been refreshed for more than refresh period
				if (Date.now() - $scope.lastRefreshed > getRefreshPeriod()) {
					$scope.refresh();
				}
			}
		};

		$scope.refresh();

	};

})();
