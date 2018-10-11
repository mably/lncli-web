(function navBar() {
  module.exports = function controller($scope, $timeout, $uibModal, $, lncli, config) {
    // const $ctrl = this;

    $scope.getNodeInfo = () => {
      const modalInstance = $uibModal.open({
        animation: true,
        ariaLabelledBy: 'getnodeinfo-modal-title',
        ariaDescribedBy: 'getnodeinfo-modal-body',
        templateUrl: 'templates/partials/lnd/getnodeinfo.html',
        controller: 'ModalGetNodeInfoCtrl',
        controllerAs: '$ctrl',
        size: 'lg',
        resolve: {
          defaults: {
          },
        },
      });

      modalInstance.rendered.then(() => {
        $('#getnodeinfo-pubkey').focus();
      });

      modalInstance.result.then((values) => {
        console.log('values', values);
      }, () => {
        console.log(`Modal dismissed at: ${new Date()}`);
      });
    };

    $scope.queryRoute = () => {
      const modalInstance = $uibModal.open({
        animation: true,
        ariaLabelledBy: 'queryroute-modal-title',
        ariaDescribedBy: 'queryroute-modal-body',
        templateUrl: 'templates/partials/lnd/queryroute.html',
        controller: 'ModalQueryRouteCtrl',
        controllerAs: '$ctrl',
        size: 'lg',
        resolve: {
          defaults: {
            amount: 0,
          },
        },
      });

      modalInstance.rendered.then(() => {
        $('#queryroute-pubkey').focus();
      });

      modalInstance.result.then((values) => {
        console.log('values', values);
      }, () => {
        console.log(`Modal dismissed at: ${new Date()}`);
      });
    };

    $scope.sendToRoute = () => {
      const modalInstance = $uibModal.open(config.modals.SEND_TO_ROUTE);

      modalInstance.rendered.then(() => {
        $('#sendtoroute-payhash').focus();
      });

      modalInstance.result.then((values) => {
        console.log('values', values);
      }, () => {
        console.log(`Modal dismissed at: ${new Date()}`);
      });
    };

    $scope.newAddress = () => {
      const modalInstance = $uibModal.open(config.modals.NEW_ADDRESS);

      modalInstance.rendered.then(() => {
        $('#newaddress-type').focus();
      });

      modalInstance.result.then((values) => {
        console.log('values', values);
      }, () => {
        console.log(`Modal dismissed at: ${new Date()}`);
      });
    };

    $scope.sendCoins = () => {
      const modalInstance = $uibModal.open(config.modals.SEND_COINS);

      modalInstance.rendered.then(() => {
        $('#sendcoins-addr').focus();
      });

      modalInstance.result.then((values) => {
        console.log('values', values);
      }, () => {
        console.log(`Modal dismissed at: ${new Date()}`);
      });
    };

    $scope.renderGraph = () => {
      lncli.renderGraph().then(() => {
        window.open(`${lncli.getEndPoint()}/api/lnd/networkgraph.svg`, '_blank');
      }, (err) => {
        console.log(err);
        lncli.alert(err.data || err.statusText);
      });
    };

    $scope.signMessage = () => {
      const modalInstance = $uibModal.open(config.modals.SIGN_MESSAGE);

      modalInstance.rendered.then(() => {
        $('#signmessage-message').focus();
      });

      modalInstance.result.then((values) => {
        console.log('values', values);
      }, () => {
        console.log(`Modal dismissed at: ${new Date()}`);
      });
    };

    $scope.verifyMessage = () => {
      const modalInstance = $uibModal.open(config.modals.VERIFY_MESSAGE);

      modalInstance.rendered.then(() => {
        $('#verifymessage-message').focus();
      });

      modalInstance.result.then((values) => {
        console.log('values', values);
      }, () => {
        console.log(`Modal dismissed at: ${new Date()}`);
      });
    };

    $scope.editSettings = () => {
      const modalInstance = $uibModal.open({
        animation: true,
        ariaLabelledBy: 'editsettings-modal-title',
        ariaDescribedBy: 'editsettings-modal-body',
        templateUrl: 'templates/partials/lnd/editsettings.html',
        controller: 'ModalEditSettingsCtrl',
        controllerAs: '$ctrl',
        size: 'lg',
        resolve: {
          settings() {
            return lncli.getConfigValues();
          },
        },
      });

      modalInstance.rendered.then(() => {
        $('#editsettings-autorefresh').focus();
      });

      modalInstance.result.then((values) => {
        console.log('values', values);
      }, () => {
        console.log(`Modal dismissed at: ${new Date()}`);
      });
    };
  };
}());
