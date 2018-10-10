(function getInfo() {
  module.exports = function factory($scope, $timeout, $window, $uibModal, lncli, config) {
    $scope.spinner = 0;
    $scope.nextRefresh = null;

    $scope.refresh = () => {
      $scope.spinner += 1;
      $scope.updateNextRefresh();
      $scope.endpoint = lncli.getEndPoint();
      lncli.getInfo(false).then((response) => {
        $scope.spinner -= 1;
        console.log(response);
        $scope.data = JSON.stringify(response.data, null, '\t');
        $scope.info = response.data;
        if ($scope.info.uris && $scope.info.uris.length > 0) {
          [$scope.node_uri] = $scope.info.uris;
          $scope.node_address = $scope.node_uri.substr($scope.node_uri.indexOf('@') + 1);
        } else {
          delete $scope.node_uri;
          delete $scope.node_address;
        }
      }, (err) => {
        $scope.spinner -= 1;
        console.log('Error:', err);
        lncli.alert(err.message || err.statusText);
      });
    };

    $scope.updateNextRefresh = () => {
      $timeout.cancel($scope.nextRefresh);
      $scope.nextRefresh = $timeout($scope.refresh,
        lncli.getConfigValue(config.keys.AUTO_REFRESH, config.defaults.AUTO_REFRESH));
    };

    $scope.pubkeyCopied = (info) => {
      info.pubkeyCopied = true;
      $timeout(() => {
        info.pubkeyCopied = false;
      }, 500);
    };

    $scope.nodeuriCopied = (info) => {
      info.nodeuriCopied = true;
      $timeout(() => {
        info.nodeuriCopied = false;
      }, 500);
    };

    $scope.blockhashCopied = (info) => {
      info.blockhashCopied = true;
      $timeout(() => {
        info.blockhashCopied = false;
      }, 500);
    };

    $scope.openBlockInExplorerByHash = (blockHash) => {
      if (blockHash) {
        $window.open(lncli.getBlockByHashURL(blockHash), '_blank');
      }
    };

    $scope.openBlockInExplorerByHeight = (blockHeight) => {
      if (blockHeight) {
        $window.open(lncli.getBlockByHeightURL(blockHeight), '_blank');
      }
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
              size: (size) || 300,
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

    $scope.refresh();
  };
}());
