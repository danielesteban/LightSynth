'use strict';

/* App & Routes */
angular.module('LightSynth', [
	'ngAnimate',
	'ngRoute',
	'LightSynth.controllers',
	'LightSynth.directives',
	'LightSynth.filters',
	'LightSynth.services'
])
.config(function($locationProvider, $routeProvider) {
	$routeProvider.when('/', {controller: 'connect', templateUrl: 'views/connect.html'});
	$routeProvider.when('/main', {controller: 'main', templateUrl: 'views/main.html'});
	$routeProvider.otherwise({redirectTo: '/'});
})
.run(function($window) {
	/* DevTools Keyboard Handler */
	var nwWindow = require('nw.gui').Window.get();
	$window.addEventListener('keydown', function(e) {
		switch(e.keyCode) {
			case 187:
				e.altKey && e.ctrlKey && e.metaKey && e.shiftKey && nwWindow.showDevTools();
		}
	});
})
.run(function(autoupdater) {
	/* Run the autoupdater */
	autoupdater.run();
});

