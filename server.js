// set up ========================
var express  = require('express');
var bodyParser = require('body-parser');         // pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
var program = require('commander');

process.env.HTTP_PROXY = "";

// parse command line parameters
program
  .version('1.0.0')
  .option('-s, --serverport [port]', 'web server listening port (defaults to 8280)')
  .option('-l, --lndhost [host:port]', 'RPC lnd host (defaults to localhost:10009)')
  .option('-u, --user [login]', 'basic authentication login')
  .option('-p, --pwd [password]', 'basic authentication password')
  .parse(process.argv);
  
// load app default configuration data
var defaults = require('./config/config');

// setup authentication =================
var auth = require("./app/basicauth")(program.user, program.pwd).filter;

// setup lightning client =================
var lightning = require("./app/lightning")(defaults.lndProto, (program.lndhost || defaults.lndHost));

// app creation =================
var app = express();                                            // create our app w/ express

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
  console.error(err);
  res.status(500).send({status:500, message: 'internal error', type:'internal'}); 
});

// setup routes =================
require("./app/routes")(app, lightning);

// listen (start app with node server.js) ======================================
var serverPort = program.serverport || defaults.serverPort;
app.listen(serverPort);
console.log("App listening on port " + serverPort);
