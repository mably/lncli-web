lnwebcli.directive("listInvoices", [function () {
	return {
		restrict: "E",
		replace: true,
		transclude: false,
		templateUrl: "templates/partials/listinvoices.html",
	};
}]);
