lnwebcli.directive("walletBalance", [function () {
	return {
		restrict: "E",
		replace: true,
		transclude: false,
		templateUrl: "templates/partials/lnd/walletbalance.html",
	};
}]);
