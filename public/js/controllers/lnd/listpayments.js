(function () {

	lnwebcli.controller("ListPaymentsCtrl", ["$scope", "$timeout", "$uibModal", "lncli", "config", controller]);

	function controller($scope, $timeout, $uibModal, lncli, config) {

		$scope.spinner = 0;
		$scope.nextRefresh = null;

		$scope.refresh = function() {
			$scope.spinner++;
			$scope.updateNextRefresh();
			lncli.listPayments().then(function(response) {
				$scope.spinner--;
				console.log(response);
				$scope.data = JSON.stringify(response.data, null, "\t");
				$scope.payments = response.data.payments;
			}, function(err) {
				$scope.spinner--;
				console.log('Error:', err);
				lncli.alert(err.message || err.statusText);
			});
		}

		$scope.updateNextRefresh = function () {
			$timeout.cancel($scope.nextRefresh);
			$scope.nextRefresh = $timeout($scope.refresh,
				lncli.getConfigValue(config.keys.AUTO_REFRESH, config.defaults.AUTO_REFRESH));
		}

		$scope.add = function() {

			var modalInstance = $uibModal.open({
				animation: true,
				ariaLabelledBy: "sendpayment-modal-title",
				ariaDescribedBy: "sendpayment-modal-body",
				templateUrl: "templates/partials/sendpayment.html",
				controller: "ModalSendPaymentCtrl",
				controllerAs: "$ctrl",
				size: "lg",
				resolve: {
					defaults: function () {
						return {
							payreq: ""
						};
					}
				}
			});

			modalInstance.rendered.then(function() {
				$("#sendpayment-payreq").focus();
			});

			modalInstance.result.then(function (values) {
				console.log("values", values);
				$scope.refresh();
			}, function () {
				console.log('Modal dismissed at: ' + new Date());
			});

		};

		$scope.refresh();

	}

})();
