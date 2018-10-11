module.exports = (app) => {
  app.factory('iosocket', [require('./socket.js')]);
  app.factory('lnwebcliUtils', [require('./utils.js')]);
};
