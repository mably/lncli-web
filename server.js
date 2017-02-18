// set up ========================
const debug = require('debug')('lncliweb:server')
const express  = require('express');
const bodyParser = require('body-parser');         // pull information from HTML POST (express4)
const methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
const program = require('commander');

// parse command line parameters
program
  .version('1.0.0')
  .option('-s, --serverport [port]', 'web server listening port (defaults to 8280)')
  .option('-l, --lndhost [host:port]', 'RPC lnd host (defaults to localhost:10009)')
  .option('-t, --usetls [path]', 'path to a directory containing key.pem and cert.pem files')
  .option('-u, --user [login]', 'basic authentication login')
  .option('-p, --pwd [password]', 'basic authentication password')
  .option('-r, --limituser [login]', 'basic authentication login for readonly account')
  .option('-w, --limitpwd [password]', 'basic authentication password for readonly account')
  .option('-f, --logfile [file path]', 'path to file where to store the application logs')
  .option('-e, --loglevel [level]', 'level of logs to display (debug, info, warn, error)')
  .option('-n, --lndlogfile <file path>', 'path to lnd log file to send to browser')
  .parse(process.argv);
  
// load app default configuration data
const defaults = require('./config/config');

// setup winston logging ==========
const logger = require('./config/log')((program.logfile || defaults.logfile), (program.loglevel || defaults.loglevel)); 

// setup authentication =================
const auth = require("./app/basicauth")(program.user, program.pwd, program.limituser, program.limitpwd).filter;

// setup lightning client =================
const lightning = require("./app/lightning")(defaults.lndProto, (program.lndhost || defaults.lndHost));

// app creation =================
const app = express();                                            // create our app w/ express

// app configuration =================
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

// setup routes =================
require("./app/routes")(app, lightning);

// init server =================
var server;
if (program.usetls) {
	server = require('https').createServer({
		key: require('fs').readFileSync(program.usetls + '/key.pem'),
		cert: require('fs').readFileSync(program.usetls + '/cert.pem')
	}, app);
} else {
	server = require('http').Server(app);
}
const io = require('socket.io')(server);

// setup sockets =================
var lndLogfile = program.lndlogfile || defaults.lndLogFile;
require("./app/sockets")(io, lightning, program.user, program.pwd, program.limituser, program.limitpwd, lndLogfile);

// listen (start app with node server.js) ======================================
const serverPort = program.serverport || defaults.serverPort;
server.listen(serverPort);
logger.info("App listening on port " + serverPort);
