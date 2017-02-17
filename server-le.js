// set up ========================
const debug = require('debug')('lncliweb:server')
const express  = require('express');
const bodyParser = require('body-parser');         // pull information from HTML POST (express4)
const methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
const program = require('commander');
const LE = require('greenlock');

var leHostname;
var leEmail;
var lePath = require('os').homedir() + '/letsencrypt';

// parse command line parameters
program
  .version('1.0.0')
  .arguments('<hostname> <email>')
  .option('-s, --serverport <port>', 'web server listening port (defaults to 443)')
  .option('-l, --lndhost <host:port>', 'RPC lnd host (defaults to localhost:10009)')
  .option('-u, --user <login>', 'basic authentication login')
  .option('-p, --pwd <password>', 'basic authentication password')
  .option('-r, --limituser <login>', 'basic authentication login for readonly account')
  .option('-w, --limitpwd <password>', 'basic authentication password for readonly account')
  .option('-f, --logfile <file path>', 'path to file where to store the application logs')
  .option('-e, --loglevel <level>', 'level of logs to display (debug, info, warn, error)')
  .option('-n, --lndlogfile <file path>', 'path to lnd log file to send to browser')
  .action(function (hostname, email) {
     leHostname = hostname;
     leEmail = email;
  })
  .parse(process.argv);
  
if (typeof leHostname === 'undefined') {
   console.error('Let\'s Encrypt host name required!');
   process.exit(1);
}
  
if (typeof leEmail === 'undefined') {
   console.error('Let\'s Encrypt contact email required!');
   process.exit(1);
}

// load app default configuration data
const defaults = require('./config/config');

// setup winston logging ==========
const logger = require('./config/log')((program.logfile || defaults.logfile), (program.loglevel || defaults.loglevel)); 

// setup authentication =================
const auth = require("./app/basicauth")(program.user, program.pwd, program.limituser, program.limitpwd).filter;

// setup lightning client =================
const lightning = require("./app/lightning")(defaults.lndProto, (program.lndhost || defaults.lndHost));

// Storage Backend
var leStore = require('le-store-certbot').create({
	configDir: lePath + '/etc',
	debug: true
});

// ACME Challenge Handlers
var leChallenge = require('le-challenge-fs').create({
	webrootPath: lePath + '/var/',                     // or template string such as
	debug: true                                            // '/srv/www/:hostname/.well-known/acme-challenge'
});

function leAgree(opts, agreeCb) {
	var opts = {
		domains: [ leHostname ],
		email: leEmail,
		tosUrl: true
	};
	agreeCb(null, opts.tosUrl);
}

var le = LE.create({
	server: LE.productionServerUrl,                              // or LE.productionServerUrl
	store: leStore,                                           // handles saving of config, accounts, and certificates
	challenges: { 'http-01': leChallenge },                   // handles /.well-known/acme-challege keys and tokens
	challengeType: 'http-01',                                 // default to this challenge type
	agreeToTerms: leAgree,                                    // hook to allow user to view and accept LE TOS
	//sni: require('le-sni-auto').create({}),                 // handles sni callback
	debug: true
	//, log: function (debug) {console.log.apply(console, args);} // handles debug outputs
});

// Check in-memory cache of certificates for the named domain
le.check({ domains: [ leHostname ] }).then(function (results) {

	if (results) {
		// we already have certificates
		return;
	}

	// Register Certificate manually
	le.register({
		domains: [ leHostname ],
		email: leEmail,
		agreeTos: true,
		rsaKeySize: 2048,
		challengeType: 'http-01',
	}).then(function (results) {
		console.log('success');
	}, function (err) {
		console.error(err.stack);
	});

});

// app creation =================
const app = express();                                          // create our app w/ express

// app configuration =================
app.use('/', le.middleware());                                  // letsencrypt middleware for express
app.use(auth);                                                  // enable authentication
app.use(express.static(__dirname + '/public'));                 // set the static files location /public/img will be /img for users
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(methodOverride());
// error handler
app.use(function(err, req, res, next) {
  // Do logging and user-friendly error message display
  winston.error(err);
  res.status(500).send({status:500, message: 'internal error', type:'internal'}); 
});

// init server =================
var server;
if (program.serverport) {
	server = require('http').Server(app);
} else {
	var certPath = lePath + '/etc/live/' + leHostname;
	var options = {
		key: require('fs').readFileSync(certPath + '/privkey.pem'),
		cert: require('fs').readFileSync(certPath + '/fullchain.pem'),
		ca: require('fs').readFileSync(certPath + '/chain.pem')
	};
	server = require('https').createServer(options, app);
}
const io = require('socket.io')(server);

// setup routes =================
require("./app/routes")(app, lightning);

// setup sockets =================
var lndLogfile = program.lndlogfile || defaults.lndLogFile;
require("./app/sockets")(io, lightning, program.user, program.pwd, program.limituser, program.limitpwd, lndLogfile);

// listen (start app with node server.js) ======================================
const serverPort = program.serverport || '443';
server.listen(serverPort);
logger.info("App listening on port " + serverPort);
