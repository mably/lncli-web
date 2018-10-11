(function newAddress() {
  module.exports = function controller($uibModalInstance, defaults, lncli) {
    const $ctrl = this;

    $ctrl.values = defaults;
    $ctrl.addressTypes = [
      { name: 'NESTED_PUBKEY_HASH', id: 1 },
      { name: 'WITNESS_PUBKEY_HASH', id: 0 },
      // { name: "PUBKEY_HASH", id: 2 },
    ];

    $ctrl.ok = () => {
      lncli.newAddress($ctrl.values.type).then((response) => {
        console.log('NewAddress', response);
        $ctrl.warning = null;
        $ctrl.success = JSON.stringify(response.data, null, '\t');
        const address = angular.copy(response.data);
        address.created = Math.floor(Date.now() / 1000);
        address.type = $ctrl.values.type;
        lncli.addAddress(address.address, address);
      }, (err) => {
        $ctrl.warning = err;
        $ctrl.success = null;
      });
    };

    $ctrl.close = () => {
      $uibModalInstance.close($ctrl.values);
    };

    $ctrl.dismissWarning = () => {
      $ctrl.warning = null;
    };

    $ctrl.dismissSuccess = () => {
      $ctrl.success = null;
    };
  };
}());
