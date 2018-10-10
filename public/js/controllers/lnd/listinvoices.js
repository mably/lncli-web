(function () {
  module.exports = function factory($scope, $timeout, $uibModal, $, lncli, config, utils) {
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
        $scope.spinner += 1;
        lncli.listInvoices().then((response) => {
          $scope.spinner -= 1;
          console.log(response);
          $scope.data = JSON.stringify(response.data, null, '\t');
          $scope.invoices = processInvoices(response.data.invoices);
          $scope.numberOfInvoices = $scope.invoices.length;
        }, (err) => {
          $scope.spinner -= 1;
          $scope.numberOfInvoices = 0;
          console.log('Error:', err);
          lncli.alert(err.message || err.statusText);
        });
      }
    };

    var processInvoices = function (invoices) {
      invoices.forEach((invoice) => {
        invoice.value = parseInt(invoice.value);
        invoice.hash = utils.buffer2hexa(invoice.r_hash.data, false);
      });
      return invoices;
    };

    const getRefreshPeriod = function () {
      return lncli.getConfigValue(config.keys.AUTO_REFRESH, config.defaults.AUTO_REFRESH);
    };

    $scope.updateNextRefresh = function () {
      $timeout.cancel($scope.nextRefresh);
      $scope.nextRefresh = $timeout($scope.refresh, getRefreshPeriod());
    };

    $scope.add = function () {
      const expiryTime = lncli.getConfigValue(
        config.keys.INVOICE_EXPIRY, config.defaults.INVOICE_EXPIRY,
      );

      const modalInstance = $uibModal.open({
        animation: true,
        ariaLabelledBy: 'addinvoice-modal-title',
        ariaDescribedBy: 'addinvoice-modal-body',
        templateUrl: 'templates/partials/lnd/addinvoice.html',
        controller: 'ModalAddInvoiceCtrl',
        controllerAs: '$ctrl',
        size: 'lg',
        resolve: {
          defaults() {
            return {
              memo: 'test',
              value: '1000',
              expiry: expiryTime,
            };
          },
        },
      });

      modalInstance.rendered.then(() => {
        $('#addinvoice-memo').focus();
      });

      modalInstance.result.then((values) => {
        console.log('values', values);
        $scope.refresh();
      }, () => {
        console.log(`Modal dismissed at: ${new Date()}`);
      });
    };

    $scope.payreqCopied = function (invoice) {
      invoice.payreqCopied = true;
      $timeout(() => {
        invoice.payreqCopied = false;
      }, 500);
    };

    $scope.showQRCode = function (data, size) {
      const modalInstance = $uibModal.open({
        animation: true,
        ariaLabelledBy: 'qrcode-modal-title',
        ariaDescribedBy: 'qrcode-modal-body',
        templateUrl: 'templates/partials/lnd/qrcode.html',
        controller: 'ModalQRCodeCtrl',
        controllerAs: '$ctrl',
        size: 'lg',
        resolve: {
          qrcode() {
            return {
              data,
              size: (size) || 300,
            };
          },
        },
      });

      modalInstance.result.then((values) => {
        console.log('values', values);
      }, () => {
        console.log(`Modal dismissed at: ${new Date()}`);
      });
    };

    $scope.$on(config.events.INVOICE_REFRESH, (event, args) => {
      console.log('Received event INVOICE_REFRESH', event, args);
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
}());
