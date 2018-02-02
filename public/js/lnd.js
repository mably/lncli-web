// public/js/lnd.js
var css = require("../css/lnd.css");

window.jQuery = require("jquery");
require("bootstrap");

const angular = require("angular");
require("angular-ui-bootstrap");
require("angular-local-storage");
require("ngclipboard");
require("angular-sanitize");
const bootbox = require("bootbox");
require("ng-toast");
require("angular-uuid");
window.webNotification = require("simple-web-notification"); // required by angular-web-notification
require("angular-web-notification");
require("angular-base64");
const qrcode = require("qrcode-generator");
window.qrcode = qrcode;
require("angular-qrcode");
require("angular-smart-table");

const lnwebcli = angular.module("lnwebcli", ["ui.bootstrap", "LocalStorageModule", "ngclipboard", "ngSanitize", "ngToast", "angular-uuid", "angular-web-notification", "base64", "monospaced.qrcode", "smart-table"]);

lnwebcli.value("jQuery", window.jQuery);
lnwebcli.value("bootbox", bootbox);

lnwebcli.config(["localStorageServiceProvider", function (localStorageServiceProvider) {
	localStorageServiceProvider
		.setPrefix("lnwebcli")
		.setStorageType("localStorage")
		.setNotify(true, true);
}]);

lnwebcli.config(["ngToastProvider", function (ngToast) {
	ngToast.configure({
		// verticalPosition: "bottom",
		// horizontalPosition: "center"
		animation: "fade"
	});
}]);

lnwebcli.constant("config", {
	keys: {
		AUTO_REFRESH: "autorefresh",
		MAX_LOG_BUFFER: "maxlogbuffer",
		MAX_NOTIF_BUFFER: "maxnotifbuffer",
		LISTCHANNELS_LISTVISIBLE: "listchannelslistvisible",
		LISTCHANNELS_PAGESIZE: "listchannelspagesize",
		LISTINVOICES_LISTVISIBLE: "listinvoiceslistvisible",
		LISTINVOICES_PAGESIZE: "listinvoicespagesize",
		LISTKNOWNPEERS_LISTVISIBLE: "listknownpeerslistvisible",
		LISTKNOWNPEERS_PAGESIZE: "listknownpeerspagesize",
		LISTPAYMENTS_LISTVISIBLE: "listpaymentslistvisible",
		LISTPAYMENTS_PAGESIZE: "listpaymentspagesize",
		LISTPEERS_LISTVISIBLE: "listpeerslistvisible",
		LISTPEERS_PAGESIZE: "listpeerspagesize",
		LISTPENDINGCHANNELS_LISTVISIBLE: "listpendingchannelslistvisible",
		LISTPENDINGCHANNELS_PAGESIZE: "listpendingchannelspagesize",
		LOG_FILTER_PATTERN: "logfilterpattern",
		LOG_NOTIFY_PATTERN: "lognotifypattern",
		INVOICE_EXPIRY: "invoiceexpiry",
		PAGE_SIZES: "pagesizes",
		EXPLORER_TX_BITCOIN_TESTNET: "explorertxbitcointestnet",
		EXPLORER_TX_BITCOIN_MAINNET: "explorertxbitcoinmainnet",
		EXPLORER_BLKHASH_BITCOIN_TESTNET: "explorerblkhashbitcointestnet",
		EXPLORER_BLKHASH_BITCOIN_MAINNET: "explorerblkhashbitcoinmainnet",
		EXPLORER_BLKHEIGHT_BITCOIN_TESTNET: "explorerblkheightbitcointestnet",
		EXPLORER_BLKHEIGHT_BITCOIN_MAINNET: "explorerblkheightbitcoinmainnet"
	},
	defaults: {
		AUTO_REFRESH: 60000, // 1 minute
		MAX_LOG_BUFFER: 500, // 500 lines of logs max
		MAX_NOTIF_BUFFER: 500, // 500 lines of notifications max
		LOG_FILTER_PATTERN: "\\[WRN\\]|\\[ERR\\]",
		LOG_NOTIFY_PATTERN: "\\[ERR\\]",
		INVOICE_EXPIRY: 3600,
		PAGE_SIZES: [10, 25, 50, 100],
		EXPLORER_TX_BITCOIN_TESTNET: "https://testnet.smartbit.com.au/tx/{0}",
		EXPLORER_TX_BITCOIN_MAINNET: "https://www.smartbit.com.au/tx/{0}",
		EXPLORER_BLKHASH_BITCOIN_TESTNET: "https://testnet.smartbit.com.au/block/{0}",
		EXPLORER_BLKHASH_BITCOIN_MAINNET: "https://www.smartbit.com.au/block/{0}",
		EXPLORER_BLKHEIGHT_BITCOIN_TESTNET: "https://testnet.smartbit.com.au/block/{0}",
		EXPLORER_BLKHEIGHT_BITCOIN_MAINNET: "https://www.smartbit.com.au/block/{0}"
	},
	notif: {
		SUCCESS: "SUCCESS",
		INFO: "INFO",
		WARNING: "WARNING"
	},
	events: {
		INVOICE_REFRESH: "invoice.refresh",
		PEER_REFRESH: "peer.refresh",
		CHANNEL_REFRESH: "channel.refresh",
		BALANCE_REFRESH: "balance.refresh",
		HELLO_WS: "hello",
		INVOICE_WS: "invoice",
		OPENCHANNEL_WS: "openchannel",
		CLOSECHANNEL_WS: "closechannel",
		LOG_WS: "log",
		LOGFILTER_WS: "logfilter",
	},
	modals: {
		NEW_ADDRESS: {
			animation: true,
			ariaLabelledBy: "newaddress-modal-title",
			ariaDescribedBy: "newaddress-modal-body",
			templateUrl: "templates/partials/lnd/newaddress.html",
			controller: "ModalNewAddressCtrl",
			controllerAs: "$ctrl",
			size: "lg",
			resolve: {
				defaults: {
					type: 1 // Nested
				}
			}
		},
		SEND_COINS: {
			animation: true,
			ariaLabelledBy: "sendcoins-modal-title",
			ariaDescribedBy: "sendcoins-modal-body",
			templateUrl: "templates/partials/lnd/sendcoins.html",
			controller: "ModalSendCoinsCtrl",
			controllerAs: "$ctrl",
			size: "lg",
			resolve: {
				defaults: {
					addr: "",
					amount: 0
				}
			}
		},
		SIGN_MESSAGE: {
			animation: true,
			ariaLabelledBy: "signmessage-modal-title",
			ariaDescribedBy: "signmessage-modal-body",
			templateUrl: "templates/partials/lnd/signmessage.html",
			controller: "ModalSignMessageCtrl",
			controllerAs: "$ctrl",
			size: "lg",
			resolve: {
				defaults: {
					message: "lnd rocks!"
				}
			}
		},
		VERIFY_MESSAGE: {
			animation: true,
			ariaLabelledBy: "verifymessage-modal-title",
			ariaDescribedBy: "verifymessage-modal-body",
			templateUrl: "templates/partials/lnd/verifymessage.html",
			controller: "ModalVerifyMessageCtrl",
			controllerAs: "$ctrl",
			size: "lg",
			resolve: {
				defaults: {
					message: "lnd rocks!"
				}
			}
		}
	}
});

require("./filters")(lnwebcli);
require("./factories")(lnwebcli);
require("./controllers/lnd")(lnwebcli);
require("./directives/lnd")(lnwebcli);
require("./services/lnd")(lnwebcli);
