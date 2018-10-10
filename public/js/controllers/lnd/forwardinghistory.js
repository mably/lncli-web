(function forwardHistory() {
  module.exports = function factory($scope, $timeout, $uibModal, $, lncli, config) {
    $scope.spinner = 0;
    $scope.nextRefresh = null;
    $scope.lastRefreshed = null;
    $scope.numberOfForwards = 0;
    $scope.pageSizes = lncli.getConfigValue(config.keys.PAGE_SIZES, config.defaults.PAGE_SIZES);
    $scope.cfg = {};
    $scope.cfg.itemsPerPage = lncli.getConfigValue(
      config.keys.FORWARDINGHISTORY_PAGESIZE, $scope.pageSizes[0],
    );
    $scope.cfg.listVisible = lncli.getConfigValue(
      config.keys.FORWARDINGHISTORY_LISTVISIBLE, true,
    );

    const processChannels = (channels) => {
      const processedChannels = {};
      channels.forEach((channel) => {
        processedChannels[channel.chan_id] = channel.remote_pubkey;
      });
      return processedChannels;
    };

    const processForwards = (forwards) => {
      forwards.forEach((forward) => {
        forward.amt_in = parseInt(forward.amt_in, 10);
        forward.amt_out = parseInt(forward.amt_out, 10);
        forward.fee = parseInt(forward.fee, 10);
      });
      return forwards;
    };

    const getRefreshPeriod = () => lncli.getConfigValue(
      config.keys.AUTO_REFRESH, config.defaults.AUTO_REFRESH,
    );

    $scope.refresh = () => {
      if ($scope.cfg.listVisible) {
        lncli.getKnownPeers(true).then((knownPeers) => {
          $scope.knownPeers = knownPeers;
          lncli.listChannels(true).then((listChannelsResponse) => {
            $scope.data = JSON.stringify(listChannelsResponse.data, null, '\t');
            $scope.channels = processChannels(listChannelsResponse.data.channels);

            $scope.lastRefreshed = Date.now();
            $scope.updateNextRefresh();
            $scope.spinner += 1;
            lncli.forwardingHistory().then((response) => {
              $scope.spinner -= 1;
              console.log(response);
              $scope.data = JSON.stringify(response.data, null, '\t');
              $scope.forwards = processForwards(response.data.forwarding_events);
              $scope.numberOfForwards = $scope.forwards.length;
            }, (err) => {
              $scope.spinner -= 1;
              $scope.numberOfForwards = 0;
              console.log('Error:', err);
              lncli.alert(err.message || err.statusText);
            });
          });
        });
      }
    };

    $scope.updateNextRefresh = () => {
      $timeout.cancel($scope.nextRefresh);
      $scope.nextRefresh = $timeout($scope.refresh, getRefreshPeriod());
    };

    $scope.channelPeerAlias = (chanid) => {
      let alias;
      const pubkey = $scope.channels[chanid];
      if (pubkey) {
        const knownPeer = $scope.knownPeers[pubkey];
        alias = knownPeer ? knownPeer.custom_alias : null;
      } else {
        alias = null;
      }
      return alias;
    };

    $scope.pageSizeChanged = () => {
      lncli.setConfigValue(config.keys.FORWARDINGHISTORY_PAGESIZE, $scope.cfg.itemsPerPage);
    };

    $scope.toggle = () => {
      $scope.cfg.listVisible = !$scope.cfg.listVisible;
      lncli.setConfigValue(config.keys.FORWARDINGHISTORY_LISTVISIBLE, $scope.cfg.listVisible);
      if ($scope.cfg.listVisible) {
        // Refresh if not been refreshed for more than refresh period
        if (Date.now() - $scope.lastRefreshed > getRefreshPeriod()) {
          $scope.refresh();
        }
      }
    };

    $scope.refresh();
  };
}());
