(function listChannels() {
  module.exports = function controller(
    $rootScope, $scope, $timeout, $window, $uibModal, $, $q, bootbox, lncli, config,
  ) {
    $scope.spinner = 0;
    $scope.nextRefresh = null;
    $scope.lastRefreshed = null;
    $scope.numberOfChannels = 0;
    $scope.pageSizes = lncli.getConfigValue(config.keys.PAGE_SIZES, config.defaults.PAGE_SIZES);
    $scope.cfg = {};
    $scope.cfg.itemsPerPage = lncli.getConfigValue(
      config.keys.LISTCHANNELS_PAGESIZE, $scope.pageSizes[0],
    );
    $scope.cfg.listVisible = lncli.getConfigValue(config.keys.LISTCHANNELS_LISTVISIBLE, true);
    $scope.form = {};
    $scope.form.checkbox = false;

    const processChannels = (channels) => {
      channels.forEach((channel) => {
        channel.capacity = parseInt(channel.capacity, 10);
        channel.local_balance = parseInt(channel.local_balance, 10);
        channel.remote_balance = parseInt(channel.remote_balance, 10);
        channel.total_satoshis_sent = parseInt(channel.total_satoshis_sent, 10);
        channel.total_satoshis_received = parseInt(channel.total_satoshis_received, 10);
        channel.num_updates = parseInt(channel.num_updates, 10);
      });
      return channels;
    };

    $scope.refresh = () => {
      if ($scope.cfg.listVisible) {
        lncli.getKnownPeers(true).then((knownPeers) => {
          $scope.knownPeers = knownPeers;
          $scope.lastRefreshed = Date.now();
          $scope.updateNextRefresh();
          $scope.spinner += 1;
          lncli.listChannels().then((response) => {
            $scope.spinner -= 1;
            console.log(response);
            $scope.data = JSON.stringify(response.data, null, '\t');
            $scope.channels = processChannels(response.data.channels);
            $scope.numberOfChannels = $scope.channels.length;
            $scope.form.checkbox = false;
          }, (err) => {
            $scope.spinner -= 1;
            $scope.numberOfChannels = 0;
            console.log('Error:', err);
            lncli.alert(err.message || err.statusText);
          });
        });
      }
    };

    const getRefreshPeriod = () => lncli.getConfigValue(
      config.keys.AUTO_REFRESH, config.defaults.AUTO_REFRESH,
    );

    $scope.updateNextRefresh = () => {
      $timeout.cancel($scope.nextRefresh);
      $scope.nextRefresh = $timeout($scope.refresh, getRefreshPeriod());
    };

    $scope.add = () => {
      lncli.listPeers(true).then((peersResponse) => {
        if (peersResponse
          && peersResponse.data
          && peersResponse.data.peers
          && peersResponse.data.peers.length > 0) {
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

    $scope.close = (channel) => {
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

    const closeChannelBatch = () => {
      const promises = [];
      $scope.spinner += 1;
      $scope.channels.forEach((channel) => {
        if (channel.selected) {
          const deferred = $q.defer();
          promises.push(deferred.promise);
          const channelPoint = channel.channel_point.split(':');
          lncli.closeChannel(channelPoint[0], channelPoint[1], false).then((closeChanResponse) => {
            console.log('CloseChannelBatch', closeChanResponse);
            const requestId = closeChanResponse.rid;
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
          $scope.spinner -= 1;
          $rootScope.$broadcast(config.events.CHANNEL_REFRESH, responses);
        }, (err) => {
          console.log('All promises - error', err);
          $scope.spinner -= 1;
          $rootScope.$broadcast(config.events.CHANNEL_REFRESH, err);
        });
      } else {
        console.log('No promises');
        $scope.spinner -= 1;
      }
    };

    const hasSelected = () => $scope.channels.some(channel => channel.selected);

    $scope.closeBatch = (confirm = true) => {
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

    $scope.dismissWarning = () => {
      $scope.warning = null;
    };

    $scope.channelPeerAlias = (channel) => {
      const knownPeer = $scope.knownPeers[channel.remote_pubkey];
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

    $scope.$on(config.events.CHANNEL_REFRESH, (event, args) => {
      console.log('Received event CHANNEL_REFRESH', event, args);
      $scope.refresh();
    });

    $scope.pageSizeChanged = () => {
      lncli.setConfigValue(config.keys.LISTCHANNELS_PAGESIZE, $scope.cfg.itemsPerPage);
    };

    $scope.selectAll = (stChannels) => {
      stChannels.forEach((channel) => {
        channel.selected = $scope.form.checkbox;
      });
    };

    $scope.toggle = () => {
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
