(function () {
  module.exports = function factory($scope, $uibModalInstance, defaults, lncli) {
    const $ctrl = this;

    $ctrl.spinner = 0;

    $ctrl.values = defaults;
    $ctrl.nodeInfo = null;

    $ctrl.getNodeInfo = function () {
      $ctrl.spinner += 1;
      lncli.getNodeInfo($ctrl.values.pubkey).then((response) => {
        $ctrl.spinner -= 1;
        console.log('NodeInfo', response);
        if (response.data.error) {
          $ctrl.nodeInfo = null;
          if ($ctrl.isClosed) {
            lncli.alert(response.data.error);
          } else {
            $ctrl.warning = response.data.error;
          }
        } else {
          $ctrl.warning = null;
          $ctrl.nodeInfo = angular.toJson(response.data, 4);
        }
      }, (err) => {
        $ctrl.spinner -= 1;
        console.log(err);
        $ctrl.nodeInfo = null;
        const errmsg = err.message || err.statusText;
        if ($ctrl.isClosed) {
          lncli.alert(errmsg);
        } else {
          $ctrl.warning = errmsg;
        }
      });
    };

    if ($ctrl.values.pubkey) {
      $ctrl.getNodeInfo();
    }

    $ctrl.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };

    $ctrl.dismissAlert = function () {
      $ctrl.warning = null;
    };

    $scope.$on('modal.closing', (event, reason, closed) => {
      console.log(`modal.closing: ${closed ? 'close' : 'dismiss'}(${reason})`);
      $ctrl.isClosed = true;
    });
  };
}());
