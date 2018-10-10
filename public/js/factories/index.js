module.exports = function (app) {
  app.factory('iosocket', [require('./socket.js')]);
  app.factory('lnwebcliUtils', [require('./utils.js')]);
};
