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
                templateUrl: 'pages/login.html',
                controller: 'loginCtrl'
            }).
            when('/signup', {
                templateUrl: 'pages/signup.html',
                controller: 'loginCtrl'
            }).
            when('/home', {
                templateUrl: 'pages/home.html',
                controller: 'homeCtrl'
            }).
            when('/trips', {
                templateUrl: 'pages/addtrips.html',
                controller: 'tripCtrl'
            }).
            when('/posts', {
                templateUrl: 'pages/posts.html',
                controller: 'postsCtrl'
            }).
            when('/people', {
                templateUrl: 'pages/people.html',
                controller: 'peopleCtrl'
            }).
            when('/profile', {
                templateUrl: 'pages/profile.html',
                controller: 'profileCtrl'
            }).
            when('/profile/:id', {
                templateUrl: 'pages/profile.html',
                controller: 'profileCtrl'
            }).
            when('/friends', {
                templateUrl: 'pages/people.html',
                controller: 'friendsCtrl'
            }).
            when('/friends/:id', {
                templateUrl: 'pages/people.html',
                controller: 'friendsCtrl'
            }).
            when('/trips/:id', {
                templateUrl: 'pages/edittrips.html',
                controller: 'tripCtrl'
            }).
            when('/search/:query', {
                templateUrl: 'pages/search.html',
                controller: 'searchCtrl'
            }).
            otherwise({
                redirectTo: '/login'
            });
    }]);