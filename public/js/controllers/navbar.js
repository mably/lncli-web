(function () {

	lnwebcli.controller("NavBarCtrl", ["$scope", "$timeout", "$uibModal", "lncli", "config", controller]);

	function controller($scope, $timeout, $uibModal, lncli, config) {

		var $ctrl = this;

		$scope.queryRoute = function() {

			var modalInstance = $uibModal.open({
				animation: true,
				ariaLabelledBy: "queryroute-modal-title",
				ariaDescribedBy: "queryroute-modal-body",
				templateUrl: "templates/partials/queryroute.html",
				controller: "ModalQueryRouteCtrl",
				controllerAs: "$ctrl",
				size: "lg",
				resolve: {
					defaults: {
						amount: 0
					}
				}
			});

			modalInstance.rendered.then(function() {
				$("#queryroute-pubkey").focus();
			});

			modalInstance.result.then(function (values) {
				console.log("values", values);
			}, function () {
				console.log('Modal dismissed at: ' + new Date());
			});

		};

		$scope.newAddress = function() {

			var modalInstance = $uibModal.open(config.modals.NEW_ADDRESS);

			modalInstance.rendered.then(function() {
				$("#newaddress-type").focus();
			});

			modalInstance.result.then(function (values) {
				console.log("values", values);
			}, function () {
				console.log('Modal dismissed at: ' + new Date());
			});

		};

		$scope.editSettings = function() {

			var modalInstance = $uibModal.open({
				animation: true,
				ariaLabelledBy: "editsettings-modal-title",
				ariaDescribedBy: "editsettings-modal-body",
				templateUrl: "templates/partials/editsettings.html",
				controller: "ModalEditSettingsCtrl",
				controllerAs: "$ctrl",
				size: "lg",
				resolve: {
					settings: function () {
						return lncli.getConfigValues()
					}
				}
			});

			modalInstance.rendered.then(function() {
				$("#editsettings-autorefresh").focus();
			});

			modalInstance.result.then(function (values) {
				console.log("values", values);
			}, function () {
				console.log('Modal dismissed at: ' + new Date());
			});

		};

	}

})();
