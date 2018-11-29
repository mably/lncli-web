// app/lnd.js

// const debug = require('debug')('lncliweb:lnd');
const logger = require('winston');

// TODO
module.exports = function factory(lightning) {
  const module = {};

  const invoiceListeners = [];

  let lndInvoicesStream = null;

  const openLndInvoicesStream = function olndis() {
    if (lndInvoicesStream) {
      logger.debug('Lnd invoices subscription stream already opened.');
    } else {
      logger.debug('Opening lnd invoices subscription stream...');
      lndInvoicesStream = lightning.getActiveClient().subscribeInvoices({});
      logger.debug('Lnd invoices subscription stream opened.');
      lndInvoicesStream.on('data', (data) => {
        logger.debug('SubscribeInvoices Data', data);
        for (let i = 0; i < invoiceListeners.length; i += 1) {
          try {
            invoiceListeners[i].dataReceived(data);
          } catch (err) {
            logger.warn(err);
          }
        }
      });
      lndInvoicesStream.on('end', () => {
        logger.debug('SubscribeInvoices End');
        lndInvoicesStream = null;
        openLndInvoicesStream(); // try opening stream again
      });
      lndInvoicesStream.on('error', (err) => {
        logger.debug('SubscribeInvoices Error', err);
      });
      lndInvoicesStream.on('status', (status) => {
        logger.debug('SubscribeInvoices Status', status);
        if (status.code === 14) { // Unavailable
          lndInvoicesStream = null;
          openLndInvoicesStream(); // try opening stream again
        }
      });
    }
  };

  // register invoice listener
  module.registerInvoiceListener = (listener) => {
    invoiceListeners.push(listener);
    logger.debug(`New lnd invoice listener registered, ${invoiceListeners.length} listening now`);
  };

  // unregister invoice listener
  module.unregisterInvoiceListener = (listener) => {
    invoiceListeners.splice(invoiceListeners.indexOf(listener), 1);
    logger.debug(`Lnd invoice listener unregistered, ${invoiceListeners.length} still listening`);
  };

  // open lnd invoices stream on start
  openLndInvoicesStream();

  // check every minute that lnd invoices stream is still opened
  setInterval(() => {
    if (!lndInvoicesStream) {
      openLndInvoicesStream();
    }
  }, 60 * 1000);

  return module;
};
