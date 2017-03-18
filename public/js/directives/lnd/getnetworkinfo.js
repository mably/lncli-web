lnwebcli.directive("getNetworkInfo", [function () {
	return {
		restrict: "E",
		replace: true,
		transclude: false,
		templateUrl: "templates/partials/lnd/getnetworkinfo.html",
	};
}]);
