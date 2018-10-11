(function addPeer() {
  module.exports = function controller(
    $rootScope, $scope, $uibModalInstance, defaults, lncli, config,
  ) {
    const $ctrl = this;

    $ctrl.spinner = 0;

    $ctrl.values = defaults;

    $ctrl.ok = () => {
      $ctrl.spinner += 1;
      lncli.connectPeer($ctrl.values.pubkey, $ctrl.values.host).then((response) => {
        $ctrl.spinner -= 1;
        console.log('AddPeer', response);
        if (response.data.error) {
          if ($ctrl.isClosed) {
            lncli.alert(response.data.error);
          } else {
            $ctrl.warning = response.data.error;
          }
        } else {
          $ctrl.warning = null;
          $rootScope.$broadcast(config.events.PEER_REFRESH, response);
          $uibModalInstance.close($ctrl.values);
        }
      }, (err) => {
        $ctrl.spinner -= 1;
        console.log(err);
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
