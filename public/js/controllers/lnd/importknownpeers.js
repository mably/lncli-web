(function importKnownPeers() {
  module.exports = function controller($uibModalInstance, defaults, lncli) {
    const $ctrl = this;

    $ctrl.values = defaults;

    $ctrl.ok = () => {
      try {
        const peersObj = JSON.parse($ctrl.values.peersjson);
        lncli.importKnownPeers(peersObj).then((response) => {
          console.log('ImportKnownPeers', response);
          $ctrl.warning = null;
          $uibModalInstance.close($ctrl.values);
          lncli.alert('Peers successfully imported!');
        }, (err) => {
          console.log(err);
          lncli.alert(err.message);
        });
      } catch (err) {
        $ctrl.warning = err.message;
      }
    };

    $ctrl.cancel = () => {
      $uibModalInstance.dismiss('cancel');
    };

    $ctrl.dismissAlert = () => {
      $ctrl.warning = null;
    };
  };
}());
