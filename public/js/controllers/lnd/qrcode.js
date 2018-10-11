(function qrCode() {
  module.exports = function controller($uibModalInstance, qrcode) {
    const $ctrl = this;

    $ctrl.qrcode = qrcode;

    $ctrl.cancel = () => {
      $uibModalInstance.dismiss('cancel');
    };

    $ctrl.dismissAlert = () => {
      $ctrl.warning = null;
    };
  };
}());
