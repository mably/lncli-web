module.exports = function (lnwebcli) {

	lnwebcli.directive("channelBalance", [require("./channelbalance")]);
	lnwebcli.directive("forwardingHistory", [require("./forwardinghistory")]);
	lnwebcli.directive("getInfo", [require("./getinfo")]);
	lnwebcli.directive("getNetworkInfo", [require("./getnetworkinfo")]);
	lnwebcli.directive("listChannels", [require("./listchannels")]);
	lnwebcli.directive("listInvoices", [require("./listinvoices")]);
	lnwebcli.directive("listKnownPeers", [require("./listknownpeers")]);
	lnwebcli.directive("listPayments", [require("./listpayments")]);
	lnwebcli.directive("listPeers", [require("./listpeers")]);
	lnwebcli.directive("pendingChannels", [require("./pendingchannels")]);
	lnwebcli.directive("togglePanel", [require("./togglepanel")]);
	lnwebcli.directive("walletBalance", [require("./walletbalance")]);

};
