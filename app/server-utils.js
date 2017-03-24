// app/utils.js

const debug = require('debug')('lncliweb:utils')
const logger = require('winston')

// TODO
module.exports = function(server) {

	var module = {};

	server.getURL = function () {
		return "http" + (this.useTLS ? "s" : "") + "://" + this.serverHost 
			+ (this.useTLS
				? ((this.serverPort === "443") ? "" : ":" + this.serverPort)
				: ((this.serverPort === "80") ? "" : ":" + this.serverPort));
	}

	return module;
}
