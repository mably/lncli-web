(function () {

	lnwebcli.controller("ListInvoicesCtrl", ["$scope", "$uibModal", "lncli", controller]);

	function controller($scope, $uibModal, lncli) {

		$scope.refresh = function() {
			lncli.listInvoices().then(function(response) {
				console.log(response);
				$scope.data = JSON.stringify(response.data, null, "\t");
				$scope.invoices = response.data.invoices;
			}, function(err) {
				console.log('Error: ' + err);
			});
		}

		$scope.add = function() {

			var modalInstance = $uibModal.open({
				animation: true,
				ariaLabelledBy: "addinvoice-modal-title",
				ariaDescribedBy: "addinvoice-modal-body",
				templateUrl: "templates/partials/addinvoice.html",
				controller: "ModalAddInvoiceCtrl",
				controllerAs: "$ctrl",
				size: "lg",
				resolve: {
					defaults: function () {
						return {
							memo: "test",
							value: "1000"
						};
					}
				}
			});

			modalInstance.rendered.then(function() {
				$("#addinvoice-memo").focus();
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
