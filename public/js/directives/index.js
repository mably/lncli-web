module.exports = function factory(lnwebcli) {
  lnwebcli.directive('amount', ['lncli', 'config', 'lnwebcliUtils', require('./amount')]);
};
