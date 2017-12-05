// app/lightning.js
const grpc = require("grpc");
const fs = require("fs");

// expose the routes to our app with module.exports
module.exports = function (protoPath, lndHost, lndCertPath, macaroonPath) {

	process.env.GRPC_SSL_CIPHER_SUITES = "HIGH+ECDSA";

	const lnrpcDescriptor = grpc.load(protoPath);

	const lndCert = fs.readFileSync(lndCertPath);
	const credentials = grpc.credentials.createSsl(lndCert);

	if (macaroonPath) {
		const adminMacaroon = fs.readFileSync(macaroonPath);
		const meta = new grpc.Metadata();
		meta.add("macaroon", adminMacaroon.toString("hex"));
	}

	return new lnrpcDescriptor.lnrpc.Lightning(lndHost, credentials);

};
