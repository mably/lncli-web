// config/defaults.js

module.exports = {
	serverPort: 8280,
	serverHost: "localhost",
	lndProto: __dirname + "/rpc.proto",
	lndHost: "localhost:10009",
	lndCertPath: __dirname + "/../lnd.cert",
	macaroonPath: __dirname + "/../admin.macaroon",
	dataPath: __dirname + "/../data",
	loglevel: "info",
	logfile: "lncliweb.log",
	lndLogFile: require("os").homedir() + "/.lnd/logs/testnet3/lnd.log"
};
