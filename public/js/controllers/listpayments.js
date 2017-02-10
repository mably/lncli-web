(function () {

	lnwebcli.controller("ListPaymentsCtrl", ["$scope", "$uibModal", "lncli", controller]);

	function controller($scope, $uibModal, lncli) {

		$scope.spinner = 0;

		$scope.refresh = function() {
			$scope.spinner++;
			lncli.listPayments().then(function(response) {
				$scope.spinner--;
				console.log(response);
				$scope.data = JSON.stringify(response.data, null, "\t");
				$scope.payments = response.data.payments;
			}, function(err) {
				$scope.spinner--;
				console.log('Error: ' + err);
			});
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
			}, function () {
				console.log('Modal dismissed at: ' + new Date());
			});

		};

		$scope.refresh();

	}

})();
