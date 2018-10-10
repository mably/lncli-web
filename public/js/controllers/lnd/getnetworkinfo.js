(function () {
  module.exports = function ($scope, $timeout, lncli, config) {
    $scope.spinner = 0;
    $scope.nextRefresh = null;

    $scope.refresh = function () {
      $scope.spinner++;
      $scope.updateNextRefresh();
      lncli.getNetworkInfo().then((response) => {
        $scope.spinner--;
        console.log(response);
        $scope.data = JSON.stringify(response.data, null, '\t');
        $scope.info = response.data;
      }, (err) => {
        $scope.spinner--;
        console.log('Error:', err);
        lncli.alert(err.message || err.statusText);
      });
    };

    $scope.updateNextRefresh = function () {
      $timeout.cancel($scope.nextRefresh);
      $scope.nextRefresh = $timeout($scope.refresh,
        lncli.getConfigValue(config.keys.AUTO_REFRESH, config.defaults.AUTO_REFRESH));
    };

    $scope.refresh();
  };
}());
