lnwebcli.directive("listPayments", [function () {
	return {
		restrict: "E",
		replace: true,
		transclude: false,
		templateUrl: "templates/partials/lnd/listpayments.html",
	};
}]);
