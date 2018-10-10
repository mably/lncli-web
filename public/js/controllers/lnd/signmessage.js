(function () {
  module.exports = function ($uibModalInstance, defaults, lncli) {
    const $ctrl = this;

    $ctrl.spinner = 0;

    $ctrl.values = defaults;
    $ctrl.signature = null;

    $ctrl.ok = function () {
      $ctrl.spinner++;
      lncli.signMessage($ctrl.values.message).then((response) => {
        $ctrl.spinner--;
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
        $ctrl.spinner--;
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

    $ctrl.close = function () {
      $uibModalInstance.close($ctrl.values);
    };

    $ctrl.dismissWarning = function () {
      $ctrl.warning = null;
    };

    $ctrl.dismissSuccess = function () {
      $ctrl.success = null;
    };
  };
}());
