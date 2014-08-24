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
.controller('main', function($scope, $location, $timeout, $window, synth, sequencer, serialport) {
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
			if((new Date() * 1) - calibrationStart < 3000 || calibrationData.counts[0] < 3 || !calibrationData.counts[1] < 3 || !calibrationData.counts[2] < 3 || !calibrationData.counts[3] < 3) return;
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
				localStorage.setItem('LightSynthMinValues', JSON.stringify(minValues));
				localStorage.setItem('LightSynthMaxValues', JSON.stringify(maxValues));
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
	$scope.sequencer = sequencer;
	$scope.modeL = 'pitch';
	$scope.modeR = 'volume';
	$scope.invertL = true;
	$scope.invertR = true;
	$scope.mode = 'synth';
	serialport.onData = function(data) {
		if(calibrating !== 0) return calibration(data);
		data.value = Math.min(maxValues[data.photoResistor], Math.max(minValues[data.photoResistor], data.value)) - minValues[data.photoResistor];
		data.value = data.value * 100 / (maxValues[data.photoResistor] - minValues[data.photoResistor]);	
		$scope.$apply(function() {
			var action, percent;
			if(data.photoResistor < 2) {
				action = $scope.modeL;
				$scope.invertL && (data.value = 100 - data.value);
				percent = $scope.avgL = ($scope.percents[0] + $scope.percents[1]) / 2;
			} else {
				action = $scope.modeR;
				$scope.invertR && (data.value = 100 - data.value);
				percent = $scope.avgR = ($scope.percents[2] + $scope.percents[3]) / 2;
			}
			switch(action) {
				case 'pitch':
					if($scope.mode === 'sequencer') sequencer.setNote(percent);
					else synth.setNote(percent);
				break;
				case 'volume':
					synth.setVolume(percent);
				break;
				case 'cutoff':
					synth.setCutoff(percent);
				break;
				case 'stroke':
					synth.strokeNote(percent);
				break;
			}
			$scope.percents[data.photoResistor] = data.value;
		});
	};

	/* Axis modes handlers */
	$scope.$watch('modeL', function(current, prev) {
		$scope.modeR === current && ($scope.modeR = prev);
	});
	$scope.$watch('modeR', function(current, prev) {
		$scope.modeL === current && ($scope.modeL = prev);
	});

	/* Keyboard Handler */
	var keydownHandler = function(e) {
			if(e.target.tagName.toLowerCase() === 'input') return;
			var code = e.keyCode,
				noteKeys = [81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 219, 221],
				chordKeys = [65, 83, 68, 70, 71, 72, 74, 75, 76],
				modeKeys = [90, 88, 67, 86, 66, 78, 77, 188];

			var note;
			if((note = noteKeys.indexOf(code)) !== -1) {
				document.querySelectorAll('.notes a')[note].click();
			}
			
			var chord;
			if((chord = chordKeys.indexOf(code)) !== -1) {
				document.querySelectorAll('.chords a')[chord].click();
			}

			var mode;
			if((mode = modeKeys.indexOf(code)) !== -1) {
				document.querySelectorAll('.sliders input[type="radio"]')[mode].click();
			}

			var list = document.querySelectorAll('.list li'),
				active = document.querySelector('.list .active'),
				index = Array.prototype.indexOf.call(active.parentNode.children, active);

			switch(code) {
				case 38:
					--index >= 0 && list[index].firstChild.click();
				break;
				case 40:
					++index < list.length && list[index].firstChild.click();
				break;
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
