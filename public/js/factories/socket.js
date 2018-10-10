// public/js/factories/socket.js
const io = require('socket.io-client');

(function socket() {
  module.exports = () => ({
    connect(serverUrl, options) {
      return io.connect(serverUrl, options);
    },
  });
}());
