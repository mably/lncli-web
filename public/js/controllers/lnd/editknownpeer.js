(function () {
  module.exports = function ($rootScope, $uibModalInstance, knownpeer, lncli, config) {
    const $ctrl = this;

    $ctrl.values = knownpeer;

    $ctrl.ok = function () {
      lncli.editKnownPeer($ctrl.values).then((response) => {
        console.log('EditKnownPeer', response);
        $ctrl.warning = null;
        $rootScope.$broadcast(config.events.PEER_REFRESH, response);
        $uibModalInstance.close($ctrl.values);
      }, (err) => {
        $ctrl.warning = err;
      });
    };

    $ctrl.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };

    $ctrl.dismissAlert = function () {
      $ctrl.warning = null;
    };
  };
}());
