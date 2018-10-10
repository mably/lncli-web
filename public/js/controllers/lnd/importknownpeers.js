(function () {
  module.exports = function factory($uibModalInstance, defaults, lncli) {
    const $ctrl = this;

    $ctrl.values = defaults;

    $ctrl.ok = function () {
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

    $ctrl.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };

    $ctrl.dismissAlert = function () {
      $ctrl.warning = null;
    };
  };
}());
