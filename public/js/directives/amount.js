module.exports = function (lncli, config, utils) {
	return {
		restrict: "E",
		replace: true,
		transclude: false,
		scope: { baseValue: "=?baseValue", baseUnit: "=?baseUnit", mainUnit: "=?mainUnit", altUnit: "=?altUnit" },
		templateUrl: "templates/partials/amount.html",
		link: function (scope, elt, attrs) {
			scope.$watch("baseValue", function (baseValue, oldBaseValue) {
				if (!attrs.baseUnit || (attrs.baseUnit === "sat")) {
					var mainUnit = attrs.mainUnit ? attrs.mainUnit : lncli.getConfigValue(config.keys.AMOUNT_MAIN_UNIT);
					if (mainUnit) {
						var mainValue;
						switch (mainUnit) {
							case "btc":
								mainValue = scope.baseValue / 100000000;
								scope.mainValue = utils.toFixedWithoutTrailingZeroes(mainValue, 8);
								scope.mainUnit = "btc";
								break;
							case "mbtc":
								mainValue = scope.baseValue / 100000;
								scope.mainValue = utils.toFixedWithoutTrailingZeroes(mainValue, 5);
								scope.mainUnit = "mbtc";
								break;
							case "bit":
								mainValue = scope.baseValue / 100;
								scope.mainValue = utils.toFixedWithoutTrailingZeroes(mainValue, 2);
								scope.mainUnit = "bit";
								break;
							case "none":
								scope.mainValue = scope.baseValue;
								break;
							case "usd":
							case "eur":
								lncli.getCoinPrice(true, mainUnit).then(function (price) {
									mainValue = price * scope.baseValue / 100000000;
									scope.mainValue = utils.toFixedWithoutTrailingZeroes(mainValue, 4);
									scope.mainUnit = mainUnit;
								}, function (err) {
									console.log("Error:", err);
								});
								break;
							default:
								scope.mainValue = scope.baseValue;
								scope.mainUnit = "sat";
						}
					} else {
						scope.mainValue = scope.baseValue;
						scope.mainUnit = "sat";
					}
					var altUnit = attrs.altUnit ? attrs.altUnit : lncli.getConfigValue(config.keys.AMOUNT_ALT_UNIT);
					if (altUnit) {
						var altValue;
						switch (altUnit) {
							case "btc":
								altValue = scope.baseValue / 100000000;
								scope.altValue = utils.toFixedWithoutTrailingZeroes(altValue, 8);
								scope.altUnit = "btc";
								break;
							case "mbtc":
								altValue = scope.baseValue / 100000;
								scope.altValue = utils.toFixedWithoutTrailingZeroes(altValue, 5);
								scope.altUnit = "mbtc";
								break;
							case "bit":
								altValue = scope.baseValue / 100;
								scope.altValue = utils.toFixedWithoutTrailingZeroes(altValue, 2);
								scope.altUnit = "bit";
								break;
							case "none":
								break;
							case "usd":
							case "eur":
								lncli.getCoinPrice(true, altUnit).then(function (price) {
									altValue = price * scope.baseValue / 100000000;
									scope.altValue = utils.toFixedWithoutTrailingZeroes(altValue, 4);
									scope.altUnit = altUnit;
								}, function (err) {
									console.log("Error:", err);
								});
								break;
							default:
								scope.altValue = scope.baseValue;
								scope.altUnit = "sat";
						}
					}
				}
			});
		},
	};
};
