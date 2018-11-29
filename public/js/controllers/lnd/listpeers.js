(function listPeers() {
  module.exports = function controller(
    $rootScope, $scope, $timeout, $uibModal, $, $q, bootbox, lncli, config,
  ) {
    // const $ctrl = this;

    $scope.spinner = 0;
    $scope.nextRefresh = null;
    $scope.lastRefreshed = null;
    $scope.numberOfPeers = 0;
    $scope.pageSizes = lncli.getConfigValue(config.keys.PAGE_SIZES, config.defaults.PAGE_SIZES);
    $scope.cfg = {};
    $scope.cfg.itemsPerPage = lncli.getConfigValue(
      config.keys.LISTPEERS_PAGESIZE, $scope.pageSizes[0],
    );
    $scope.cfg.listVisible = lncli.getConfigValue(
      config.keys.LISTPEERS_LISTVISIBLE, true,
    );
    $scope.form = {};
    $scope.form.checkbox = false;

    const processPeers = (peers) => {
      peers.forEach((peer) => {
        peer.sat_sent = parseInt(peer.sat_sent, 10);
        peer.sat_recv = parseInt(peer.sat_recv, 10);
        peer.bytes_sent = parseInt(peer.bytes_sent, 10);
        peer.bytes_recv = parseInt(peer.bytes_recv, 10);
        peer.ping_time = parseInt(peer.ping_time, 10);
      });
      return peers;
    };

    $scope.refresh = () => {
      if ($scope.cfg.listVisible) {
        $scope.lastRefreshed = Date.now();
        $scope.updateNextRefresh();
        $scope.spinner += 1;
        lncli.listPeers().then((response) => {
          $scope.spinner -= 1;
          console.log(response);
          $scope.data = JSON.stringify(response.data, null, '\t');
          $scope.peers = processPeers(response.data.peers);
          $scope.numberOfPeers = $scope.peers.length;
          $scope.form.checkbox = false;
        }, (err) => {
          $scope.spinner -= 1;
          $scope.numberOfPeers = 0;
          console.log('Error:', err);
          lncli.alert(err.message || err.statusText);
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
      const modalInstance = $uibModal.open({
        animation: true,
        ariaLabelledBy: 'addpeer-modal-title',
        ariaDescribedBy: 'addpeer-modal-body',
        templateUrl: 'templates/partials/lnd/addpeer.html',
        controller: 'ModalAddPeerCtrl',
        controllerAs: '$ctrl',
        size: 'lg',
        resolve: {
          defaults() {
            return {
              pubkey: '',
              host: '',
            };
          },
        },
      });

      modalInstance.rendered.then(() => {
        $('#addpeer-pubkey').focus();
      });

      modalInstance.result.then((values) => {
        console.log('values', values);
        $scope.refresh();
      }, () => {
        console.log(`Modal dismissed at: ${new Date()}`);
      });
    };

    $scope.disconnect = (peer) => {
      bootbox.confirm('Do you really want to disconnect from that peer?', (result) => {
        if (result) {
          $scope.spinner += 1;
          lncli.disconnectPeer(peer.pub_key).then((response) => {
            $scope.spinner -= 1;
            console.log('DisconnectPeer', response);
            if (response.data.error) {
              lncli.alert(response.data.error);
            } else {
              $rootScope.$broadcast(config.events.PEER_REFRESH, response);
            }
          }, (err) => {
            $scope.spinner -= 1;
            console.log(err);
            lncli.alert(err.message || err.statusText);
          });
        }
      });
    };

    const disconnectPeerBatch = () => {
      $scope.peers.forEach((peer) => {
        const promises = [];
        if (peer.selected) {
          promises.push(lncli.disconnectPeer(peer.pub_key));
        }
        if (promises.length > 0) {
          $scope.spinner += 1;
          $q.all(promises).then((responses) => {
            $scope.spinner -= 1;
            console.log('DisconnectPeerBatch', responses);
            const okResponses = [];
            responses.forEach((response) => {
              if (response.data.error) {
                lncli.alert(response.data.error);
              } else {
                okResponses.push(response);
              }
            });
            if (okResponses.length > 0) {
              $rootScope.$broadcast(config.events.PEER_REFRESH, okResponses);
            }
          }, (err) => {
            $scope.spinner -= 1;
            console.log(err);
            $scope.refresh();
            lncli.alert(err.message);
          });
        }
      });
    };

    const hasSelected = () => $scope.peers.some(peer => peer.selected);

    $scope.disconnectBatch = (confirm = true) => {
      if (hasSelected()) {
        if (confirm) {
          bootbox.confirm(
            'Do you really want to disconnect from those selected peers?',
            (result) => {
              if (result) {
                disconnectPeerBatch();
              }
            },
          );
        } else {
          disconnectPeerBatch();
        }
      } else {
        bootbox.alert('You need to select some peers first.');
      }
    };

    $scope.pubkeyCopied = (peer) => {
      peer.pubkeyCopied = true;
      $timeout(() => {
        peer.pubkeyCopied = false;
      }, 500);
    };

    $scope.addressCopied = (peer) => {
      peer.addressCopied = true;
      $timeout(() => {
        peer.addressCopied = false;
      }, 500);
    };

    $scope.showNodeInfo = (peer) => {
      const modalCfg = angular.copy(config.modals.NODE_INFO);
      modalCfg.resolve = {
        defaults: {
          pubkey: peer.pub_key,
          hidesearch: true,
        },
      };
      const modalInstance = $uibModal.open(modalCfg);

      modalInstance.rendered.then(() => {
        $('#getnodeinfo-pubkey').focus();
      });

      modalInstance.result.then((values) => {
        console.log('values', values);
      }, () => {
        console.log(`Modal dismissed at: ${new Date()}`);
      });
    };

    $scope.selectAll = (stPeers) => {
      stPeers.forEach((peer) => {
        peer.selected = $scope.form.checkbox;
      });
    };

    $scope.showQRCode = (data, size) => {
      const modalInstance = $uibModal.open({
        animation: true,
        ariaLabelledBy: 'qrcode-modal-title',
        ariaDescribedBy: 'qrcode-modal-body',
        templateUrl: 'templates/partials/lnd/qrcode.html',
        controller: 'ModalQRCodeCtrl',
        controllerAs: '$ctrl',
        size: 'lg',
        resolve: {
          qrcode() {
            return {
              data,
              size: (size) || 200,
            };
          },
        },
      });

      modalInstance.result.then((values) => {
        console.log('values', values);
      }, () => {
        console.log(`Modal dismissed at: ${new Date()}`);
      });
    };

    $scope.$on(config.events.PEER_REFRESH, (event, args) => {
      console.log('Received event PEER_REFRESH', event, args);
      $scope.refresh();
    });

    $scope.pageSizeChanged = () => {
      lncli.setConfigValue(config.keys.LISTPEERS_PAGESIZE, $scope.cfg.itemsPerPage);
    };

    $scope.toggle = () => {
      $scope.cfg.listVisible = !$scope.cfg.listVisible;
      lncli.setConfigValue(config.keys.LISTPEERS_LISTVISIBLE, $scope.cfg.listVisible);
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
