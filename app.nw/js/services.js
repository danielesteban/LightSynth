'use strict';

/* Services */
angular.module('LightSynth.services', [])
.factory('serialport', function($q, $location, $rootScope) {
	var serialport = require('serialport');
	return {
		connect: function(path, baudrate) {
			var self = this;
			this.serialport = new serialport.SerialPort(path, {
				baudrate: baudrate || 115200,
				disconnectedCallback: function() {
					delete self.serialport;
					$location.path('/');
					$rootScope.$apply();
				}
			});
			this.serialport.on('open', function() {
				$location.path('/main');
				$rootScope.$apply();
			});
			var readBuff = null;
			this.serialport.on('data', function(data) {
				readBuff = readBuff !== null ? Buffer.concat([readBuff, data]) : data;
				var l = readBuff.length;
				for(var i=0; i<l; i++) {
					if(readBuff[i] === 10) {
						self.onData && self.onData({
							photoResistor: readBuff[0],
							value: parseInt(readBuff.slice(1, i).toString('ascii'), 10)
						});
						readBuff = readBuff.slice(i + 1);
						i = 0;
						l = readBuff.length;
					}
				}
				!readBuff.length && (readBuff = null);
			});
			this.serialport.on('error', function(err) {
				alert('SerialPort Error: ' + err);
				self.close();
			});
		},
		close: function() {
			var self = this;
			this.serialport.close(function() {
				delete self.serialport;
				$location.path('/');
				$rootScope.$apply();
			});
		},
		list: function(callback) {
			var defer = $q.defer();
			defer.promise.then(callback);
			serialport.list(function(err, ports) {
				defer.resolve(ports);
			});
			return defer.promise;
		}
	};
})
.factory('synth', function() {
	var midi = new (require('midi')).output(),
		roots = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
		chords = {
			'Single Note': [0],
			'Octaves': [0, 12],
			'Maj7': [0, 4, 7, 11],
			'Power Chords': [0, 7, 12]
		},
		scales = {
			'All Notes': [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
			'Aeolian': [2, 1, 2, 2, 1, 2],
			'Locrian': [1, 2, 2, 1, 2, 2], 
			'Ionian': [2, 2, 1, 2, 2, 2], 
			'Dorian': [2, 1, 2, 2, 2, 1], 
			'Phrygian': [1, 2, 2, 2, 1, 2], 
			'Lydian': [2, 2, 2, 1, 2, 2],
			'Mixolydian': [2, 2, 1, 2, 2, 1], 
			'Melodic ascending minor': [2, 1, 2, 2, 2, 2],
			'Phrygian raised sixth': [1, 2, 2, 2, 2, 2],
			'Lydian raised fifth': [2, 2, 2, 2, 1, 2],
			'Major minor': [2, 2, 1, 2, 1, 2],
			'Altered': [1, 2, 1, 2, 2, 2],
			'Arabic': [1, 2, 2, 2, 1, 3]
		},
		notesOn = {};

	roots.forEach(function(root, i) {
		roots[i] = {
			offset: i,
			name: root
		};
	});
	for(var i in scales) {
		var c = 0;
		scales[i].forEach(function(interval, index) {
			c += interval;
			scales[i][index] = c; 
		});
		scales[i].unshift(0);
	}

	midi.openVirtualPort("LightSynth");
	return {
		roots: roots,
		root: roots[0],
		scales: scales,
		scale: scales['All Notes'],
		chords: chords,
		chord: chords['Single Note'],
		rootOctave: 3,
		numOctaves: 1,
		setNote: function(percent, velocity) {
			var note = Math.round(percent * (this.scale.length * parseInt(this.numOctaves, 10)) / 100),
				octave = parseInt(this.rootOctave, 10) + Math.floor(note / this.scale.length),
				midiNote = 12 + this.root.offset + (octave * 12) + this.scale[note % this.scale.length];

			if(this.note === midiNote) return;
			this.note = midiNote;
			for(var i in notesOn) midi.sendMessage([128, i, 127]);
			notesOn = {};
			this.chord.forEach(function(interval) {
				notesOn[midiNote + interval] = true;
				midi.sendMessage([144, midiNote + interval, velocity || 127]);
			});
		}
	};
});

