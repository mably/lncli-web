(function () {
	"use strict";

	module.exports = function ($scope, $timeout, $uibModal, $, lncli, config) {

		var $ctrl = this;

		$scope.getNodeInfo = function () {

			var modalInstance = $uibModal.open({
				animation: true,
				ariaLabelledBy: "getnodeinfo-modal-title",
				ariaDescribedBy: "getnodeinfo-modal-body",
				templateUrl: "templates/partials/lnd/getnodeinfo.html",
				controller: "ModalGetNodeInfoCtrl",
				controllerAs: "$ctrl",
				size: "lg",
				resolve: {
					defaults: {
					}
				}
			});

			modalInstance.rendered.then(function () {
				$("#getnodeinfo-pubkey").focus();
			});

			modalInstance.result.then(function (values) {
				console.log("values", values);
			}, function () {
				console.log("Modal dismissed at: " + new Date());
			});

		};

		$scope.queryRoute = function () {

			var modalInstance = $uibModal.open({
				animation: true,
				ariaLabelledBy: "queryroute-modal-title",
				ariaDescribedBy: "queryroute-modal-body",
				templateUrl: "templates/partials/lnd/queryroute.html",
				controller: "ModalQueryRouteCtrl",
				controllerAs: "$ctrl",
				size: "lg",
				resolve: {
					defaults: {
						amount: 0
					}
				}
			});

			modalInstance.rendered.then(function () {
				$("#queryroute-pubkey").focus();
			});

			modalInstance.result.then(function (values) {
				console.log("values", values);
			}, function () {
				console.log("Modal dismissed at: " + new Date());
			});

		};

		$scope.sendToRoute = function () {

			var modalInstance = $uibModal.open(config.modals.SEND_TO_ROUTE);

			modalInstance.rendered.then(function () {
				$("#sendtoroute-payhash").focus();
			});

			modalInstance.result.then(function (values) {
				console.log("values", values);
			}, function () {
				console.log("Modal dismissed at: " + new Date());
			});

		};

		$scope.newAddress = function () {

			var modalInstance = $uibModal.open(config.modals.NEW_ADDRESS);

			modalInstance.rendered.then(function () {
				$("#newaddress-type").focus();
			});

			modalInstance.result.then(function (values) {
				console.log("values", values);
			}, function () {
				console.log("Modal dismissed at: " + new Date());
			});

		};

		$scope.sendCoins = function () {

			var modalInstance = $uibModal.open(config.modals.SEND_COINS);

			modalInstance.rendered.then(function () {
				$("#sendcoins-addr").focus();
			});

			modalInstance.result.then(function (values) {
				console.log("values", values);
			}, function () {
				console.log("Modal dismissed at: " + new Date());
			});

		};

		$scope.renderGraph = function () {

			lncli.renderGraph().then(function (response) {
				window.open(lncli.getEndPoint() + "/api/lnd/networkgraph.svg", "_blank");
			}, function (err) {
				console.log(err);
				lncli.alert(err.data || err.statusText);
			});

		};

		$scope.signMessage = function () {

			var modalInstance = $uibModal.open(config.modals.SIGN_MESSAGE);

			modalInstance.rendered.then(function () {
				$("#signmessage-message").focus();
			});

			modalInstance.result.then(function (values) {
				console.log("values", values);
			}, function () {
				console.log("Modal dismissed at: " + new Date());
			});

		};

		$scope.verifyMessage = function () {

			var modalInstance = $uibModal.open(config.modals.VERIFY_MESSAGE);

			modalInstance.rendered.then(function () {
				$("#verifymessage-message").focus();
			});

			modalInstance.result.then(function (values) {
				console.log("values", values);
			}, function () {
				console.log("Modal dismissed at: " + new Date());
			});

		};

		$scope.editSettings = function () {

			var modalInstance = $uibModal.open({
				animation: true,
				ariaLabelledBy: "editsettings-modal-title",
				ariaDescribedBy: "editsettings-modal-body",
				templateUrl: "templates/partials/lnd/editsettings.html",
				controller: "ModalEditSettingsCtrl",
				controllerAs: "$ctrl",
				size: "lg",
				resolve: {
					settings: function () {
						return lncli.getConfigValues();
					}
				}
			});

			modalInstance.rendered.then(function () {
				$("#editsettings-autorefresh").focus();
			});

			modalInstance.result.then(function (values) {
				console.log("values", values);
			}, function () {
				console.log("Modal dismissed at: " + new Date());
			});

		};

	};

})();
