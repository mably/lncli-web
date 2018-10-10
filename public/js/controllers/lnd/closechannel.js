(function () {
  module.exports = function ($rootScope, $scope, $timeout, $uibModalInstance, channel, lncli, config) {
    const $ctrl = this;

    const listenersIds = [];

    $ctrl.spinner = 0;

    $ctrl.channel = channel;

    $ctrl.ok = function () {
      const channelPoint = $ctrl.channel.channel_point.split(':');
      const force = $ctrl.channel.forceclose;
      $ctrl.spinner++;
      lncli.closeChannel(channelPoint[0], channelPoint[1], force).then((response) => {
        console.log('CloseChannel', response);
        const requestId = response.rid;
        // timer to not wait indefinitely for first websocket event
        const waitTimer = $timeout(() => {
          $ctrl.spinner--;
          listenersIds.splice(listenersIds.indexOf(requestId), 1);
          lncli.unregisterWSRequestListener(requestId);
          $uibModalInstance.close($ctrl.values);
        }, 5000); // Wait 5 seconds maximmum for socket response
        listenersIds.push(requestId);
        // We wait for first websocket event to check for errors
        lncli.registerWSRequestListener(requestId, (response) => {
          $ctrl.spinner--;
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
          $rootScope.$broadcast(config.events.CHANNEL_REFRESH, response);
          $timeout(() => {
            $uibModalInstance.close($ctrl.values);
          });
          return true;
        });
      }, (err) => {
        $ctrl.spinner--;
        console.log('Error', err);
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

    const unregisterWSRequestListeners = function () {
      for (let i = 0; i < listenersIds.length; i++) {
        lncli.unregisterWSRequestListener(listenersIds[i]);
      }
      listenersIds.length = 0;
    };

    $scope.$on('modal.closing', (event, reason, closed) => {
      console.log(`modal.closing: ${closed ? 'close' : 'dismiss'}(${reason})`);
      $ctrl.isClosed = true;
      $ctrl.warning = null;
      unregisterWSRequestListeners();
    });
  };
}());
