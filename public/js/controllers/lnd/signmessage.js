(function signMessage() {
  module.exports = function controller($uibModalInstance, defaults, lncli) {
    const $ctrl = this;

    $ctrl.spinner = 0;

    $ctrl.values = defaults;
    $ctrl.signature = null;

    $ctrl.ok = () => {
      $ctrl.spinner += 1;
      lncli.signMessage($ctrl.values.message).then((response) => {
        $ctrl.spinner -= 1;
        console.log('SignMessage', response);
        if (response.data.error) {
          $ctrl.signature = null;
          if ($ctrl.isClosed) {
            lncli.alert(response.data.error);
          } else {
            $ctrl.warning = response.data.error;
          }
        } else {
          $ctrl.warning = null;
          $ctrl.signature = response.data.signature;
        }
      }, (err) => {
        $ctrl.spinner -= 1;
        console.log(err);
        $ctrl.signature = null;
        const errmsg = err.message || err.statusText;
        if ($ctrl.isClosed) {
          lncli.alert(errmsg);
        } else {
          $ctrl.warning = errmsg;
        }
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
