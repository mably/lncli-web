module.exports = function (lnwebcli) {
  lnwebcli.directive('amount', ['lncli', 'config', 'lnwebcliUtils', require('./amount')]);
};
