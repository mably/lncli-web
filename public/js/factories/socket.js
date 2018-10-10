// public/js/factories/socket.js
const io = require('socket.io-client');

(function () {
  module.exports = function () {
    return {
      connect(serverUrl, options) {
        return io.connect(serverUrl, options);
      },
    };
  };
}());
