(function () {

	slacktipapp.controller("NavBarCtrl", ["$rootScope", "$scope", "$timeout", "$uibModal", "slacktip", "config", controller]);

	function controller($rootScope, $scope, $timeout, $uibModal, slacktip, config) {

		var $ctrl = this;

		$scope.user = null;

		$scope.refresh = function () {
		};

		$scope.logout = function () {
			slacktip.logout().then(function (response) {
				$rootScope.$broadcast(config.events.USER_REFRESH, response);
			}, function (err) {
				console.log(err);
				slacktip.alert(err);
			});
		};

		$scope.sendTip = function () {

			if ($scope.user.identity) {

				var modalInstance = $uibModal.open({
					animation: true,
					ariaLabelledBy: "sendtip-modal-title",
					ariaDescribedBy: "sendtip-modal-body",
					templateUrl: "templates/partials/slacktip/sendtip.html",
					controller: "ModalSendTipCtrl",
					controllerAs: "$ctrl",
					size: "lg",
					resolve: {
						defaults: function () {
							return {
								userid: $scope.user.identity.user.id,
								teamid: $scope.user.identity.team.id,
								amount: 10
							};
						}
					}
				});

				modalInstance.rendered.then(function () {
					$("#sendtip-userid").focus();
				});

				modalInstance.result.then(function (values) {
					console.log("values", values);
				}, function () {
					console.log("Modal dismissed at: " + new Date());
				});

			} else {

				var message = "You need to be authentified to use this service.";
				slacktip.alert(message);

			}

		};

		$scope.$on(config.events.USER_REFRESHED, function (event, args) {
			console.log("Received event USER_REFRESHED", event, args);
			$scope.user = args;
			$scope.refresh();
		});

	}

})();
