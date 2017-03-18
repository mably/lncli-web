lnwebcli.directive("listPeers", [function () {
	return {
		restrict: "E",
		replace: true,
		transclude: false,
		templateUrl: "templates/partials/listpeers.html",
	};
}]);
