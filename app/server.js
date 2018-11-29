// set up ========================
/* const debug = */require('debug')('lncliweb:server');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser'); // pull information from HTML POST (express4)
const methodOverride = require('method-override'); // simulate DELETE and PUT (express4)

// expose the server to our app with module.exports
module.exports = function factory(program) {
  const module = {};

  // load app default configuration data
  const defaults = require('../config/defaults');

  // load other configuration data
  const config = require('../config/config');

  // define useful global variables ======================================
  module.useTLS = program.usetls;
  module.serverPort = program.serverport || defaults.serverPort;
  module.httpsPort = module.serverPort;
  module.serverHost = program.serverhost || defaults.serverHost;

  // setup winston logging ==========
  const logger = require('../config/log')((program.logfile || defaults.logfile), (program.loglevel || defaults.loglevel));

  // utilities functions =================
  require('./server-utils')(module);

  // setup authentication =================
  const basicauth = require('./basicauth')(program.user, program.pwd, program.limituser, program.limitpwd).filter;

  // db init =================
  const db = require('./database')(defaults.dataPath);

  const lightning = module.makeLightningManager(program);

  // init lnd module =================
  const lnd = require('./lnd')(lightning);

  // setup LN payment request authentication =================
  const lnpayreqauth = require('./lnpayreqauth')(lightning, config).filter;
  // setup LN signature authentication =================
  const lnsignauth = require('./lnsignauth')(lightning, config).filter;
  // setup combined LN signature and payment authentication =================
  const lnsignpayreqauth = require('./lnsignpayreqauth')(lightning, config).filter;

  // app creation =================
  const app = express(); // create our app w/ express
  app.use(session({
    secret: config.sessionSecret,
    cookie: { maxAge: config.sessionMaxAge },
    resave: true,
    rolling: true,
    saveUninitialized: true,
  }));

  // app configuration =================
  app.use(require('./cors')); // enable CORS headers
  app.use(['/lnd.html', '/api/lnd/'], basicauth); // enable basic authentication for lnd apis
  app.use(['/ln-payreq-auth.html'], lnpayreqauth); // enable LN payment request authentication for specific test page
  app.use(['/ln-sign-auth.html'], lnsignauth); // enable LN signature authentication for specific test page
  app.use(['/ln-signpayreq-auth.html'], lnsignpayreqauth); // enable combined LN payment and signature authentication
  app.use(express.static(`${__dirname}/../public`)); // set the static files location /public/img will be /img for users
  app.use(bodyParser.urlencoded({ extended: 'true' })); // parse application/x-www-form-urlencoded
  app.use(bodyParser.json()); // parse application/json
  app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
  app.use(methodOverride());
  // error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    // Do logging and user-friendly error message display
    logger.error(err);
    res.status(500).send({ status: 500, message: 'internal error', type: 'internal' });
  });

  // init server =================
  let server;
  if (program.usetls) {
    server = require('https').createServer({
      key: require('fs').readFileSync(`${program.usetls}/key.pem`),
      cert: require('fs').readFileSync(`${program.usetls}/cert.pem`),
    }, app);
  } else {
    server = require('http').Server(app);
  }
  const io = require('socket.io')(server);

  // setup sockets =================
  const lndLogfile = program.lndlogfile || defaults.lndLogFile;
  require('./sockets')(io, lightning, lnd, program.user, program.pwd, program.limituser, program.limitpwd, lndLogfile);

  // setup routes =================
  require('./routes')(app, lightning, db, config);

  // listen (start app with node server.js) ======================================
  server.listen(module.serverPort, module.serverHost);

  logger.info(`App listening on ${module.serverHost} port ${module.serverPort}`);

  module.server = server;

  return module;
};
