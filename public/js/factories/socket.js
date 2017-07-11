// public/js/factories/socket.js
const io = require("socket.io-client");

(function () {
	"use strict";

	module.exports = function () {

		return {
			connect: function (serverUrl, options) {
				return io.connect(serverUrl, options);
			}
		};

	};

})();
