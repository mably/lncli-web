(function () {

	lnwebcli.controller("GetInfoCtrl", ["$scope", "$timeout", "$window", "lncli", controller]);

	function controller($scope, $timeout, $window, lncli) {

		$scope.spinner = 0;

		$scope.refresh = function () {
			$scope.spinner++;
			lncli.getInfo(false).then(function(response) {
				$scope.spinner--;
				console.log(response);
				$scope.data = JSON.stringify(response.data, null, "\t");
				$scope.info = response.data;
			}, function(err) {
				$scope.spinner--;
				console.log('Error: ' + err);
			});
		}

		$scope.pubkeyCopied = function(info) {
			info.pubkeyCopied = true;
			$timeout(function() {
				info.pubkeyCopied = false;
			}, 500);
		}

		$scope.openBlockInExplorerByHash = function (blockHash) {
			if (blockHash) {
				$window.open("https://testnet.smartbit.com.au/block/" + blockHash, "_blank");
			}
		}

		$scope.openBlockInExplorerByHeight = function (blockHeight) {
			if (blockHeight) {
				$window.open("https://testnet.smartbit.com.au/block/" + blockHeight, "_blank");
			}
		}

		$scope.refresh();

	}

})();
