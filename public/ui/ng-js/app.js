/**
 * Created by nikit on 3/14/15.
 */
angular.module('TripPlanner', [
    'ngRoute',
    'ngCookies',
    'ngMd5',
    'TripPlanner.models',
    'TripPlanner.controllers',
    'TripPlanner.services'
]).config(['$routeProvider',
    function($routeProvider) {
        $routeProvider.
            when('/login', {
                templateUrl: 'partials/login.html',
                controller: 'loginCtrl'
            }).
            when('/home', {
                templateUrl: 'partials/home.html',
                controller: 'homeCtrl'
            }).
            when('/trips', {
                templateUrl: 'partials/addtrips.html',
                controller: 'tripCtrl'
            }).
            when('/trips/:id', {
                templateUrl: 'partials/edittrips.html',
                controller: 'tripCtrl'
            }).
            otherwise({
                redirectTo: '/login'
            });
    }]);