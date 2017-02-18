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
		AUTO_REFRESH: "autorefresh",
		MAX_LOG_BUFFER: "maxlogbuffer"
	},
	defaults: {
		AUTO_REFRESH: 60000, // 1 minute
		MAX_LOG_BUFFER: 500 // 500 lines of logs max
	},
	modals: {
		NEW_ADDRESS: {
			animation: true,
			ariaLabelledBy: "newaddress-modal-title",
			ariaDescribedBy: "newaddress-modal-body",
			templateUrl: "templates/partials/newaddress.html",
			controller: "ModalNewAddressCtrl",
			controllerAs: "$ctrl",
			size: "lg",
			resolve: {
				defaults: {
					type: 0 // Witness
				}
			}
		}
	}
});
