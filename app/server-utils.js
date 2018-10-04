// app/utils.js

const debug = require("debug")("lncliweb:utils");
const defaults = require("../config/defaults");
const logger = require("winston");
const LightningManager = require('./lightning')

// TODO
module.exports = function (server) {

	var module = {};

        server.makeLightningManager = function(program) {
            var lndHost = program.lndhost || defaults.lndHost;
            var lndCertPath = program.lndCertPath || defaults.lndCertPath;

            // If `disableMacaroon` is set, ignore macaroon support for the session. Otherwise
            // we read from `macarooonPath` variable and alternatively fallback to default `macaroonPath`.
            var macaroonPath = null;
            if (program.disableMacaroon) {
                console.log("Macaroon support is disabled")
            } else {
                macaroonPath = program.macaroonPath || defaults.macaroonPath;
                console.log("Macaroon support is enabled. Macaroon path is " + macaroonPath);
            }

            return new LightningManager(defaults.lndProto, lndHost, lndCertPath, macaroonPath);
        }

	server.getURL = function () {
		return "http" + (this.useTLS ? "s" : "") + "://" + this.serverHost
			+ (this.useTLS
				? ((this.httpsPort === "443") ? "" : ":" + this.httpsPort)
				: ((this.serverPort === "80") ? "" : ":" + this.serverPort));
	};

	return module;
};
