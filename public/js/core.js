// public/core.js
var lnwebcli = angular.module("lnwebcli", ["ui.bootstrap", "LocalStorageModule", "ngclipboard", "ngSanitize", "ngToast"]);

lnwebcli.config(["localStorageServiceProvider", function (localStorageServiceProvider) {
	localStorageServiceProvider
		.setPrefix("lnwebcli")
		.setStorageType("localStorage")
		.setNotify(true, true);
}]);

lnwebcli.config(['ngToastProvider', function(ngToast) {
	ngToast.configure({
		// verticalPosition: 'bottom',
		// horizontalPosition: 'center'
		animation: 'fade'
	});
}]);

lnwebcli.constant("config", {
	keys: {
		AUTO_REFRESH: "autorefresh"
	},
	defaults: {
		AUTO_REFRESH: 60000 // 1 minute
	}
});
