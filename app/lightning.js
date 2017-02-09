// app/lightning.js
var grpc = require('grpc');

// expose the routes to our app with module.exports
module.exports = function(protoPath, lndHost) {

	var lnrpcDescriptor = grpc.load(protoPath);

	return new lnrpcDescriptor.lnrpc.Lightning(lndHost, grpc.credentials.createInsecure());

}
