module.exports = function (lnwebcli) {

	lnwebcli.controller("ModalAddInvoiceCtrl", ["$scope", "$uibModalInstance", "defaults", "lncli", require("./addinvoice")]);
	lnwebcli.controller("ModalAddPeerCtrl", ["$rootScope", "$scope", "$uibModalInstance", "defaults", "lncli", "config", require("./addpeer")]);
	lnwebcli.controller("ChannelBalanceCtrl", ["$scope", "$timeout", "lncli", "config", require("./channelbalance")]);
	lnwebcli.controller("ModalCloseChannelCtrl", ["$rootScope", "$scope", "$timeout", "$uibModalInstance", "channel", "lncli", "config", require("./closechannel")]);
	lnwebcli.controller("ModalEditKnownPeerCtrl", ["$rootScope", "$uibModalInstance", "knownpeer", "lncli", "config", require("./editknownpeer")]);
	lnwebcli.controller("ModalEditSettingsCtrl", ["$uibModalInstance", "settings", "lncli", require("./editsettings")]);
	lnwebcli.controller("ModalQRCodeCtrl", ["$uibModalInstance", "qrcode", "lncli", require("./qrcode")]);
	lnwebcli.controller("ForwardingHistoryCtrl", ["$scope", "$timeout", "$uibModal", "jQuery", "lncli", "config", require("./forwardinghistory")]);
	lnwebcli.controller("GetInfoCtrl", ["$scope", "$timeout", "$window", "$uibModal", "lncli", "config", require("./getinfo")]);
	lnwebcli.controller("GetNetworkInfoCtrl", ["$scope", "$timeout", "lncli", "config", require("./getnetworkinfo")]);
	lnwebcli.controller("ListChannelsCtrl", ["$rootScope", "$scope", "$timeout", "$window", "$uibModal", "jQuery", "$q", "bootbox", "lncli", "config", require("./listchannels")]);
	lnwebcli.controller("ListInvoicesCtrl", ["$scope", "$timeout", "$uibModal", "jQuery", "lncli", "config", require("./listinvoices")]);
	lnwebcli.controller("ListKnownPeersCtrl", ["$rootScope", "$scope", "$timeout", "$uibModal", "jQuery", "$q", "bootbox", "lncli", "config", require("./listknownpeers")]);
	lnwebcli.controller("ListPaymentsCtrl", ["$scope", "$timeout", "$uibModal", "jQuery", "lncli", "config", require("./listpayments")]);
	lnwebcli.controller("ListPeersCtrl", ["$rootScope", "$scope", "$timeout", "$uibModal", "jQuery", "$q", "bootbox", "lncli", "config", require("./listpeers")]);
	lnwebcli.controller("NavBarCtrl", ["$scope", "$timeout", "$uibModal", "jQuery", "lncli", "config", require("./navbar")]);
	lnwebcli.controller("ModalGetNodeInfoCtrl", ["$scope", "$uibModalInstance", "defaults", "lncli", require("./getnodeinfo")]);
	lnwebcli.controller("ModalImportKnownPeersCtrl", ["$uibModalInstance", "defaults", "lncli", require("./importknownpeers")]);
	lnwebcli.controller("ModalNewAddressCtrl", ["$uibModalInstance", "defaults", "lncli", require("./newaddress")]);
	lnwebcli.controller("ModalOpenChannelCtrl", ["$scope", "$timeout", "$uibModalInstance", "defaults", "lncli", require("./openchannel")]);
	lnwebcli.controller("ModalQueryRouteCtrl", ["$scope", "$uibModalInstance", "defaults", "lncli", require("./queryroute")]);
	lnwebcli.controller("ModalSendCoinsCtrl", ["$scope", "$uibModalInstance", "defaults", "lncli", require("./sendcoins")]);
	lnwebcli.controller("ModalSendPaymentCtrl", ["$scope", "$uibModalInstance", "defaults", "lncli", require("./sendpayment")]);
	lnwebcli.controller("ModalSignMessageCtrl", ["$uibModalInstance", "defaults", "lncli", require("./signmessage")]);
	lnwebcli.controller("ModalVerifyMessageCtrl", ["$uibModalInstance", "defaults", "lncli", require("./verifymessage")]);
	lnwebcli.controller("PendingChannelsCtrl", ["$scope", "$timeout", "$window", "lncli", "config", require("./pendingchannels")]);
	lnwebcli.controller("WalletBalanceCtrl", ["$scope", "$timeout", "$uibModal", "jQuery", "lncli", "config", require("./walletbalance")]);

};
