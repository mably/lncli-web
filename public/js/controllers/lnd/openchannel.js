(function openChannel() {
  module.exports = function controller($scope, $timeout, $uibModalInstance, defaults, lncli) {
    const $ctrl = this;

    const listenersIds = [];

    $ctrl.spinner = 0;

    $ctrl.values = defaults;

    const checkform = () => {
      $ctrl.warning = null;
      if (!$ctrl.values.pubkey) {
        $ctrl.warning = 'Remote node pubkey is required.';
        return false;
      }
      if (!$ctrl.values.localamt || $ctrl.values.localamt <= 0) {
        $ctrl.warning = 'A non-zero local amount is required.';
        return false;
      }
      return true;
    };

    const unregisterWSRequestListeners = () => {
      for (let i = 0; i < listenersIds.length; i += 1) {
        lncli.unregisterWSRequestListener(listenersIds[i]);
      }
      listenersIds.length = 0;
    };

    $ctrl.ok = () => {
      if (checkform()) {
        $ctrl.spinner += 1;
        lncli.openChannel(
          $ctrl.values.pubkey, $ctrl.values.localamt, $ctrl.values.pushamt, $ctrl.values.satperbyte,
          $ctrl.values.targetconf, $ctrl.values.remotecsvdelay, $ctrl.values.privatechan,
        ).then((openChannelResponse) => {
          console.log('OpenChannel', openChannelResponse);
          const requestId = openChannelResponse.rid;
          // timer to not wait indefinitely for first websocket event
          const waitTimer = $timeout(() => {
            $ctrl.spinner -= 1;
            listenersIds.splice(listenersIds.indexOf(requestId), 1);
            lncli.unregisterWSRequestListener(requestId);
            $uibModalInstance.close($ctrl.values);
          }, 15000); // Wait 5 seconds maximmum for socket response
          listenersIds.push(requestId);
          // We wait for first websocket event to check for errors
          lncli.registerWSRequestListener(requestId, (response) => {
            $ctrl.spinner -= 1;
            $timeout.cancel(waitTimer);
            listenersIds.splice(listenersIds.indexOf(requestId), 1);
            lncli.unregisterWSRequestListener(requestId);
            if ($ctrl.isClosed) {
              return true;
            }
            if (response.evt === 'error') {
              $ctrl.warning = response.data.error;
              return false;
            }
            $timeout(() => {
              $uibModalInstance.close($ctrl.values);
            });
            return true;
          });
        }, (err) => {
          $ctrl.spinner -= 1;
          console.log(err);
          const errmsg = err.message || err.statusText;
          if ($ctrl.isClosed) {
            lncli.alert(errmsg);
          } else {
            $ctrl.warning = errmsg;
          }
        });
      }
    };

    $ctrl.cancel = () => {
      $uibModalInstance.dismiss('cancel');
    };

    $ctrl.dismissAlert = () => {
      $ctrl.warning = null;
    };

    $scope.$on('modal.closing', (event, reason, closed) => {
      console.log(`modal.closing: ${closed ? 'close' : 'dismiss'}(${reason})`);
      $ctrl.isClosed = true;
      $ctrl.warning = null;
      unregisterWSRequestListeners();
    });
  };
}());
