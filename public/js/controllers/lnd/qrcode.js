(function () {
  module.exports = function ($uibModalInstance, qrcode, lncli) {
    const $ctrl = this;

    $ctrl.qrcode = qrcode;

    $ctrl.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };

    $ctrl.dismissAlert = function () {
      $ctrl.warning = null;
    };
  };
}());
