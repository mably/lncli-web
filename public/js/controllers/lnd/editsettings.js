(function editSettings() {
  module.exports = function controller($uibModalInstance, settings, lncli, config) {
    const $ctrl = this;

    $ctrl.values = settings;
    $ctrl.amountMainUnits = config.defaults.AMOUNT_UNITS;
    $ctrl.amountAltUnits = config.defaults.AMOUNT_UNITS;

    $ctrl.ok = () => {
      lncli.setConfigValues($ctrl.values).then((response) => {
        console.log('EditConfig', response);
        $ctrl.warning = null;
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
