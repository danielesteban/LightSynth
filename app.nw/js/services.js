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
			'Note': [0],
			'Eighth': [0, 12],
			'Fifth': [0, 7, 12],
			'Major': [0, 4, 7],
			'Minor': [0, 3, 7],
			'Maj7': [0, 4, 7, 11],
			'Min7': [0, 3, 7, 10],
			'Maj9': [0, 4, 7, 11, 14],
			'Aug7': [0, 4, 8, 10],
			'Dim7': [0, 3, 6, 9]
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
		note: 0,
		volume: 100,
		roots: roots,
		root: roots[0],
		scales: scales,
		scale: scales['All Notes'],
		chords: chords,
		chord: chords['Note'],
		rootOctave: 3,
		numOctaves: 1,
		setNote: function(percent, note, velocity) {
			var note = note || Math.round(percent * (this.scale.length * parseInt(this.numOctaves, 10)) / 100),
				octave = parseInt(this.rootOctave, 10) + Math.floor(note / this.scale.length),
				midiNote = 12 + this.root.offset + (octave * 12) + this.scale[note % this.scale.length];

			if(this.note === midiNote) return;
			this.note = midiNote;
			for(var i in notesOn) midi.sendMessage([128, i, 0]);
			notesOn = {};
			this.chord.forEach(function(interval) {
				notesOn[midiNote + interval] = true;
				midi.sendMessage([144, midiNote + interval, velocity || 127]);
			});
		},
		setVolume: function(percent) {
			var volume = Math.round(percent * 127 / 100);
			if(this.volume === volume) return;
			midi.sendMessage([176, 7, this.volume = volume]);
		}
	};
})
.factory('sequencer', function(synth) {
	var sequences = JSON.parse(localStorage.getItem('LightSynthSequences') || '[{"name": "Test", "notes": [{"note": 0, "chord": "Major"}, {"note": 9, "chord": "Minor"}]}]');

	sequences.push({"name": "Test 2", "notes": [{"note": 6, "chord": "Maj7"}, {"note": 12, "chord": "Aug7"}]});

	return {
		note: 0,
		sequences: sequences,
		sequence: sequences[0],
		switchingNote: false,
		setNote: function(percent) {
			if(!this.switchingNote && percent <= 40) this.switchingNote = true;
			else if(this.switchingNote && percent >= 60) {
				synth.root = synth.roots[this.sequence.notes[this.note].root || 0];
				synth.scale = synth.scales[this.sequence.notes[this.note].scale || 'All Notes'];
				synth.chord = synth.chords[this.sequence.notes[this.note].chord || 'Note'];
				synth.setNote(false, this.sequence.notes[this.note].note || 0);
				++this.note >= this.sequence.notes.length && (this.note = 0);
				this.switchingNote = false;
			}
		}
	};
})
.factory('autoupdater', function() {
	var fs = require('fs'),
		path = require('path'),
		https = require('https'),
		packagePath = path.join(process.platform === 'darwin' ? path.join(process.cwd(), '..') : path.dirname(process.execPath), 'package.nw'),
		versionCompare = function(left, right) {
			if(typeof left + typeof right !== 'stringstring') return false;

			var a = left.split('.'),
				b = right.split('.'),
				i = 0, len = Math.max(a.length, b.length);

			for(; i < len; i++) {
				if((a[i] && !b[i] && parseInt(a[i]) > 0) || (parseInt(a[i]) > parseInt(b[i]))) return 1;
				else if ((b[i] && !a[i] && parseInt(b[i]) > 0) || (parseInt(a[i]) < parseInt(b[i]))) return -1;
			}

			return 0;
		};

	return {
		currentVersion: JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'))).version,
		run: function() {
			var self = this;
			https.get({
				host: 'api.github.com',
				headers: {'user-agent': 'LightSynth'},
				path: '/repos/danielesteban/LightSynth/releases'
			}, function(res) {
				var releases = '';
				res.setEncoding('utf-8');
				res.on('data', function(chunk) {
					releases += chunk;
				});
				res.on('end', function() {
					try {
						releases = JSON.parse(releases);
					} catch(e) {
						return;
					}
					var release = releases[0];
					if(!release || versionCompare(self.currentVersion, release.tag_name.substr(1)) >= 0) return;
					release.assets.forEach(function(asset) {
						if(asset.name === 'LightSynth-' + process.platform + '.nw') {
							https.get(asset.browser_download_url, function(res) {
								https.get(res.headers.location, function(res) {
									var data;
									res.on('data', function(chunk) {
										data = data ? Buffer.concat([data, chunk]) : chunk;
									});
									res.on('end', function() {
										if(process.platform === 'darwin') {
											new (require('adm-zip'))(data).extractAllTo(process.cwd(), true);
											var plist = path.join(process.cwd(), '..', '..', 'Info.plist');
											fs.writeFileSync(plist, fs.readFileSync(plist, 'utf-8').replace(/<key>CFBundleShortVersionString<\/key>\n\t<string>((.*)\.(.*)\.(.*))<\/string>/, '<key>CFBundleShortVersionString<\/key>\n\t<string>' + release.tag_name.substr(1) + '<\/string>'));
										} else fs.writeFileSync(packagePath, data);
										alert('LightSynth has been updated to ' + release.tag_name + '\nPlease restart the application.');
										require('nw.gui').App.quit();
									});
								});
							});
						}
					});
				});
			});
		}
	};
});
