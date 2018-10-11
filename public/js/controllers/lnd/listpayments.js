(function listPayments() {
  module.exports = function controller($scope, $timeout, $uibModal, $, lncli, config) {
    $scope.spinner = 0;
    $scope.nextRefresh = null;
    $scope.lastRefreshed = null;
    $scope.numberOfPayments = 0;
    $scope.pageSizes = lncli.getConfigValue(config.keys.PAGE_SIZES, config.defaults.PAGE_SIZES);
    $scope.cfg = {};
    $scope.cfg.itemsPerPage = lncli.getConfigValue(
      config.keys.LISTPAYMENTS_PAGESIZE, $scope.pageSizes[0],
    );
    $scope.cfg.listVisible = lncli.getConfigValue(config.keys.LISTPAYMENTS_LISTVISIBLE, true);

    const processPayments = (payments) => {
      payments.forEach((payment) => {
        payment.value = parseInt(payment.value, 10);
        payment.fee = parseInt(payment.fee, 10);
      });
      return payments;
    };

    $scope.refresh = () => {
      if ($scope.cfg.listVisible) {
        $scope.lastRefreshed = Date.now();
        $scope.updateNextRefresh();
        $scope.spinner += 1;
        lncli.listPayments().then((response) => {
          $scope.spinner -= 1;
          console.log(response);
          $scope.data = JSON.stringify(response.data, null, '\t');
          $scope.payments = processPayments(response.data.payments);
          $scope.numberOfPayments = $scope.payments.length;
        }, (err) => {
          $scope.spinner -= 1;
          $scope.numberOfPayments = 0;
          console.log('Error:', err);
          lncli.alert(err.message || err.statusText);
        });
      }
    };

    const getRefreshPeriod = () => lncli.getConfigValue(
      config.keys.AUTO_REFRESH, config.defaults.AUTO_REFRESH,
    );

    $scope.updateNextRefresh = () => {
      $timeout.cancel($scope.nextRefresh);
      $scope.nextRefresh = $timeout($scope.refresh, getRefreshPeriod());
    };

    $scope.add = () => {
      const modalInstance = $uibModal.open({
        animation: true,
        ariaLabelledBy: 'sendpayment-modal-title',
        ariaDescribedBy: 'sendpayment-modal-body',
        templateUrl: 'templates/partials/lnd/sendpayment.html',
        controller: 'ModalSendPaymentCtrl',
        controllerAs: '$ctrl',
        size: 'lg',
        resolve: {
          defaults() {
            return {
              payreq: '',
            };
          },
        },
      });

      modalInstance.rendered.then(() => {
        $('#sendpayment-payreq').focus();
      });

      modalInstance.result.then((values) => {
        console.log('values', values);
        $scope.refresh();
      }, () => {
        console.log(`Modal dismissed at: ${new Date()}`);
      });
    };

    $scope.pageSizeChanged = () => {
      lncli.setConfigValue(config.keys.LISTPAYMENTS_PAGESIZE, $scope.cfg.itemsPerPage);
    };

    $scope.toggle = () => {
      $scope.cfg.listVisible = !$scope.cfg.listVisible;
      lncli.setConfigValue(config.keys.LISTPAYMENTS_LISTVISIBLE, $scope.cfg.listVisible);
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
