(function pendingChannels() {
  module.exports = function controller($scope, $timeout, $window, lncli, config) {
    $scope.spinner = 0;
    $scope.nextRefresh = null;
    $scope.lastRefreshed = null;
    $scope.numberOfOpeningChannels = 0;
    $scope.numberOfClosingChannels = 0;
    $scope.numberOfForceClosingChannels = 0;
    $scope.numberOfWaitingCloseChannels = 0;
    $scope.pageSizes = lncli.getConfigValue(config.keys.PAGE_SIZES, config.defaults.PAGE_SIZES);
    $scope.cfg = {};
    $scope.cfg.itemsPerPage = lncli.getConfigValue(
      config.keys.LISTPENDINGCHANNELS_PAGESIZE, $scope.pageSizes[0],
    );
    $scope.cfg.listVisible = lncli.getConfigValue(
      config.keys.LISTPENDINGCHANNELS_LISTVISIBLE, true,
    );

    const processPendingOpenChannels = (channels) => {
      channels.forEach((pendingChannel) => {
        pendingChannel.channel.capacity = parseInt(pendingChannel.channel.capacity, 10);
        pendingChannel.channel.local_balance = parseInt(pendingChannel.channel.local_balance, 10);
        pendingChannel.channel.remote_balance = parseInt(pendingChannel.channel.remote_balance, 10);
      });
      return channels;
    };

    const processPendingClosingChannels = (channels) => {
      channels.forEach((pendingChannel) => {
        pendingChannel.channel.capacity = parseInt(pendingChannel.channel.capacity, 10);
        pendingChannel.channel.local_balance = parseInt(pendingChannel.channel.local_balance, 10);
        pendingChannel.channel.remote_balance = parseInt(pendingChannel.channel.remote_balance, 10);
      });
      return channels;
    };

    const processPendingForceClosingChannels = (channels) => {
      channels.forEach((pendingChannel) => {
        pendingChannel.channel.capacity = parseInt(pendingChannel.channel.capacity, 10);
        pendingChannel.channel.local_balance = parseInt(pendingChannel.channel.local_balance, 10);
        pendingChannel.channel.remote_balance = parseInt(pendingChannel.channel.remote_balance, 10);
        pendingChannel.limbo_balance = parseInt(pendingChannel.limbo_balance, 10);
        pendingChannel.maturity_height = parseInt(pendingChannel.maturity_height, 10);
        pendingChannel.blocks_til_maturity = parseInt(pendingChannel.blocks_til_maturity, 10);
      });
      return channels;
    };

    const processWaitingCloseChannels = (channels) => {
      channels.forEach((pendingChannel) => {
        pendingChannel.channel.capacity = parseInt(pendingChannel.channel.capacity, 10);
        pendingChannel.channel.local_balance = parseInt(pendingChannel.channel.local_balance, 10);
        pendingChannel.channel.remote_balance = parseInt(pendingChannel.channel.remote_balance, 10);
      });
      return channels;
    };

    const getRefreshPeriod = () => lncli.getConfigValue(
      config.keys.AUTO_REFRESH, config.defaults.AUTO_REFRESH,
    );

    $scope.refresh = () => {
      if ($scope.cfg.listVisible) {
        lncli.getKnownPeers(true).then((knownPeers) => {
          $scope.knownPeers = knownPeers;
          $scope.lastRefreshed = Date.now();
          $scope.updateNextRefresh();
          $scope.spinner += 1;
          lncli.pendingChannels().then((response) => {
            $scope.spinner -= 1;
            console.log(response);
            $scope.data = JSON.stringify(response.data, null, '\t');
            $scope.pending_open_channels = processPendingOpenChannels(
              response.data.pending_open_channels,
            );
            $scope.numberOfOpeningChannels = $scope.pending_open_channels.length;
            $scope.pending_closing_channels = processPendingClosingChannels(
              response.data.pending_closing_channels,
            );
            $scope.numberOfClosingChannels = $scope.pending_closing_channels.length;
            $scope.pending_force_closing_channels = processPendingForceClosingChannels(
              response.data.pending_force_closing_channels,
            );
            $scope.numberOfForceClosingChannels = $scope.pending_force_closing_channels.length;
            $scope.waiting_close_channels = processWaitingCloseChannels(
              response.data.waiting_close_channels,
            );
            $scope.numberOfWaitingCloseChannels = $scope.waiting_close_channels.length;
          }, (err) => {
            $scope.spinner -= 1;
            $scope.numberOfOpeningChannels = 0;
            $scope.numberOfClosingChannels = 0;
            $scope.numberOfForceClosingChannels = 0;
            $scope.numberOfWaitingCloseChannels = 0;
            console.log('Error:', err);
            lncli.alert(err.message || err.statusText);
          });
        });
      }
    };

    $scope.updateNextRefresh = () => {
      $timeout.cancel($scope.nextRefresh);
      $scope.nextRefresh = $timeout($scope.refresh, getRefreshPeriod());
    };

    $scope.channelPeerAlias = (pendingChannel) => {
      const knownPeer = $scope.knownPeers[pendingChannel.channel.remote_node_pub];
      return knownPeer ? knownPeer.custom_alias : null;
    };

    $scope.pubkeyCopied = (channel) => {
      channel.pubkeyCopied = true;
      $timeout(() => {
        channel.pubkeyCopied = false;
      }, 500);
    };

    $scope.chanpointCopied = (channel) => {
      channel.chanpointCopied = true;
      $timeout(() => {
        channel.chanpointCopied = false;
      }, 500);
    };

    $scope.openChannelPointInExplorer = (channel) => {
      if (channel.channel_point) {
        const txId = channel.channel_point.split(':')[0];
        $window.open(lncli.getTransactionURL(txId), '_blank');
      }
    };

    $scope.closingTxCopied = (channel) => {
      channel.closingTxCopied = true;
      $timeout(() => {
        channel.closingTxCopied = false;
      }, 500);
    };

    $scope.openClosingTxInExplorer = (closingTxId) => {
      if (closingTxId) {
        $window.open(lncli.getTransactionURL(closingTxId), '_blank');
      }
    };

    $scope.$on(config.events.CHANNEL_REFRESH, (event, args) => {
      console.log('Received event CHANNEL_REFRESH', event, args);
      $scope.refresh();
    });

    $scope.pageSizeChanged = () => {
      lncli.setConfigValue(config.keys.LISTPENDINGCHANNELS_PAGESIZE, $scope.cfg.itemsPerPage);
    };

    $scope.toggle = () => {
      $scope.cfg.listVisible = !$scope.cfg.listVisible;
      lncli.setConfigValue(config.keys.LISTPENDINGCHANNELS_LISTVISIBLE, $scope.cfg.listVisible);
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
