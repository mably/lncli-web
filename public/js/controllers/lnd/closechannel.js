(function closeChannel() {
  module.exports = function factory(
    $rootScope, $scope, $timeout, $uibModalInstance, channel, lncli, config,
  ) {
    const $ctrl = this;

    const listenersIds = [];

    $ctrl.spinner = 0;

    $ctrl.channel = channel;

    $ctrl.ok = () => {
      const channelPoint = $ctrl.channel.channel_point.split(':');
      const force = $ctrl.channel.forceclose;
      $ctrl.spinner += 1;
      lncli.closeChannel(channelPoint[0], channelPoint[1], force).then((closeChannelResponse) => {
        console.log('CloseChannel', closeChannelResponse);
        const requestId = closeChannelResponse.rid;
        // timer to not wait indefinitely for first websocket event
        const waitTimer = $timeout(() => {
          $ctrl.spinner -= 1;
          listenersIds.splice(listenersIds.indexOf(requestId), 1);
          lncli.unregisterWSRequestListener(requestId);
          $uibModalInstance.close($ctrl.values);
        }, 5000); // Wait 5 seconds maximmum for socket response
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
          $rootScope.$broadcast(config.events.CHANNEL_REFRESH, response);
          $timeout(() => {
            $uibModalInstance.close($ctrl.values);
          });
          return true;
        });
      }, (err) => {
        $ctrl.spinner -= 1;
        console.log('Error', err);
        const errmsg = err.message || err.statusText;
        if ($ctrl.isClosed) {
          lncli.alert(errmsg);
        } else {
          $ctrl.warning = errmsg;
        }
      });
    };

    $ctrl.cancel = () => {
      $uibModalInstance.dismiss('cancel');
    };

    $ctrl.dismissAlert = () => {
      $ctrl.warning = null;
    };

    const unregisterWSRequestListeners = () => {
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
