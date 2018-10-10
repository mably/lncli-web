(function queryroute() {
  module.exports = function factory($scope, $uibModalInstance, defaults, lncli) {
    const $ctrl = this;

    $ctrl.spinner = 0;

    $ctrl.values = defaults;
    $ctrl.route = null;

    $ctrl.queryRoute = () => {
      $ctrl.spinner += 1;
      lncli.queryRoute($ctrl.values.pubkey, $ctrl.values.amount).then((response) => {
        $ctrl.spinner -= 1;
        console.log('QueryRoute', response);
        if (response.data.error) {
          $ctrl.route = null;
          if ($ctrl.isClosed) {
            lncli.alert(response.data.error);
          } else {
            $ctrl.warning = response.data.error;
          }
        } else {
          $ctrl.warning = null;
          $ctrl.route = angular.toJson(response.data, 4);
        }
      }, (err) => {
        $ctrl.spinner -= 1;
        console.log(err);
        $ctrl.route = null;
        const errmsg = err.message || err.statusText;
        if ($ctrl.isClosed) {
          lncli.alert(errmsg);
        } else {
          $ctrl.warning = errmsg;
        }
      });
    };

    $ctrl.cancel = () => {
      $uibModalInstance.dismiss('cancel');
    };

    $ctrl.dismissAlert = () => {
      $ctrl.warning = null;
    };

    $scope.$on('modal.closing', (event, reason, closed) => {
      console.log(`modal.closing: ${closed ? 'close' : 'dismiss'}(${reason})`);
      $ctrl.isClosed = true;
    });
  };
}());
