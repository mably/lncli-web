// app/routes.js

var grpc = require('grpc');
var bitcore = require('bitcore-lib');
var BufferUtil = bitcore.util.buffer;

// expose the routes to our app with module.exports
module.exports = function(app, lightning) {

	// api ---------------------------------------------------------------------

	// get lnd network info
	app.get('/api/getnetworkinfo', function(req, res) {
		lightning.getNetworkInfo({}, function(err, response) {
			if (err) {
				console.log('GetNetworkInfo Error:', err);
				err.error = err.message;
				res.send(err)
			} else {
				console.log('GetNetworkInfo:', response);
				res.json(response);
			}
		});
	});

	// get lnd node info
	app.get('/api/getinfo', function(req, res) {
		lightning.getInfo({}, function(err, response) {
			if (err) {
				console.log('GetInfo Error:', err);
				err.error = err.message;
				res.send(err)
			} else {
				console.log('GetInfo:', response);
				res.json(response);
			}
		});
	});

	// get lnd node active channels list
	app.get('/api/listpeers', function(req, res) {
		lightning.listPeers({}, function(err, response) {
			if (err) {
				console.log('ListPeers Error:', err);
				err.error = err.message;
				res.send(err)
			} else {
				console.log('ListPeers:', response);
				res.json(response);
			}
		});
	});

	// get lnd node active channels list
	app.get('/api/listchannels', function(req, res) {
		lightning.listChannels({}, function(err, response) {
			if (err) {
				console.log('ListChannels Error:', err);
				err.error = err.message;
				res.send(err)
			} else {
				console.log('ListChannels:', response);
				res.json(response);
			}
		});
	});

	// get lnd node pending channels list
	app.get('/api/pendingchannels', function(req, res) {
		lightning.pendingChannels({}, function(err, response) {
			if (err) {
				console.log('PendingChannels Error:', err);
				err.error = err.message;
				res.send(err)
			} else {
				console.log('PendingChannels:', response);
				res.json(response);
			}
		});
	});

	// get lnd node payments list
	app.get('/api/listpayments', function(req, res) {
		lightning.listPayments({}, function(err, response) {
			if (err) {
				console.log('ListPayments Error:', err);
				err.error = err.message;
				res.send(err)
			} else {
				console.log('ListPayments:', response);
				res.json(response);
			}
		});
	});

	// get lnd node invoices list
	app.get('/api/listinvoices', function(req, res) {
		lightning.listInvoices({}, function(err, response) {
			if (err) {
				console.log('ListInvoices Error:', err);
				err.error = err.message;
				res.send(err)
			} else {
				console.log('ListInvoices:', response);
				res.json(response);
			}
		});
	});

	// get the lnd node wallet balance
	app.get('/api/walletbalance', function(req, res) {
		lightning.walletBalance({}, function(err, response) {
			if (err) {
				console.log('WalletBalance Error:', err);
				err.error = err.message;
				res.send(err)
			} else {
				console.log('WalletBalance:', response);
				res.json(response);
			}
		});
	});

	// get the lnd node channel balance
	app.get('/api/channelbalance', function(req, res) {
		lightning.channelBalance({}, function(err, response) {
			if (err) {
				console.log('ChannelBalance Error:', err);
				err.error = err.message;
				res.send(err)
			} else {
				console.log('ChannelBalance:', response);
				res.json(response);
			}
		});
	});

	// connect peer to lnd node
	app.post('/api/connectpeer', function(req, res) {
		lightning.connectPeer({ addr: { pubkey: req.body.pubkey, host: req.body.host }, perm: true }, function(err, response) {
			if (err) {
				console.log('ConnectPeer Error:', err);
				err.error = err.message;
				res.send(err)
			} else {
				console.log('ConnectPeer:', response);
				res.json(response);
			}
		});
	});

	// openchannel
	app.post('/api/openchannel', function(req, res) {
		var openChannelRequest = {
			node_pubkey_string: req.body.pubkey,
			local_funding_amount: Number(req.body.localamt),
			push_sat: Number(req.body.pushamt),
			num_confs: Number(req.body.numconf)
		};
		console.log(openChannelRequest);
		lightning.openChannelSync(openChannelRequest, function(err, response) {
			if (err) {
				console.log('OpenChannel Error:', err);
				err.error = err.message;
				res.send(err)
			} else {
				console.log('OpenChannel:', response);
				res.json(response);
			}
		});
	});

	// closechannel
	app.post('/api/closechannel', function(req, res) {

		var fundingTxIdBuffer = BufferUtil.hexToBuffer(req.body.funding_txid);
		var revFundingTxIdBuffer = BufferUtil.reverse(fundingTxIdBuffer);
		var closeChannelRequest = {
			channel_point: {
				funding_txid: revFundingTxIdBuffer,
				output_index: Number(req.body.output_index)
			},
			force: !!req.body.force
		};
		console.log(closeChannelRequest);

		var call = lightning.closeChannel(closeChannelRequest);
		call.on('data', function(data) {
			console.log('CloseChannel Data', data);
			res.json(data);
			call.cancel(); // don't wait any longer (non-blocking mode)
		});
		call.on('end', function() {
			console.log('CloseChannel End');
		});
		call.on('error', function(err) {
			console.log('CloseChannel Error', err);
			if (err.code != grpc.status.CANCELLED) {
				err.error = err.message;
				res.json(err);
			}
		});
		call.on('status', function(status) {
			console.log('CloseChannel Status', status);
		});

	});

	// addinvoice
	app.post('/api/addinvoice', function(req, res) {
		lightning.addInvoice({ memo: req.body.memo, value: req.body.value }, function(err, response) {
			if (err) {
				console.log('AddInvoice Error:', err);
				err.error = err.message;
				res.send(err)
			} else {
				console.log('AddInvoice:', response);
				res.json(response);
			}
		});
	});

	// sendpayment
	app.post('/api/sendpayment', function(req, res) {
		var paymentRequest = { payment_request: req.body.payreq };
		console.log("Sending payment", paymentRequest);
		lightning.sendPaymentSync(paymentRequest, function(err, response) {
			if (err) {
				console.log('SendPayment Error:', err);
				err.error = err.message;
				res.send(err)
			} else {
				console.log('SendPayment:', response);
				res.json(response);
			}
		});
	});

	// decodepayreq
	app.post('/api/decodepayreq', function(req, res) {
		lightning.decodePayReq({ pay_req: req.body.payreq }, function(err, response) {
			if (err) {
				console.log('DecodePayReq Error:', err);
				err.error = err.message;
				res.send(err)
			} else {
				console.log('DecodePayReq:', response);
				res.json(response);
			}
		});
	});

	// application -------------------------------------------------------------
	app.get('*', function(req, res) {
		res.sendFile(__dirname + '/../public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
	});

}
