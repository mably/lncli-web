// set up ========================
const debug = require("debug")("lncliweb:server");
const express  = require("express");
const session = require("express-session");
const Grant = require("grant-express");
const grant = new Grant(require("../config/grant-config.js"));
const bodyParser = require("body-parser");         // pull information from HTML POST (express4)
const methodOverride = require("method-override"); // simulate DELETE and PUT (express4)
const LE = require("greenlock");

// expose the server to our app with module.exports
module.exports = function (program) {

	var module = {};

	var lePath = require("os").homedir() + "/letsencrypt";

	// load app default configuration data
	const defaults = require("../config/defaults");

	// load other configuration data
	const config = require("../config/config");

	// define useful global variables ======================================
	module.useTLS = true;
	module.serverPort = program.serverport || "8280";
	module.httpsPort = program.httpsport || "8283";
	module.serverHost = program.serverhost;

	// setup winston logging ==========
	const logger = require("../config/log")((program.logfile || defaults.logfile), (program.loglevel || defaults.loglevel));

	// utilities functions =================
	const utils = require("./server-utils")(module);

	// setup basic authentication =================
	const basicauth = require("./basicauth")(program.user, program.pwd, program.limituser, program.limitpwd).filter;

	// db init =================
	const db = require("./database")(defaults.dataPath);

	// setup lightning client =================
	const lndHost = program.lndhost || defaults.lndHost;
	const lndCertPath = program.lndCertPath || defaults.lndCertPath;
	const macaroonPath = program.macaroonPath || defaults.macaroonPath;
	const lightning = require("./lightning")(defaults.lndProto, lndHost, lndCertPath, macaroonPath);

	// init lnd module =================
	const lnd = require("./lnd")(lightning);

	// setup LN payment request authentication =================
	const lnpayreqauth = require("./lnpayreqauth")(lightning, config).filter;
	// setup LN signature authentication =================
	const lnsignauth = require("./lnsignauth")(lightning, config).filter;
	// setup combined LN signature and payment authentication =================
	const lnsignpayreqauth = require("./lnsignpayreqauth")(lightning, config).filter;

	// init slacktip module =================
	const slacktip = require("./slacktip")(lightning, lnd, db, module, require("../config/slack-config"));

	// Storage Backend
	var leStore = require("le-store-certbot").create({
		configDir: lePath + "/etc",
		debug: true
	});

	// ACME Challenge Handlers
	var leChallenge = require("le-challenge-fs").create({
		webrootPath: lePath + "/var/",                     // or template string such as
		debug: true                                        // "/srv/www/:hostname/.well-known/acme-challenge"
	});

	function leAgree(opts, agreeCb) {
		var myopts = {
			domains: [program.serverhost],
			email: program.leEmail,
			tosUrl: true
		};
		agreeCb(null, myopts.tosUrl);
	}

	function approveDomains(opts, certs, cb) {
		// This is where you check your database and associated
		// email addresses with domains and agreements and such

		// The domains being approved for the first time are listed in opts.domains
		// Certs being renewed are listed in certs.altnames
		if (certs) {
			opts.domains = certs.altnames;
		} else {
			opts.email = program.leEmail;
			opts.agreeTos = true;
		}

		cb(null, { options: opts, certs: certs });
	}

	var le = LE.create({
		server: LE.productionServerUrl,                           // or LE.productionServerUrl
		store: leStore,                                           // handles saving of config, accounts, and certificates
		challenges: { "http-01": leChallenge },                   // handles /.well-known/acme-challege keys and tokens
		challengeType: "http-01",                                 // default to this challenge type
		agreeToTerms: leAgree,                                    // hook to allow user to view and accept LE TOS
		approveDomains: approveDomains,
		debug: true
		//, log: function (debug) {console.log.apply(console, args);} // handles debug outputs
	});

	// Check in-memory cache of certificates for the named domain
	le.check({ domains: [program.serverhost] }).then(function (results) {

		if (results) {
			// we already have certificates
			return;
		}

		// Register Certificate manually
		le.register({
			domains: [program.serverhost],
			email: program.leEmail,
			agreeTos: true,
			rsaKeySize: 2048,
			challengeType: "http-01",
		}).then(function (results) {
			console.log("success");
		}, function (err) {
			console.error(err.stack);
		});

	});

	// app creation =================
	const app = express();                                          // create our app w/ express
	app.use(session({ secret: config.sessionSecret, cookie: { maxAge: config.sessionMaxAge }, resave: true, rolling: true, saveUninitialized: true }));

	// app configuration =================
	app.use(require("./cors"));                                     // enable CORS headers
	app.use(grant);                                                 // mount grant

	app.use(["/lnd.html", "/api/lnd/"], basicauth);                 // enable basic authentication for lnd apis
	app.use(["/ln-payreq-auth.html"], lnpayreqauth);                // enable LN payment request authentication for specific test page
	app.use(["/ln-sign-auth.html"], lnsignauth);                    // enable LN signature authentication for specific test page
	app.use(["/ln-signpayreq-auth.html"], lnsignpayreqauth);        // enable combined LN payment and signature authentication
	app.use(express.static(__dirname + "/../public"));              // set the static files location /public/img will be /img for users
	app.use(bodyParser.urlencoded({ extended: "true" }));           // parse application/x-www-form-urlencoded
	app.use(bodyParser.json());                                     // parse application/json
	app.use(bodyParser.json({ type: "application/vnd.api+json" })); // parse application/vnd.api+json as json
	app.use(methodOverride());
	// error handler
	app.use(function (err, req, res, next) {
		// Do logging and user-friendly error message display
		logger.error(err);
		res.status(500).send({ status: 500, message: "internal error", type: "internal" });
	});

	// init server =================

	// handles acme-challenge and redirects to https
	require("http").createServer(le.middleware(require("redirect-https")())).listen(module.serverPort, module.serverHost, function () {
		console.log("Listening for ACME http-01 challenges on", this.address());
	});

	var server = require("https").createServer(le.httpsOptions, le.middleware(app));

	const io = require("socket.io")(server);

	// setup sockets =================
	var lndLogfile = program.lndlogfile || defaults.lndLogFile;
	require("./sockets")(io, lightning, lnd, program.user, program.pwd, program.limituser, program.limitpwd, lndLogfile);

	// setup routes =================
	require("./routes")(app, lightning, slacktip, db, config);

	// listen (start app with node server.js) ======================================
	server.listen(module.httpsPort, module.serverHost);

	logger.info("App listening on " + module.serverHost + " port " + module.httpsPort);

	module.server = server;

	return module;
};
