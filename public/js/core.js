// public/core.js
var lnwebcli = angular.module("lnwebcli", ["ui.bootstrap", "LocalStorageModule"]);

lnwebcli.config(["localStorageServiceProvider", function (localStorageServiceProvider) {
	localStorageServiceProvider
		.setPrefix("lnwebcli")
		.setStorageType("localStorage")
		.setNotify(true, true);
}]);
