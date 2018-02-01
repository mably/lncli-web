// app/lightning.js
const grpc = require("grpc");
const fs = require("fs");
const logger = require("winston");
const debug = require("debug")("lncliweb:lightning");

// expose the routes to our app with module.exports
module.exports = function (protoPath, lndHost, lndCertPath, macaroonPath) {

	process.env.GRPC_SSL_CIPHER_SUITES = "HIGH+ECDSA";

	const lnrpcDescriptor = grpc.load(protoPath);

	if (lndCertPath) {

		if (fs.existsSync(lndCertPath)) {

			const lndCert = fs.readFileSync(lndCertPath);
			const sslCreds = grpc.credentials.createSsl(lndCert);

			var credentials;
			if (macaroonPath) {
				if (fs.existsSync(macaroonPath)) {
					var macaroonCreds = grpc.credentials.createFromMetadataGenerator(function (args, callback) {
						const adminMacaroon = fs.readFileSync(macaroonPath);
						const metadata = new grpc.Metadata();
						metadata.add("macaroon", adminMacaroon.toString("hex"));
						callback(null, metadata);
					});
					credentials = grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds);
				} else {
					logger.error("The specified macaroon file \"" + macaroonPath + "\" was not found.\n"
							+ "Please add the missing lnd macaroon file or update/remove the path in the application configuration.");
					process.exit(1);
				}
			} else {
				credentials = sslCreds;
			}

			return new lnrpcDescriptor.lnrpc.Lightning(lndHost, credentials);

		} else {

			logger.error("The specified lnd certificate file \"" + lndCertPath + "\" was not found.\n"
					+ "Please add the missing lnd certificate file or update the path in the application configuration.");
			process.exit(1);

		}

	} else {

		logger.error("Required lnd certificate path missing from application configuration.");
		process.exit(1);

	}
};
