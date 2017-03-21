(function () {

	slacktipapp.controller("NavBarCtrl", ["$scope", "$timeout", "$uibModal", "slacktip", "config", controller]);

	function controller($scope, $timeout, $uibModal, slacktip, config) {

		var $ctrl = this;

		$scope.sendTip = function() {

			slacktip.getUser(true).then(function (response) {

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
								userid: response.data.identity.user.id,
								amount: 10
							};
						}
					}
				});

				modalInstance.rendered.then(function() {
					$("#sendtip-userid").focus();
				});

				modalInstance.result.then(function (values) {
					console.log("values", values);
				}, function () {
					console.log('Modal dismissed at: ' + new Date());
				});

			}, function (err) {
				console.log(err);
			});

		};
	}

})();
