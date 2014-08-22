'use strict';

/* Controllers */
angular.module('LightSynth.controllers', [])
.controller('connect', function($scope, $interval, serialport) {
	var list = function() {
			serialport.list(function(ports) {
				$scope.ports = ports;
				if($scope.portPath) return;
				$scope.portPath = ports[0].comName;
				ports.forEach(function(port) {
					port.comName.indexOf('usbserial') !== -1 && ($scope.portPath = port.comName);
				});
			});
		},
		interval = $interval(list, 3000);
	
	$scope.$on('$destroy', function() {
		$interval.cancel(interval);
	});
	$scope.submit = function() {
		serialport.connect($scope.portPath);
	};
	list();
})
.controller('main', function($scope, $location, $timeout, $window, synth, serialport) {
	if(!serialport.serialport) return $location.path('/');
	/* Calibration stuff */
	var minValues = JSON.parse(localStorage.getItem('LightSynthMinValues') || '[140, 140, 140, 140]'),
		maxValues = JSON.parse(localStorage.getItem('LightSynthMaxValues') || '[600, 600, 600, 600]'),
		calibrating = 0,
		calibrationStart,
		calibrationData,
		calibrationTimeout,
		calibration = function(data) {
			calibrationData.sums[data.photoResistor] += data.value;
			calibrationData.counts[data.photoResistor]++;
			if((new Date() * 1) - calibrationStart >= 3000) {
				if(calibrating === 1) {
					minValues = [
						parseFloat((calibrationData.sums[0] / calibrationData.counts[0]).toFixed(2)),
						parseFloat((calibrationData.sums[1] / calibrationData.counts[1]).toFixed(2)),
						parseFloat((calibrationData.sums[2] / calibrationData.counts[2]).toFixed(2)),
						parseFloat((calibrationData.sums[3] / calibrationData.counts[3]).toFixed(2))
					];
					calibrating = 0;
					$scope.$apply(function() {
						$scope.calibrating = 'Prepare to calibrate high end...';	
					});
					$timeout.cancel(calibrationTimeout);
					calibrationTimeout = $timeout(function() {
						calibrating = 2;
						calibrationStart = new Date() * 1;
						calibrationData = {
							sums: [0, 0, 0, 0],
							counts: [0, 0, 0, 0]
						};
						$scope.calibrating = 'Calibrating high end...';
					}, 2000);
				} else {
					maxValues = [
						parseFloat((calibrationData.sums[0] / calibrationData.counts[0]).toFixed(2)),
						parseFloat((calibrationData.sums[1] / calibrationData.counts[1]).toFixed(2)),
						parseFloat((calibrationData.sums[2] / calibrationData.counts[2]).toFixed(2)),
						parseFloat((calibrationData.sums[3] / calibrationData.counts[3]).toFixed(2))
					];
					calibrating = 0;
					$scope.$apply(function() {
						delete $scope.calibrating;	
					});
					//localStorage.setItem('LightSynthMinValues', JSON.stringify(minValues));
					//localStorage.setItem('LightSynthMaxValues', JSON.stringify(maxValues));
				}
			}
		};

	$scope.calibrate = function() {
		if(calibrating) return;
		$scope.calibrating = 'Prepare to calibrate low end...';
		$timeout.cancel(calibrationTimeout);
		calibrationTimeout = $timeout(function() {
			calibrating = 1;
			calibrationStart = new Date() * 1;
			calibrationData = {
				sums: [0, 0, 0, 0],
				counts: [0, 0, 0, 0]
			};
			$scope.calibrating = 'Calibrating low end...';
		}, 2000);
	};

	/* Process serial data */
	$scope.avgL = 0;
	$scope.avgR = 0;
	$scope.percents = {0: 0, 1: 0, 2: 0, 3: 0};
	$scope.synth = synth;
	$scope.invertL = true;
	$scope.invertR = true;
	serialport.onData = function(data) {
		if(calibrating !== 0) return calibration(data);
		data.value = Math.min(maxValues[data.photoResistor], Math.max(minValues[data.photoResistor], data.value)) - minValues[data.photoResistor];
		$scope.$apply(function() {
			$scope.percents[data.photoResistor] = data.value * 100 / (maxValues[data.photoResistor] - minValues[data.photoResistor]);	
			if(data.photoResistor < 2) {
				$scope.avgL = ($scope.percents[0] + $scope.percents[1]) / 2;
				synth.setNote($scope.invertL ? 100 - $scope.avgL : $scope.avgL, 100);
			} else {
				$scope.avgR = ($scope.percents[2] + $scope.percents[3]) / 2;
				synth.setVolume($scope.invertR ? 100 - $scope.avgR : $scope.avgR);
			}
		});
	};
	
	/* Keyboard Handler */
	var keydownHandler = function(e) {
			var code = e.keyCode;
			if((code >= 48 && code <= 57) || code === 189 || code === 187) {
				code === 48 && (code = 58);
				code === 189 && (code = 59);
				code === 187 && (code = 60);
				$scope.$apply(function() {
					synth.root = synth.roots[code - 49];
				});
			}
		};

	$window.addEventListener('keydown', keydownHandler, false);

	$scope.$on('$destroy', function() {
		serialport.close();
		$window.removeEventListener('keydown', keydownHandler, false);
	});
})
.controller('footer', function($scope, autoupdater) {
	$scope.version = autoupdater.currentVersion;
	$scope.year = (new Date()).getFullYear();
});
