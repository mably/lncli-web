// set up ========================
var express  = require('express');
var app      = express();                        // create our app w/ express
var bodyParser = require('body-parser');         // pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
var grpc = require('grpc');
var program = require('commander');
  
// load app default configuration data
var config = require('./config/config');

// parse command line parameters
program
  .version('1.0.0')
  .option('-s, --serverport [port]', 'web server listening port (defaults to 8280)')
  .option('-l, --lndhost  [host:port]', 'RPC lnd host (defaults to localhost:10009)')
  .parse(process.argv);

var lndHost = program.lndhost || config.lndHost;
var serverPort = program.serverport || config.serverPort;

// lightning configuration =================
var lnrpcDescriptor = grpc.load(config.lndProto);
var lightning = new lnrpcDescriptor.lnrpc.Lightning(lndHost, grpc.credentials.createInsecure());

// app configuration =================
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

// routes =================
require("./app/routes.js")(app, lightning);

// listen (start app with node server.js) ======================================
app.listen(serverPort);
console.log("App listening on port " + serverPort);
