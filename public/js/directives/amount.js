module.exports = (lncli, config, utils) => ({
  restrict: 'E',
  replace: true,
  transclude: false,
  scope: {
    baseValue: '=?baseValue',
    baseUnit: '=?baseUnit',
    mainUnit: '=?mainUnit',
    altUnit: '=?altUnit',
  },
  templateUrl: 'templates/partials/amount.html',
  link(scope, elt, attrs) {
    // eslint-disable-next-line no-unused-vars
    scope.$watch('baseValue', (baseValue, oldBaseValue) => {
      if (!attrs.baseUnit || (attrs.baseUnit === 'sat')) {
        const mainUnit = attrs.mainUnit
          ? attrs.mainUnit
          : lncli.getConfigValue(config.keys.AMOUNT_MAIN_UNIT);
        if (mainUnit) {
          let mainValue;
          switch (mainUnit) {
            case 'btc':
              mainValue = scope.baseValue / 100000000;
              scope.mainValue = utils.toFixedWithoutTrailingZeroes(mainValue, 8);
              scope.mainUnit = 'btc';
              break;
            case 'mbtc':
              mainValue = scope.baseValue / 100000;
              scope.mainValue = utils.toFixedWithoutTrailingZeroes(mainValue, 5);
              scope.mainUnit = 'mbtc';
              break;
            case 'bit':
              mainValue = scope.baseValue / 100;
              scope.mainValue = utils.toFixedWithoutTrailingZeroes(mainValue, 2);
              scope.mainUnit = 'bit';
              break;
            case 'none':
              scope.mainValue = scope.baseValue;
              break;
            case 'usd':
            case 'eur':
              lncli.getCoinPrice(true, mainUnit)
                .then((price) => {
                  mainValue = price * scope.baseValue / 100000000;
                  scope.mainValue = utils.toFixedWithoutTrailingZeroes(mainValue, 4);
                  scope.mainUnit = mainUnit;
                }, (err) => {
                  console.log('Error:', err);
                });
              break;
            default:
              scope.mainValue = scope.baseValue;
              scope.mainUnit = 'sat';
          }
        } else {
          scope.mainValue = scope.baseValue;
          scope.mainUnit = 'sat';
        }
        const altUnit = attrs.altUnit
          ? attrs.altUnit
          : lncli.getConfigValue(config.keys.AMOUNT_ALT_UNIT);
        if (altUnit) {
          let altValue;
          switch (altUnit) {
            case 'btc':
              altValue = scope.baseValue / 100000000;
              scope.altValue = utils.toFixedWithoutTrailingZeroes(altValue, 8);
              scope.altUnit = 'btc';
              break;
            case 'mbtc':
              altValue = scope.baseValue / 100000;
              scope.altValue = utils.toFixedWithoutTrailingZeroes(altValue, 5);
              scope.altUnit = 'mbtc';
              break;
            case 'bit':
              altValue = scope.baseValue / 100;
              scope.altValue = utils.toFixedWithoutTrailingZeroes(altValue, 2);
              scope.altUnit = 'bit';
              break;
            case 'none':
              break;
            case 'usd':
            case 'eur':
              lncli.getCoinPrice(true, altUnit)
                .then((price) => {
                  altValue = price * scope.baseValue / 100000000;
                  scope.altValue = utils.toFixedWithoutTrailingZeroes(altValue, 4);
                  scope.altUnit = altUnit;
                }, (err) => {
                  console.log('Error:', err);
                });
              break;
            default:
              scope.altValue = scope.baseValue;
              scope.altUnit = 'sat';
          }
        }
      }
    });
  },
});
