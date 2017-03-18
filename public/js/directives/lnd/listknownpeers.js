lnwebcli.directive("listKnownPeers", [function () {
	return {
		restrict: "E",
		replace: true,
		transclude: false,
		templateUrl: "templates/partials/lnd/listknownpeers.html",
	};
}]);
