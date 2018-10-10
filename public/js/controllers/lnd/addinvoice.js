(function () {
  module.exports = function ($scope, $uibModalInstance, defaults, lncli) {
    const $ctrl = this;

    $ctrl.spinner = 0;

    $ctrl.values = defaults;

    $ctrl.ok = function () {
      $ctrl.spinner++;
      lncli.addInvoice($ctrl.values.memo, $ctrl.values.value, $ctrl.values.expiry).then((response) => {
        $ctrl.spinner--;
        console.log('AddInvoice', response);
        if (response.data.error) {
          if ($ctrl.isClosed) {
            lncli.alert(response.data.error);
          } else {
            $ctrl.warning = response.data.error;
          }
        } else {
          $ctrl.warning = null;
          $uibModalInstance.close($ctrl.values);
        }
      }, (err) => {
        $ctrl.spinner--;
        console.log(err);
        const errmsg = err.message || err.statusText;
        if ($ctrl.isClosed) {
          lncli.alert(errmsg);
        } else {
          $ctrl.warning = errmsg;
        }
      });
    };

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
