// public/js/factories/utils.js
(function () {
	"use strict";

	module.exports = function () {

		return {

			/**
			 * TODO
			 */
			buffer2hexa: function (buffer, reverse) {
				var uint8Array = new Uint8Array(buffer);
				if (reverse) { uint8Array = uint8Array.reverse(); }
				return Array.prototype.map.call(uint8Array, x => ("00" + x.toString(16)).slice(-2)).join("");
			}

		};

	};

})();
