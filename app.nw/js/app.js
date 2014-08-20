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
});
