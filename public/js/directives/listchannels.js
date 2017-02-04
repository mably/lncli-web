lnwebcli.directive("listChannels", [function () {
	return {
		restrict: "E",
		replace: true,
		transclude: false,
		templateUrl: "templates/partials/listchannels.html",
	};
}]);
