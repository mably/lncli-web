(function editKnownPeer() {
  module.exports = function controller($rootScope, $uibModalInstance, knownpeer, lncli, config) {
    const $ctrl = this;

    $ctrl.values = knownpeer;

    $ctrl.ok = () => {
      lncli.editKnownPeer($ctrl.values).then((response) => {
        console.log('EditKnownPeer', response);
        $ctrl.warning = null;
        $rootScope.$broadcast(config.events.PEER_REFRESH, response);
        $uibModalInstance.close($ctrl.values);
      }, (err) => {
        $ctrl.warning = err;
      });
    };

    $ctrl.cancel = () => {
      $uibModalInstance.dismiss('cancel');
    };

    $ctrl.dismissAlert = () => {
      $ctrl.warning = null;
    };
  };
}());
