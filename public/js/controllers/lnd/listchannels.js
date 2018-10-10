(function () {
  module.exports = function ($rootScope, $scope, $timeout, $window, $uibModal, $, $q, bootbox, lncli, config) {
    $scope.spinner = 0;
    $scope.nextRefresh = null;
    $scope.lastRefreshed = null;
    $scope.numberOfChannels = 0;
    $scope.pageSizes = lncli.getConfigValue(config.keys.PAGE_SIZES, config.defaults.PAGE_SIZES);
    $scope.cfg = {};
    $scope.cfg.itemsPerPage = lncli.getConfigValue(config.keys.LISTCHANNELS_PAGESIZE, $scope.pageSizes[0]);
    $scope.cfg.listVisible = lncli.getConfigValue(config.keys.LISTCHANNELS_LISTVISIBLE, true);
    $scope.form = {};
    $scope.form.checkbox = false;

    $scope.refresh = function () {
      if ($scope.cfg.listVisible) {
        lncli.getKnownPeers(true).then((knownPeers) => {
          $scope.knownPeers = knownPeers;
          $scope.lastRefreshed = Date.now();
          $scope.updateNextRefresh();
          $scope.spinner++;
          lncli.listChannels().then((response) => {
            $scope.spinner--;
            console.log(response);
            $scope.data = JSON.stringify(response.data, null, '\t');
            $scope.channels = processChannels(response.data.channels);
            $scope.numberOfChannels = $scope.channels.length;
            $scope.form.checkbox = false;
          }, (err) => {
            $scope.spinner--;
            $scope.numberOfChannels = 0;
            console.log('Error:', err);
            lncli.alert(err.message || err.statusText);
          });
        });
      }
    };

    var processChannels = function (channels) {
      channels.forEach((channel) => {
        channel.capacity = parseInt(channel.capacity);
        channel.local_balance = parseInt(channel.local_balance);
        channel.remote_balance = parseInt(channel.remote_balance);
        channel.total_satoshis_sent = parseInt(channel.total_satoshis_sent);
        channel.total_satoshis_received = parseInt(channel.total_satoshis_received);
        channel.num_updates = parseInt(channel.num_updates);
      });
      return channels;
    };

    const getRefreshPeriod = function () {
      return lncli.getConfigValue(config.keys.AUTO_REFRESH, config.defaults.AUTO_REFRESH);
    };

    $scope.updateNextRefresh = function () {
      $timeout.cancel($scope.nextRefresh);
      $scope.nextRefresh = $timeout($scope.refresh, getRefreshPeriod());
    };

    $scope.add = function () {
      lncli.listPeers(true).then((peersResponse) => {
        if (peersResponse && peersResponse.data && peersResponse.data.peers && peersResponse.data.peers.length > 0) {
          const modalInstance = $uibModal.open({
            animation: true,
            ariaLabelledBy: 'openchannel-modal-title',
            ariaDescribedBy: 'openchannel-modal-body',
            templateUrl: 'templates/partials/lnd/openchannel.html',
            controller: 'ModalOpenChannelCtrl',
            controllerAs: '$ctrl',
            size: 'lg',
            resolve: {
              defaults() {
                return {
                  peers: peersResponse.data.peers,
                  pubkey: peersResponse.data.peers[0].pub_key,
                  localamt: 50000,
                  pushamt: 5000,
                };
              },
            },
          });

          modalInstance.rendered.then(() => {
            $('#openchannel-pubkey').focus();
          });

          modalInstance.result.then((values) => {
            console.log('values', values);
          }, () => {
            console.log(`Modal dismissed at: ${new Date()}`);
          });
        } else {
          lncli.alert('You cannot open a channel, you are not connected to any peers!');
        }
      });
    };

    $scope.close = function (channel) {
      const modalInstance = $uibModal.open({
        animation: true,
        ariaLabelledBy: 'closechannel-modal-title',
        ariaDescribedBy: 'closechannel-modal-body',
        templateUrl: 'templates/partials/lnd/closechannel.html',
        controller: 'ModalCloseChannelCtrl',
        controllerAs: '$ctrl',
        size: 'lg',
        resolve: {
          channel: angular.copy(channel),
        },
      });

      modalInstance.rendered.then(() => {
        $('#closechannel-force').focus();
      });

      modalInstance.result.then((values) => {
        console.log('values', values);
      }, () => {
        console.log(`Modal dismissed at: ${new Date()}`);
      });
    };

    const closeChannelBatch = function () {
      const promises = [];
      $scope.spinner++;
      $scope.channels.forEach((channel) => {
        if (channel.selected) {
          const deferred = $q.defer();
          promises.push(deferred.promise);
          const channelPoint = channel.channel_point.split(':');
          lncli.closeChannel(channelPoint[0], channelPoint[1], false).then((response) => {
            console.log('CloseChannelBatch', response);
            const requestId = response.rid;
            // timer to not wait indefinitely for first websocket event
            const waitTimer = $timeout(() => {
              lncli.unregisterWSRequestListener(requestId);
              deferred.resolve({ error: 'no response' });
            }, 5000); // Wait 5 seconds maximmum for socket response
            // We wait for first websocket event to check for errors
            lncli.registerWSRequestListener(requestId, (response) => {
              $timeout.cancel(waitTimer);
              lncli.unregisterWSRequestListener(requestId);
              if (response.evt === 'error') {
                deferred.resolve({ error: response.data.error });
                lncli.alert(response.data.error);
              } else {
                deferred.resolve(response);
              }
            });
          }, (err) => {
            console.log(err);
            deferred.resolve({ error: err.message });
            lncli.alert(err.message);
          });
        }
      });
      if (promises.length > 0) {
        $q.all(promises).then((responses) => {
          console.log('All promises - ok', responses);
          $scope.spinner--;
          $rootScope.$broadcast(config.events.CHANNEL_REFRESH, responses);
        }, (err) => {
          console.log('All promises - error', err);
          $scope.spinner--;
          $rootScope.$broadcast(config.events.CHANNEL_REFRESH, responses);
        });
      } else {
        console.log('No promises');
        $scope.spinner--;
      }
    };

    $scope.closeBatch = function (confirm = true) {
      if (hasSelected()) {
        if (confirm) {
          bootbox.confirm('Do you really want to cooperatively close those selected channels?', (result) => {
            if (result) {
              closeChannelBatch();
            }
          });
        } else {
          closeChannelBatch();
        }
      } else {
        bootbox.alert('You need to select some channels first.');
      }
    };

    $scope.dismissWarning = function () {
      $scope.warning = null;
    };

    $scope.channelPeerAlias = function (channel) {
      const knownPeer = $scope.knownPeers[channel.remote_pubkey];
      return knownPeer ? knownPeer.custom_alias : null;
    };

    $scope.pubkeyCopied = function (channel) {
      channel.pubkeyCopied = true;
      $timeout(() => {
        channel.pubkeyCopied = false;
      }, 500);
    };

    $scope.chanpointCopied = function (channel) {
      channel.chanpointCopied = true;
      $timeout(() => {
        channel.chanpointCopied = false;
      }, 500);
    };

    $scope.openChannelPointInExplorer = function (channel) {
      if (channel.channel_point) {
        const txId = channel.channel_point.split(':')[0];
        $window.open(lncli.getTransactionURL(txId), '_blank');
      }
    };

    $scope.$on(config.events.CHANNEL_REFRESH, (event, args) => {
      console.log('Received event CHANNEL_REFRESH', event, args);
      $scope.refresh();
    });

    $scope.pageSizeChanged = function () {
      lncli.setConfigValue(config.keys.LISTCHANNELS_PAGESIZE, $scope.cfg.itemsPerPage);
    };

    var hasSelected = function () {
      return $scope.channels.some(channel => channel.selected);
    };

    $scope.selectAll = function (stChannels) {
      stChannels.forEach((channel) => {
        channel.selected = $scope.form.checkbox;
      });
    };

    $scope.toggle = function () {
      $scope.cfg.listVisible = !$scope.cfg.listVisible;
      lncli.setConfigValue(config.keys.LISTCHANNELS_LISTVISIBLE, $scope.cfg.listVisible);
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
