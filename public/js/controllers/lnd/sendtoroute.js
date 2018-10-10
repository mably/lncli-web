(function () {
  module.exports = function ($scope, $uibModalInstance, defaults, lncli) {
    const $ctrl = this;

    $ctrl.spinner = 0;

    $ctrl.values = defaults;

    $ctrl.ok = function () {
      $ctrl.spinner++;
      lncli.sendToRoute($ctrl.values.payhash, $ctrl.values.routes).then((response) => {
        $ctrl.spinner--;
        console.log('SendToRoute', response);
        if (response.data.error) {
          if ($ctrl.isClosed) {
            lncli.alert(response.data.error);
          } else {
            $ctrl.warning = response.data.error;
          }
        } else if (response.data.payment_error) {
          if ($ctrl.isClosed) {
            lncli.alert(response.data.payment_error);
          } else {
            $ctrl.warning = response.data.payment_error;
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
