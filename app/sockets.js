// app/sockets.js

const debug = require('debug')('lncliweb:sockets');
const logger = require('winston');
const { spawn } = require('child_process');
const bitcore = require('bitcore-lib');

const BufferUtil = bitcore.util.buffer;

/**
 * Defines a wrapper around the socket object.
 */
class SocketAdapter {
  /**
   * @constructor
   * @param {object} socket - the socket object
   * @param {boolean} limitUser - current socket authorization level
   */
  constructor(socket, limitUser) {
    this.socket = socket;
    this.limitUser = limitUser;
  }

  setInvoiceListener(invoiceListener) {
    this.invoiceListener = invoiceListener;
  }

  setLogFilter(logFilter) {
    this.logFilter = logFilter;
  }
}

// TODO
module.exports = function (io, lightning, lnd, login, pass, limitlogin, limitpass, lndLogfile) {
  const clients = [];

  const authEnabled = (login && pass) || (limitlogin && limitpass);

  let userToken = null;
  let limitUserToken = null;
  if (login && pass) {
    userToken = Buffer.from(`${login}:${pass}`).toString('base64');
  }
  if (limitlogin && limitpass) {
    limitUserToken = Buffer.from(`${limitlogin}:${limitpass}`).toString('base64');
  }

  let tailProcess = null;
  let tailProcessTimeoutId = null;
  let tailProcessLastDataReceived = null;

  const filterLogData = function (logData, logPatternRE) {
    let filteredLogData = '';
    let index = -1;
    let prevIndex = 0;
    for ((index = logData.indexOf('\n', index + 1)); index > -1;) {
      const logLine = logData.substr(prevIndex, (index - prevIndex));
      if (logPatternRE) {
        if (logLine.match(logPatternRE)) {
          filteredLogData += `${logLine}\n`;
        }
      } else {
        filteredLogData += `${logLine}\n`;
      }
      prevIndex = index + 1;
    }
    return filteredLogData;
  };

  const registerGlobalListeners = function () {
    if (!tailProcess) {
      tailProcess = spawn('tail', ['-F', '--sleep-interval=2', lndLogfile]);
      tailProcess.on('error', (err) => {
        logger.warn("Couldn't launch tail command!", err.message);
        tailProcess = null;
      });
      tailProcess.stdout.on('data', (data) => {
        try {
          const logData = data.toString('utf-8');
          logger.debug('tail stdout', logData);
          tailProcessLastDataReceived = Date.now();
          for (let i = 0; i < clients.length; i += 1) {
            if (!clients[i].limituser && clients[i].logFilter) {
              try {
                const filteredLogData = filterLogData(
                  logData, clients[i].logFilter,
                );
                if (filteredLogData.length > 0) {
                  clients[i].emit('log', {
                    data: filteredLogData,
                  });
                }
              } catch (err) {
                logger.warn('tail emit error', err);
              }
            }
          }
        } catch (err) {
          logger.warn('tail data error', err);
        }
      });
      tailProcess.stderr.on('data', (data) => {
        logger.debug('tail stderr', data.toString('utf-8'));
        tailProcessLastDataReceived = Date.now();
      });
      tailProcess.on('exit', (code, signal) => {
        logger.debug('tail command exited!', code, signal);
        tailProcess = null;
      });
      tailProcess.on('close', (code) => {
        logger.debug('tail command was closed!', code);
        tailProcess = null;
      });
      // clear existing tail process activity checker
      if (tailProcessTimeoutId) {
        clearInterval(tailProcessTimeoutId);
      }
      // check every minute that the tail process have been sending data during the last minute
      tailProcessLastDataReceived = Date.now();
      tailProcessTimeoutId = setInterval(
        () => {
          if (tailProcess && (tailProcessLastDataReceived + (60 * 1000)) < Date.now()) {
            logger.warn('tail data timeout, killing process', tailProcess.pid);
            tailProcess.kill();
          }
        },
        60 * 1000, // one minute
      );
    } else {
      logger.debug('tail process already running', tailProcess.pid);
    }
  };

  registerGlobalListeners();

  // register the lnd invoices listener
  const registerLndInvoiceListener = function (client) {
    client.setInvoiceListener({
      dataReceived(data) {
        client.socket.emit('invoice', data);
      },
    });
    lnd.registerInvoiceListener(client.invoiceListener);
  };

  // unregister the lnd invoices listener
  const unregisterLndInvoiceListener = function (client) {
    lnd.unregisterInvoiceListener(client.invoiceListener);
  };

  // logfilter
  const LOGFILTER_EVENT = 'logfilter';
  const registerLogFilterListener = function (client) {
    const { socket } = client;
    socket.on(LOGFILTER_EVENT, (data, callback) => {
      logger.debug('logfilter', data);
      const { rid } = data; // request ID
      if (client.limituser) {
        callback({ rid, error: 'forbidden' });
      } else if (data.logFilterPattern) {
        try {
          client.setLogFilter(new RegExp(data.logFilterPattern, 'g'));
        } catch (error) {
          logger.info('logfilter', error);
        }
      }
    });
  };

  // openchannel
  const OPENCHANNEL_EVENT = 'openchannel';
  const registerOpenChannelListener = function (client) {
    const { socket } = client;
    socket.on(OPENCHANNEL_EVENT, (data, callback) => {
      const { rid } = data; // request ID
      if (client.limituser) {
        callback({ rid, error: 'forbidden' });
      } else {
        try {
          const openChannelRequest = {
            node_pubkey: BufferUtil.hexToBuffer(data.pubkey),
            local_funding_amount: Number(data.localamt),
            push_sat: Number(data.pushamt),
          };
          if (data.satperbyte) {
            openChannelRequest.sat_per_byte = Number(data.satperbyte);
          }
          if (data.targetconf) {
            openChannelRequest.target_conf = Number(data.targetconf);
          }
          if (data.privatechan) {
            openChannelRequest.private = !!data.privatechan;
          }
          if (data.remotecsvdelay) {
            openChannelRequest.remote_csv_delay = Number(data.remotecsvdelay);
          }
          debug('openChannelRequest', openChannelRequest);

          const call = lightning.getActiveClient().openChannel(openChannelRequest);
          call.on('data', (ocdata) => {
            logger.debug('OpenChannel Data', ocdata);
            socket.emit(OPENCHANNEL_EVENT, { rid, evt: 'data', ocdata });
          });
          call.on('end', () => {
            logger.debug('OpenChannel End');
            socket.emit(OPENCHANNEL_EVENT, { rid, evt: 'end' });
          });
          call.on('error', (err) => {
            logger.debug('OpenChannel Error', err.message);
            debug('OpenChannel Error', err);
            const error = { ...err, error: err.message };
            socket.emit(OPENCHANNEL_EVENT, { rid, evt: 'error', data: error });
          });
          call.on('status', (status) => {
            logger.debug('OpenChannel Status', status);
            socket.emit(OPENCHANNEL_EVENT, { rid, evt: 'status', data: status });
          });
          callback({ rid, message: 'open channel pending' });
        } catch (err) {
          logger.warn(err);
          callback({ rid, error: err });
        }
      }
    });
  };

  // closechannel
  const CLOSECHANNEL_EVENT = 'closechannel';
  const registerCloseChannelListener = function (client) {
    const { socket } = client;
    socket.on(CLOSECHANNEL_EVENT, (data, callback) => {
      const { rid } = data; // request ID
      if (client.limituser) {
        callback({ rid, error: 'forbidden' });
      } else {
        try {
          const fundingTxIdBuffer = BufferUtil.hexToBuffer(data.funding_txid);
          const revFundingTxIdBuffer = BufferUtil.reverse(fundingTxIdBuffer);
          const closeChannelRequest = {
            channel_point: {
              funding_txid_bytes: revFundingTxIdBuffer,
              output_index: Number(data.output_index),
            },
            force: !!data.force,
          };
          debug('closeChannelRequest', closeChannelRequest);

          const call = lightning.getActiveClient().closeChannel(closeChannelRequest);
          call.on('data', (ccdata) => {
            logger.debug('CloseChannel Data', ccdata);
            socket.emit(CLOSECHANNEL_EVENT, { rid, evt: 'data', ccdata });
          });
          call.on('end', () => {
            logger.debug('CloseChannel End');
            socket.emit(CLOSECHANNEL_EVENT, { rid, evt: 'end' });
          });
          call.on('error', (err) => {
            logger.debug('CloseChannel Error', err);
            const error = { ...err, error: err.message };
            socket.emit(CLOSECHANNEL_EVENT, { rid, evt: 'error', data: error });
          });
          call.on('status', (status) => {
            logger.debug('CloseChannel Status', status);
            socket.emit(CLOSECHANNEL_EVENT, { rid, evt: 'status', data: status });
          });
          callback({ rid, message: 'close channel pending' });
        } catch (err) {
          logger.warn(err);
          callback({ rid, error: err });
        }
      }
    });
  };

  // register the socket listeners
  const registerSocketListeners = function (client) {
    registerLndInvoiceListener(client);
    registerCloseChannelListener(client);
    registerOpenChannelListener(client);
    registerLogFilterListener(client);
  };

  // unregister the socket listeners
  const unregisterSocketListeners = function (client) {
    unregisterLndInvoiceListener(client);
    // unregisterCloseChannelListener(client);
    // unregisterOpenChannelListener(client);
  };

  io.on('connection', (socket) => {
    debug('socket.handshake', socket.handshake);

    let limituser;
    if (authEnabled) {
      try {
        let authorizationHeaderToken;
        if (socket.handshake.query.auth) {
          authorizationHeaderToken = socket.handshake.query.auth;
        } else if (socket.handshake.headers.authorization) {
          authorizationHeaderToken = socket.handshake.headers.authorization.substr(6);
        } else {
          socket.disconnect('unauthorized');
          return;
        }
        if (authorizationHeaderToken === userToken) {
          limituser = false;
        } else if (authorizationHeaderToken === limitUserToken) {
          limituser = true;
        } else {
          socket.disconnect('unauthorized');
          return;
        }
      } catch (err) { // probably because of missing authorization header
        debug(err);
        socket.disconnect('unauthorized');
        return;
      }
    } else {
      limituser = false;
    }

    /** printing out the client who joined */
    logger.debug(`New socket client connected (id=${socket.id}).`);

    socket.emit('hello', { limitUser: limituser });

    socket.broadcast.emit('hello', { remoteAddress: socket.handshake.address });

    /** pushing new client to client array */
    const client = new SocketAdapter(socket, limituser);
    clients[socket.id] = client;

    registerGlobalListeners();

    registerSocketListeners(client);

    /** listening if client has disconnected */
    socket.on('disconnect', () => {
      try {
        unregisterSocketListeners(client);
      } finally {
        delete clients[socket.id];
      }
      logger.debug(`client disconnected (id=${socket.id}).`);
    });
  });
};
