slacktipapp.directive("getUser", [function () {
	return {
		restrict: "E",
		replace: true,
		transclude: false,
		templateUrl: "templates/partials/slacktip/getuser.html",
	};
}]);
