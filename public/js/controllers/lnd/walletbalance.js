(function walletBalance() {
  module.exports = function controller($scope, $timeout, $uibModal, $, lncli, config) {
    $scope.spinner = 0;
    $scope.nextRefresh = null;

    $scope.refresh = () => {
      $scope.spinner += 1;
      $scope.updateNextRefresh();
      lncli.walletBalance().then((response) => {
        $scope.spinner -= 1;
        console.log(response);
        $scope.data = JSON.stringify(response.data, null, '\t');
        $scope.info = response.data;
      }, (err) => {
        $scope.spinner -= 1;
        console.log('Error:', err);
        lncli.alert(err.message || err.statusText);
      });
    };

    $scope.updateNextRefresh = () => {
      $timeout.cancel($scope.nextRefresh);
      $scope.nextRefresh = $timeout($scope.refresh,
        lncli.getConfigValue(config.keys.AUTO_REFRESH, config.defaults.AUTO_REFRESH));
    };

    $scope.newAddress = () => {
      const modalInstance = $uibModal.open(config.modals.NEW_ADDRESS);

      modalInstance.rendered.then(() => {
        $('#newaddress-type').focus();
      });

      modalInstance.result.then((values) => {
        console.log('values', values);
      }, () => {
        console.log(`Modal dismissed at: ${new Date()}`);
      });
    };

    $scope.sendCoins = () => {
      const modalInstance = $uibModal.open(config.modals.SEND_COINS);

      modalInstance.rendered.then(() => {
        $('#sendcoins-addr').focus();
      });

      modalInstance.result.then((values) => {
        console.log('values', values);
        $scope.refresh();
      }, () => {
        console.log(`Modal dismissed at: ${new Date()}`);
      });
    };

    $scope.$on(config.events.BALANCE_REFRESH, (event, args) => {
      console.log('Received event BALANCE_REFRESH', event, args);
      $scope.refresh();
    });

    $scope.refresh();
  };
}());
