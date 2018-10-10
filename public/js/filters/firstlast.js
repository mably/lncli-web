(function () {
  module.exports = function ($scope, $uibModal, lncli) {
    return function (input, first, last, separator) {
      let filtered;
      last = last || first;
      if (input && input.length > (first + last)) {
        separator = separator || '...';
        filtered = input.substr(0, first) + separator + input.substr(input.length - last, last);
      } else {
        filtered = input;
      }
      return filtered;
    };
  };
}());
