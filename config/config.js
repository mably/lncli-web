// config/config.js

module.exports = {
	serverPort: 8280,
	serverHost: '0.0.0.0',
	lndProto: __dirname + '/rpc.proto',
	lndHost : 'localhost:10009',
	loglevel: 'info',
	logfile: 'lncliweb.log',
	lndLogFile: require('os').homedir() + '/.lnd/logs/testnet3/lnd.log'
};
