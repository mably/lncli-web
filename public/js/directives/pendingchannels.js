lnwebcli.directive("pendingChannels", [function () {
	return {
		restrict: "E",
		replace: true,
		transclude: false,
		templateUrl: "templates/partials/pendingchannels.html",
	};
}]);
