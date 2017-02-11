// app/sockets.js

// TODO
module.exports = function(io, lightning) {

	var clients = [];

	var subscribeInvoicesCall = null;

	var initSubscribeInvoicesCall = function() {

		if (!subscribeInvoicesCall) {

			console.log("Registering to lnd SubscribeInvoices stream");

			subscribeInvoicesCall = lightning.subscribeInvoices({});

			subscribeInvoicesCall.on("data", function(data) {
				console.log("SubscribeInvoices Data", data);
				for (var i = 0; i < clients.length; i++) {
					clients[i].emit("invoice", data);
				}
			});

			subscribeInvoicesCall.on("end", function() {
				console.log("SubscribeInvoices End");
			});

			subscribeInvoicesCall.on("error", function(err) {
				console.log("SubscribeInvoices Error", err);
			});

			subscribeInvoicesCall.on("status", function(status) {
				console.log("SubscribeInvoices Status", status);
			});
		}
	}

	io.on("connection", function(socket) {

		/** printing out the client who joined */
		console.log("New client connected (id=" + socket.id + ").");

		socket.emit("hello");

		socket.broadcast.emit("hello", { remoteAddress: socket.handshake.address });

		/** pushing new client to client array*/
		clients.push(socket);

		initSubscribeInvoicesCall();
		
		/** listening if client has disconnected */
		socket.on("disconnect", function() {
			clients.splice(clients.indexOf(socket), 1);
			console.log("client disconnected (id=" + socket.id + ").");
		});

	});

}
