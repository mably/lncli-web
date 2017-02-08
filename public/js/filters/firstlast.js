(function () {

	lnwebcli.filter("firstlast", [filter]);

	function filter($scope, $uibModal, lncli) {
		return function(input, first, last, separator) {
			var filtered;
			last = last || first;
			if (input.length > (first + last)) {
				separator = separator || "...";
				filtered = input.substr(0, first) + separator + input.substr(input.length - last, last);
			} else {
				filtered = input;
			}
			return filtered;
		};
	}

})();
