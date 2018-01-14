// app/lightning.js
const grpc = require("grpc");
const fs = require("fs");
const debug = require("debug")("lncliweb:lightning");

// expose the routes to our app with module.exports
module.exports = function (protoPath, lndHost, lndCertPath, macaroonPath) {

	process.env.GRPC_SSL_CIPHER_SUITES = "HIGH+ECDSA";

	const lnrpcDescriptor = grpc.load(protoPath);

	const lndCert = fs.readFileSync(lndCertPath);
	const sslCreds = grpc.credentials.createSsl(lndCert);

	var credentials;
	if (macaroonPath) {
		var macaroonCreds = grpc.credentials.createFromMetadataGenerator(function (args, callback) {
			const adminMacaroon = fs.readFileSync(macaroonPath);
			const metadata = new grpc.Metadata();
			metadata.add("macaroon", adminMacaroon.toString("hex"));
			callback(null, metadata);
		});
		credentials = grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds);
	} else {
		credentials = sslCreds;
	}

	return new lnrpcDescriptor.lnrpc.Lightning(lndHost, credentials);
};
