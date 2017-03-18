lnwebcli.directive("listKnownPeers", [function () {
	return {
		restrict: "E",
		replace: true,
		transclude: false,
		templateUrl: "templates/partials/listknownpeers.html",
	};
}]);
