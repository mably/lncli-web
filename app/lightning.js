// app/lightning.js
const grpc = require("grpc");
const fs = require("fs");

// expose the routes to our app with module.exports
module.exports = function (protoPath, lndHost, lndCertPath) {

	process.env.GRPC_SSL_CIPHER_SUITES = "HIGH+ECDSA";

	var lnrpcDescriptor = grpc.load(protoPath);

	var lndCert = fs.readFileSync(lndCertPath);
	var credentials = grpc.credentials.createSsl(lndCert);

	return new lnrpcDescriptor.lnrpc.Lightning(lndHost, credentials);

};
