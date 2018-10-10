(function () {
  module.exports = function factory($rootScope, $scope, $timeout, $uibModal, $, $q, bootbox, lncli, config) {
    const $ctrl = this;

    $scope.spinner = 0;
    $scope.numberOfPeers = 0;
    $scope.pageSizes = lncli.getConfigValue(config.keys.PAGE_SIZES, config.defaults.PAGE_SIZES);
    $scope.cfg = {};
    $scope.cfg.itemsPerPage = lncli.getConfigValue(config.keys.LISTKNOWNPEERS_PAGESIZE, $scope.pageSizes[0]);
    $scope.cfg.listVisible = lncli.getConfigValue(config.keys.LISTKNOWNPEERS_LISTVISIBLE, true);
    $scope.form = {};
    $scope.form.checkbox = false;

    $scope.refresh = function () {
      $scope.spinner += 1;
      lncli.listKnownPeers().then((response) => {
        $scope.spinner -= 1;
        console.log(response);
        $scope.data = JSON.stringify(response, null, '\t');
        $scope.peers = response;
        $scope.numberOfPeers = $scope.peers.length;
        $scope.form.checkbox = false;
      }, (err) => {
        $scope.spinner -= 1;
        $scope.numberOfPeers = 0;
        console.log('Error:', err);
        lncli.alert(err.message || err.statusText);
      });
    };

    $scope.connect = function (peer) {
      $scope.spinner += 1;
      lncli.connectPeer(peer.pub_key, peer.address).then((response) => {
        $scope.spinner -= 1;
        console.log('ConnectKnownPeer', response);
        if (response.data.error) {
          lncli.alert(response.data.error);
        } else {
          $timeout(() => {
            $rootScope.$broadcast(config.events.PEER_REFRESH, response);
          }, 500);
        }
      }, (err) => {
        $scope.spinner -= 1;
        console.log(err);
        lncli.alert(err.message || err.statusText);
      });
    };

    $scope.connectBatch = function () {
      if (hasSelected()) {
        bootbox.confirm('Do you really want to connect to those selected peers?', (result) => {
          if (result) {
            $scope.peers.forEach((peer) => {
              if (peer.selected) {
                $scope.connect(peer);
              }
            });
          }
        });
      } else {
        bootbox.alert('You need to select some peers first.');
      }
    };

    $scope.edit = function (peer) {
      const modalInstance = $uibModal.open({
        animation: true,
        ariaLabelledBy: 'editknownpeer-modal-title',
        ariaDescribedBy: 'editknownpeer-modal-body',
        templateUrl: 'templates/partials/lnd/editknownpeer.html',
        controller: 'ModalEditKnownPeerCtrl',
        controllerAs: '$ctrl',
        size: 'lg',
        resolve: {
          knownpeer() {
            const peerTemp = {};
            angular.copy(peer, peerTemp);
            return peerTemp;
          },
        },
      });

      modalInstance.rendered.then(() => {
        $('#editknownpeer-alias').focus();
      });

      modalInstance.result.then((values) => {
        console.log('EditKnownPeer updated values', values);
        $scope.refresh();
      }, () => {
        console.log(`Modal EditKnownPeer dismissed at: ${new Date()}`);
      });
    };

    const removePeer = function (peer) {
      lncli.removeKnownPeer(peer.pub_key).then((response) => {
        console.log('RemoveKnownPeer removed=', response);
        $scope.refresh();
      }, (err) => {
        console.log(err);
        lncli.alert(err.message);
      });
    };

    $scope.remove = function (peer, confirm = true) {
      if (confirm) {
        bootbox.confirm('Do you really want to remove that peer?', (result) => {
          if (result) {
            removePeer(peer);
          }
        });
      } else {
        removePeer(peer);
      }
    };

    const removePeerBatch = function () {
      $scope.peers.forEach((peer) => {
        const promises = [];
        if (peer.selected) {
          promises.push(lncli.removeKnownPeer(peer.pub_key));
        }
        if (promises.length > 0) {
          $q.all(promises).then((response) => {
            console.log('RemoveKnownPeer batch removed=', response);
            $scope.refresh();
          }, (err) => {
            console.log(err);
            $scope.refresh();
            lncli.alert(err.message);
          });
        }
      });
    };

    $scope.removeBatch = function (confirm = true) {
      if (hasSelected()) {
        if (confirm) {
          bootbox.confirm('Do you really want to remove those selected peers?', (result) => {
            if (result) {
              removePeerBatch();
            }
          });
        } else {
          removePeerBatch();
        }
      } else {
        bootbox.alert('You need to select some peers first.');
      }
    };

    $scope.import = function () {
      const modalInstance = $uibModal.open({
        animation: true,
        ariaLabelledBy: 'importknownpeers-modal-title',
        ariaDescribedBy: 'importknownpeers-modal-body',
        templateUrl: 'templates/partials/lnd/importknownpeers.html',
        controller: 'ModalImportKnownPeersCtrl',
        controllerAs: '$ctrl',
        size: 'lg',
        resolve: {
          defaults: {
            peersjson: angular.toJson($scope.peers, 4),
          },
        },
      });

      modalInstance.rendered.then(() => {
        $('#importknownpeers-peersjson').focus();
      });

      modalInstance.result.then((values) => {
        console.log('ImportKnownPeers updated values', values);
        $scope.refresh();
      }, () => {
        console.log(`Modal ImportKnownPeers dismissed at: ${new Date()}`);
      });
    };

    $scope.pubkeyCopied = function (peer) {
      peer.pubkeyCopied = true;
      $timeout(() => {
        peer.pubkeyCopied = false;
      }, 500);
    };

    $scope.addressCopied = function (peer) {
      peer.addressCopied = true;
      $timeout(() => {
        peer.addressCopied = false;
      }, 500);
    };

    $scope.showNodeInfo = function (peer) {
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

    $scope.$on(config.events.PEER_REFRESH, (event, args) => {
      console.log('Received event PEER_REFRESH', event, args);
      $scope.refresh();
    });

    $scope.pageSizeChanged = function () {
      lncli.setConfigValue(config.keys.LISTKNOWNPEERS_PAGESIZE, $scope.cfg.itemsPerPage);
    };

    var hasSelected = function () {
      return $scope.peers.some(peer => peer.selected);
    };

    $scope.selectAll = function (stPeers) {
      stPeers.forEach((peer) => {
        peer.selected = $scope.form.checkbox;
      });
    };

    $scope.toggle = function () {
      $scope.cfg.listVisible = !$scope.cfg.listVisible;
      lncli.setConfigValue(config.keys.LISTKNOWNPEERS_LISTVISIBLE, $scope.cfg.listVisible);
    };

    $scope.refresh();
  };
}());
