// public/js/factories/utils.js
(function () {
  module.exports = function () {
    return {

      /**
			 * TODO
			 */
      buffer2hexa(buffer, reverse) {
        let uint8Array = new Uint8Array(buffer);
        if (reverse) { uint8Array = uint8Array.reverse(); }
        return Array.prototype.map.call(uint8Array, x => (`00${x.toString(16)}`).slice(-2)).join('');
      },

      /**
			 * TODO
			 */
      getUrlParameterByName(name, url) {
        if (!url) {
          url = window.location.href;
        }
        name = name.replace(/[\[\]]/g, '\\$&');
        const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);
        const results = regex.exec(url);
        if (!results) {
          return null;
        }
        if (!results[2]) {
          return '';
        }
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
      },

      /**
			 * TODO
			 */
      format(str) {
        const args = arguments;
        return str.replace(/{[0-9]}/g, matched => args[parseInt(matched.replace(/[{}]/g, '')) + 1]);
      },

      /**
			 * TODO
			 */
      toFixedWithoutTrailingZeroes(value, nbdec) {
        const valueStr = value.toFixed(nbdec);
        return valueStr.replace(/([0-9]+(\.[0-9]+[1-9])?)(\.?0+$)/, '$1');
      },

    };
  };
}());
