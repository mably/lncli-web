lnwebcli.directive("channelBalance", [function () {
	return {
		restrict: "E",
		replace: true,
		transclude: false,
		templateUrl: "templates/partials/channelbalance.html",
	};
}]);
