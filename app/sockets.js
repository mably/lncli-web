// app/sockets.js

const debug = require('debug')('lncliweb:sockets')
const logger = require('winston')

// TODO
module.exports = function(io, lightning, login, pass, limitlogin, limitpass) {

	var clients = [];

	var authRequired = (login && pass) || (limitlogin && limitpass);

	var userToken = null;
	var limitUserToken = null;
	if (login && pass) {
		userToken = new Buffer(login + ":" + pass).toString('base64');
	}
	if (limitlogin && limitpass) {
		limitUserToken = new Buffer(limitlogin + ":" + limitpass).toString('base64');
	}

	var subscribeInvoicesCall = null;

	var initSubscribeInvoicesCall = function() {

		if (!subscribeInvoicesCall) {

			logger.debug("Registering to lnd SubscribeInvoices stream");

			subscribeInvoicesCall = lightning.subscribeInvoices({});

			subscribeInvoicesCall.on("data", function(data) {
				logger.debug("SubscribeInvoices Data", data);
				for (var i = 0; i < clients.length; i++) {
					clients[i].emit("invoice", data);
				}
			});

			subscribeInvoicesCall.on("end", function() {
				logger.debug("SubscribeInvoices End");
			});

			subscribeInvoicesCall.on("error", function(err) {
				logger.debug("SubscribeInvoices Error", err);
			});

			subscribeInvoicesCall.on("status", function(status) {
				logger.debug("SubscribeInvoices Status", status);
			});
		}
	}

	io.on("connection", function(socket) {

		debug('socket.handshake', socket.handshake);

		if (authRequired) {
			try {
				var authorizationHeaderToken = socket.handshake.headers.authorization.substr(6);
				if (authorizationHeaderToken === userToken) {
					socket._limituser = false;
				} else if (authorizationHeaderToken === limitUserToken) {
					socket._limituser = true;
				} else {
					socket.disconnect('unauthorized');
					return;
				}
			} catch (err) { // probably because of missing authorization header
				socket.disconnect('unauthorized');
				return;
			}
		} else {
			socket._limituser = false;
		}

		/** printing out the client who joined */
		logger.debug("New socket client connected (id=" + socket.id + ").");

		socket.emit("hello", { limitUser: socket._limituser });

		socket.broadcast.emit("hello", { remoteAddress: socket.handshake.address });

		/** pushing new client to client array*/
		clients.push(socket);

		initSubscribeInvoicesCall();

		/** listening if client has disconnected */
		socket.on("disconnect", function() {
			clients.splice(clients.indexOf(socket), 1);
			logger.debug("client disconnected (id=" + socket.id + ").");
		});

	});

}
