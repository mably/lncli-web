module.exports = (lnwebcli) => {
  lnwebcli.directive('amount', ['lncli', 'config', 'lnwebcliUtils', require('./amount')]);
};
