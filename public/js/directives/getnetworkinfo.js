lnwebcli.directive("getNetworkInfo", [function () {
	return {
		restrict: "E",
		replace: true,
		transclude: false,
		templateUrl: "templates/partials/getnetworkinfo.html",
	};
}]);
