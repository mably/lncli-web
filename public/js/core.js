// public/core.js
var lnwebcli = angular.module("lnwebcli", ["ui.bootstrap", "LocalStorageModule", "ngclipboard"]);

lnwebcli.config(["localStorageServiceProvider", function (localStorageServiceProvider) {
	localStorageServiceProvider
		.setPrefix("lnwebcli")
		.setStorageType("localStorage")
		.setNotify(true, true);
}]);

lnwebcli.constant("config", {
	keys: {
		AUTO_REFRESH: "autorefresh"
	},
	defaults: {
		AUTO_REFRESH: 60000 // 1 minute
	}
});
