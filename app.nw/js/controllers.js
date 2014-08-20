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
.controller('main', function($scope, $location, $timeout, synth, serialport) {
	if(!serialport.serialport) return $location.path('/');
	var minValues = JSON.parse(localStorage.getItem('LightSynthMinValues') || '[140, 140]'),
		maxValues = JSON.parse(localStorage.getItem('LightSynthMaxValues') || '[600, 600]'),
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
						parseFloat((calibrationData.sums[1] / calibrationData.counts[1]).toFixed(2))
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
							sums: [0, 0],
							counts: [0, 0]
						};
						$scope.calibrating = 'Calibrating high end...';
					}, 2000);
				} else {
					maxValues = [
						parseFloat((calibrationData.sums[0] / calibrationData.counts[0]).toFixed(2)),
						parseFloat((calibrationData.sums[1] / calibrationData.counts[1]).toFixed(2))
					];
					calibrating = 0;
					$scope.$apply(function() {
						delete $scope.calibrating;	
					});
					localStorage.setItem('LightSynthMinValues', JSON.stringify(minValues));
					localStorage.setItem('LightSynthMaxValues', JSON.stringify(maxValues));
				}
			}
		};

	$scope.avg = 0;
	$scope.percents = {0: 0, 1: 0};
	$scope.synth = synth;
	serialport.onData = function(data) {
		if(calibrating !== 0) return calibration(data);

		data.value = Math.min(maxValues[data.photoResistor], Math.max(minValues[data.photoResistor], data.value)) - minValues[data.photoResistor];
		$scope.$apply(function() {
			$scope.percents[data.photoResistor] = data.value * 100 / (maxValues[data.photoResistor] - minValues[data.photoResistor]);	
			var avg = 0, c = 0;
			for(var i in $scope.percents) {
				avg += $scope.percents[i];
				c++;
			}
			synth.setNote($scope.avg = avg / c);
		});
	};
	$scope.calibrate = function() {
		if(calibrating) return;
		$scope.calibrating = 'Prepare to calibrate low end...';
		$timeout.cancel(calibrationTimeout);
		calibrationTimeout = $timeout(function() {
			calibrating = 1;
			calibrationStart = new Date() * 1;
			calibrationData = {
				sums: [0, 0],
				counts: [0, 0]
			};
			$scope.calibrating = 'Calibrating low end...';
		}, 2000);
	};
	$scope.$on('$destroy', function() {
		serialport.close();
	});
});
