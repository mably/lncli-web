module.exports = function () {
  return {
    restrict: 'E',
    replace: true,
    transclude: false,
    scope: {
      visible: '=visible',
      ariaLabel: '@ariaLabel',
      onToggle: '&onToggle',
    },
    templateUrl: 'templates/partials/lnd/togglepanel.html',
  };
};
