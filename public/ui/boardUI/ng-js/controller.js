var app = angular.module('TripPlanner.controllers', []);

var $rootScope;

app.controller('rootCtrl', function($scope, $location, interfaceService, $trips, confService, $people, authService, sessService) {
    $rootScope = $scope;
    confService.loadConf(function(conf) {
        $scope.name = conf.ver.name;
        $scope.version = conf.ver.version;
        $scope.desc = conf.ver.desc;
        $scope.dev = conf.ver.dev;
    });

    $scope.user = authService.getUser();
    $scope.page = sessService.getSession('page');


    $scope.logout = function() {
        authService.logout();
        $scope.user = null;
        $trips.clearTrips();
        $people.clearFriends();
        $location.path('/login');
    };

    $scope.home = function (id, redirect) {
        if(!id) id = '';
        this.clearNav();
        this.pg_home = "active";
        sessService.setSession('page', 'home/'+id);
        if(redirect) $location.path('/home/'+id);
    };

    $scope.login = function () {
        this.clearNav();
        this.pg_login = "active";
        sessService.setSession('page', 'login');
        $location.path('/login');
    };

    $scope.profile = function (id, redirect) {
        if(!id) id = '';
        this.clearNav();
        this.pg_profile = "active";
        sessService.setSession('page', 'profile/'+id);
        if(redirect) $location.path('/profile/'+id);
    };
    $scope.trips = function (id, redirect) {
        if(!id) id = '';
        this.clearNav();
        this.pg_trip = "active";
        sessService.setSession('page', 'trips/'+id);
        if(redirect) $location.path('/trips/'+id);
    };

    $scope.people = function (id, redirect) {
        if(!id) id = '';
        this.clearNav();
        this.pg_people = "active";
        sessService.setSession('page', 'people/'+id);
        if(redirect) $location.path('/people/'+id);
    };

    $scope.friends = function (id, redirect) {
        if(!id) id = '';
        this.clearNav();
        this.pg_friends = "active";
        sessService.setSession('page', 'friends/'+id);
        if(redirect) $location.path('/friends/'+id);
    };

    $scope.posts = function (id, redirect) {
        if(!id) id = '';
        this.clearNav();
        this.pg_posts = "active";
        sessService.setSession('page', 'posts/'+id);
        if(redirect) $location.path('/posts/'+id);
    };

    $scope.profile = function (id, redirect) {
        if(!id) id = '';
        this.clearNav();
        this.pg_profile = "active";
        sessService.setSession('page', 'profile/'+id);
        if(redirect) $location.path('/profile/'+id);
    };

    $scope.searchQuery = function (id, redirect) {
        if(!id) id = '';
        this.clearNav();
        this.pg_search = "active";
        sessService.setSession('page', 'search/'+id);
        if(redirect) $location.path('/search/'+id);
    };

    $scope.clearNav = function () {
        delete this.pg_home;
        delete this.pg_login;
        delete this.pg_profile;
        delete this.pg_trip;
        delete this.pg_people;
        delete this.pg_friends;
        delete this.pg_posts;
        delete this.pg_profile;
        delete this.pg_search;
    };

    $scope.searchKey = '';
    $scope.search = function() {
        var page = sessService.getSession('page').split('/');
        if(page[0] == 'search') {
            page[0] = page[1].split('-')[0];
            var srk = page[1].split('-')[1];
            if(!$scope.searchKey) {
                $scope.searchKey = '';//page[1].split('-')[1];
            }
        }
        $location.path('/search/'+page[0]+"-"+$scope.searchKey);
    };

    if($scope.page) {
        var path = $scope.page.split('/');
        $scope[path[0]](path.splice(1, path.length).join('/'), true);
    } else
        $scope.login();

});

app.controller('searchCtrl', function($scope, $routeParams, $users, $people, $trips, peopleService, pingerService) {
    var query = $routeParams.query.split('-');

    if(!$rootScope.user) {
        $rootScope.login();
    } else
        $rootScope.searchQuery($routeParams.query);

    $scope.searchHeader = $routeParams.query;
    $scope.posts = [];
    $scope.trips = [];
    $scope.tripsters = [];
    $scope.friends = [];


    function filterTrips (trips, query) {
        var filtered = [];
        var reg = new RegExp(query, 'ig');
        for(var t in trips) {
            if(reg.test(trips[t].dest) || reg.test(trips[t].comments))
                filtered.push(trips[t]);
        }
        return filtered;
    }

    function filterUsers (users, query) {
        var filtered = [];
        var reg = new RegExp(query, 'ig');
        for(var t in users) {
            if(reg.test(users[t].name))
                filtered.push(users[t]);
        }
        return filtered;
    }

    if(query[0] == 'home') {
        $scope.trips = filterTrips($trips.getTripList(), query[1]);
        $scope.searchHeader = 'Trips';
        if($scope.trips.length == 0) {
            pingerService.reloadPeerData(function() {
                $scope.trips = filterTrips($trips.getTripList(), query[1]);
            });
        }
    }

    if(query[0] == 'posts') {
        $scope.posts = filterTrips($trips.getPostsList(), query[1]);
        $scope.searchHeader = 'Posts';
        if($scope.posts.length == 0) {
            pingerService.reloadPeerData(function() {
                $scope.posts = filterTrips($trips.getPostsList(), query[1]);
            });
        }
    }

    if(query[0] == 'friends') {
        $scope.friends = filterUsers($people.getFriendList(), query[1]);
        $scope.searchHeader = 'Friends';
        if($scope.friends.length == 0) {
            pingerService.reloadPeerData(function() {
                $scope.friends = filterUsers($people.getFriendList(), query[1]);
            });
        }
    }

    $scope.isValidDateRange = function(trip) {
        var dates = getDatesString($trips.getTripList());
        var checkDates = getDatesString([trip]);
        var contains = false;
        for(var d in checkDates) {
            if(dates.indexOf(checkDates[d]) != -1)
                contains = true;
        }
        return !contains;
    };

    $scope.isAccessible = function(trip) {
        var accessible = trip.access == 'public';
        if(trip.access == 'friends') {
            var fids = $people.getFriendIdList();
            if(fids.indexOf(trip.owner._id) != -1)
                accessible = true;
        }
        return accessible;
    };

    if(query[0] == 'people') {
        var request = new Request();
        $scope.searchHeader = 'Tripsters';
        request.body = {};
        request.success = function(people) {
            var friends = $people.getFriendIdList();
            for(var p in people) {
                if(friends.indexOf(people[p]._id) != -1) {
                    people[p].isFriend = true;
                }
            }
            $scope.tripsters = filterUsers(people, query[1]);
        };
        request.error = function(err) {
            $scope.err = err;
        };
        peopleService.getTripsters(request);
    }

    $scope.unFriend = function(person, index) {
        request.body = person;
        request.success = function (friend) {
            $scope.friends = $people.removeFriendById(person._id);
        };
        request.error = function (err) {
            $scope.err = err;
        };
        peopleService.removeFriend(request);
    };

    $scope.unjoinTrip = function(trip) {
        request.body = trip;
        request.success = function (res) {
            $trips.updatePosts(res);
            $trips.removeTripById(res._id);
            if($scope.trips.length > 0)
                $scope.trips = $trips.getTripList();
            else
                $scope.posts = $trips.getPostsList();

        };
        request.error = function(err) {
            $scope.err = err;
        };

        tripService.unjoinTrip(request);
    };

    $scope.requestFriend = function (tripster) {
        request.body = tripster;

        request.success = function (tripster) {
            console.log(tripster);
        };

        request.error = function (err) {
            $scope.err = err;
        };

        peopleService.addFriend(request);
    };

    $scope.isOwner = function(trip) {
        if(!$rootScope.user)
            return false;
        var contains = false;
        for(var u in trip.users) {
            if(trip.users[u]._id == $rootScope.user._id) {
                contains = true;
                break;
            }
        }

        return {owned: $rootScope.user._id == trip.owner._id, joined: contains};
    };

    $scope.getLength = function (trip) {
        return getLength(trip);
    };

    $scope.getPercComplete = function(trip) {
        return getPercComplete(trip);
    };

    $scope.statusType = function (pending) {
        return statusType(pending);
    };

});

app.controller('loginCtrl', function($scope, $location, interfaceService, $users, md5, userService, authService) {

    if($rootScope.user) {
        $rootScope.posts(null, true);
    }

    $scope.newUser = $users.formUser();
    $scope.loginUser = $users.getUser();

    var request = new Request();

    $scope.login = function () {
        var usr = {};
        usr.username = $scope.loginUser.username;
        usr.password = md5.createHash($scope.loginUser.password || '');
        request.body = usr;
        request.success = function (user) {
            $rootScope.user = user;
            $rootScope.posts(null, true);
        };

        request.error = function (err) {
            $rootScope.logout();
            $scope.err = err;
        };

        authService.login(request);
    };

    $scope.register = function () {

        try {
            $users.regValidate($scope.newUser);
        } catch(err) {
            $scope.err = err;
            interfaceService.bubbleError();
            return;
        }

        request.body = $scope.newUser;
        request.success = function (user) {
            $rootScope.user = user;
            $rootScope.posts(null, true);
        };

        request.error = function (err) {
            $scope.err = err;
            console.log(err);
            interfaceService.bubbleError($scope);
        };

        userService.createUser(request);
    };

    $scope.showReg = function () {
        $scope.regForm = true;
    };

    $scope.showLogin = function () {
        delete $scope.regForm;
        $scope.newUser = $users.formUser();
    };

});

app.controller('homeCtrl', function ($scope, interfaceService , $trips, tripService) {
    if(!$rootScope.user) {
        $rootScope.login();
    } else
        $rootScope.home();
    var request = new Request();
    $scope.filter = $trips.searchFilter();


    //interfaceService.loadDatePicker($scope);
    //interfaceService.setDropDown();

    $scope.loadTrips = function () {
        request.body = null;
        request.success = function (trips) {
            $scope.tripList = trips;
            interfaceService.styleTable();
        };
        request.error = function(err) {
            $scope.err = err;
            interfaceService.bubbleError();
        };

        request.filter = $scope.filter;
        tripService.getTrips(request);
    };

    $scope.deleteTrip = function (id) {
        request.body = {_id: id};
        request.success = function(trip) {
            $trips.removeTripById(id);
            $scope.tripList = $trips.getTripList();
        };
        request.error = function(err) {
            $scope.err = err;
            interfaceService.bubbleError();
        };

        tripService.deleteTrip(request);
    };

    $scope.searchTrips = function () {
        request.body = null;
        request.success = function (trips) {
            $scope.tripList = trips;
        };
        request.err = function(err) {
            $scope.err = err;
            interfaceService.bubbleError();
        };

        request.filter = $scope.filter;
        tripService.getTrips(request);
    };

    $scope.filterMonth = function () {
        $scope.filter.start = $scope.startDate;
        $scope.filter.end = $scope.endDate;
        $scope.searchTrips();
    };

    $scope.isOwner = function(trip) {
        if(!$rootScope.user)
            return false;
        var contains = false;
        for(var u in trip.users) {
            if(trip.users[u]._id == $rootScope.user._id) {
                contains = true;
                break;
            }
        }

        return {owned: $rootScope.user._id == trip.owner._id, joined: contains};
    };

    $scope.unjoinTrip = function(trip) {
        request.body = trip;
        request.success = function (res) {
            $trips.updatePosts(res);
            $trips.removeTripById(res._id);
            $scope.tripList = $trips.getTripList();
        };
        request.error = function(err) {
            $scope.err = err;
        };

        tripService.unjoinTrip(request);
    };

    $scope.printTravelPlan = function () {
        interfaceService.printTable();
    };

    $scope.getLength = function (trip) {
        return getLength(trip);
    };

    $scope.getPercComplete = function(trip) {
        return getPercComplete(trip);
    };

    $scope.statusType = function (pending) {
        return statusType(pending);
    };

    $scope.tripList = $trips.getTripList();
    if($scope.tripList.length == 0) {
        $scope.loadTrips();
    } else {
        interfaceService.styleTable();
    }
});

app.controller('tripCtrl', function ($scope, $trips, $routeParams, interfaceService, tripService) {

    if(!$rootScope.user) {
        $rootScope.login();
    } else
        $rootScope.trips($routeParams.id);
    var request = new Request();

    var startDate = new Date();
    if($routeParams.id) {
        $scope.trip = $trips.getTripById($routeParams.id);
        if(!$scope.trip) {
            request.body = {_id: $routeParams.id};
            request.success = function (trip) {
                $scope.trip = trip.clone();
                var tripDate = new Date($scope.trip.start);
                if(startDate >= tripDate)
                    startDate = tripDate;
            };
            request.err = function (err) {
                $scope.err = err;
            };
            tripService.getTrip(request);
        } else {
            $scope.trip = $scope.trip.clone();
            var tripDate = new Date($scope.trip.start);
            if(startDate >= tripDate)
                startDate = tripDate;
        }
    }
    else
        $scope.trip = $trips.getTrip();

    $scope.loadDatePicker = function(start) {
        var tripList = $trips.getTripList();

        if(tripList.length == 0) {
            var req = new Request(null,
                function (trips) {
                    tripList = trips;
                    interfaceService.loadDatePicker($scope, start, spliceTrip(tripList));
                },function(err) {
                    $scope.err = err;
                    interfaceService.bubbleError();
                });

            req.filter = $scope.filter;
            tripService.getTrips(req);
        } else
            interfaceService.loadDatePicker($scope, start, spliceTrip(tripList));
    };

    function spliceTrip(tripList) {
        var trips = [];
        for(var t in tripList) {
            if (tripList[t]._id != $routeParams.id) {
                trips.push(tripList[t].clone());
            }
        }
        return trips;
    }

    $scope.createTrip = function () {
        try {
            $trips.validate($scope.trip);
        } catch(err) {
            $scope.err = err;
            interfaceService.bubbleError();
            return;
        }

        request.body = $scope.trip;
        request.success = function (trip) {
            $trips.addTrip(trip);
            $rootScope.home(null, true);
        };
        request.error = function(err) {
            $scope.err = err;
            interfaceService.bubbleError();
        };

        tripService.createTrip(request);
    };

    $scope.editTrip = function () {
        try {
            $trips.validate($scope.trip);
        } catch(err) {
            $scope.err = err;
            interfaceService.bubbleError();
            return;
        }
        request.body = $scope.trip;
        request.success = function (trip) {
            $trips.editTrip($scope.trip._id, trip);
            $rootScope.home(null, true);
        };
        request.error = function(err) {
            $scope.err = err;
            interfaceService.bubbleError();
        };

        tripService.updateTrip(request);
    };
    $scope.loadDatePicker(startDate);
    $scope.advancedSearch = [];
    interfaceService.setDropDown();
    interfaceService.setDestAutoComplete($scope);
});

app.controller('requestsCtrl', function ($scope, $people, $routeParams, peopleService, $interval, tripService, pingerService) {

    $scope.requests = [];
    var request = new Request();
    request.body = {};
    request.success = function(friends) {
        $scope.requests = friends;
    };
    request.error = function(err) {
        $scope.err = err;
    };

    var pinger;

    $scope.fetchRequests = function () {
        peopleService.getFriendRequests(request);
    };

    $scope.acceptRequest = function (person) {
        var req = new Request();
        req.body = person;
        req.success = function (data) {
            person.accepted = true;
            pingerService.reloadPeerData();
        };
        req.error = function (err) {
            $scope.err = err;
        };
        peopleService.acceptRequest(req);
    };

    $scope.deleteRequest = function (person) {
        var req = new Request();
        req.body = person;
        req.success = function (data) {
            person.rejected = true;
            pingerService.reloadPeerData();
        };
        req.error = function (err) {
            $scope.err = err;
        };
        peopleService.removeRequest(req);
    };

    if(!pinger) {
        pinger = $interval(function(){
            if($rootScope.user) {
                pingerService.reloadPeerData();
            }
        }, 30000);
    }

    $people.addRequestWatcher(function(requests) {
        $scope.requests = requests;
        if(requests.length > 0) {
            $scope.newNotif = true;
        } else {
            if($scope.newNotif)
                delete $scope.newNotif;
        }
    });

    pingerService.reloadPeerData();
});

app.controller('peopleCtrl', function ($scope, $people, $routeParams, peopleService) {
    if(!$rootScope.user) {
        $rootScope.login();
    } else
        $rootScope.people();

    $scope.people = [];
    $scope.peopleHeader = "Tripsters";
    $scope.tr = true;

    var request = new Request();
    request.body = {};
    request.success = function(people) {
        var friends = $people.getFriendIdList();
        for(var p in people) {
            if(friends.indexOf(people[p]._id) != -1) {
                people[p].isFriend = true;
            }
        }
        $scope.people = people;
    };
    request.error = function(err) {
        $scope.err = err;
    };
    peopleService.getTripsters(request);

    $scope.requestFriend = function (tripster) {
        request.body = tripster;

        request.success = function (tripster) {
            console.log(tripster);
        };

        request.error = function (err) {
            $scope.err = err;
        };

        peopleService.addFriend(request);
    };

    $people.addFriendsWatcher(function(friends) {
        var fids = $people.getFriendIdList();
        for(var p in $scope.people) {
            if(fids.indexOf($scope.people[p]._id) != -1) {
                $scope.people[p].isFriend = true;
            }
        }
    });
});

app.controller('friendsCtrl', function ($scope, $people, $routeParams, peopleService) {
    if(!$rootScope.user) {
        $rootScope.login();
    } else
        $rootScope.friends();

    $scope.peopleHeader = "Friends";
    $scope.fr = true;

    var request = new Request();

    $scope.people = $people.getFriendList();
    if($scope.people.length == 0) {
        request.body = {};
        request.success = function (friends) {
            $scope.people = friends;
        };
        request.error = function (err) {
            $scope.err = err;
        };
        peopleService.getFriends(request);
    }

    $scope.unFriend = function(person, index) {
        request.body = person;
        request.success = function (friend) {
            $scope.people = $people.removeFriendById(person._id);
        };
        request.error = function (err) {
            $scope.err = err;
        };
        peopleService.removeFriend(request);
    };

    $people.addFriendsWatcher(function(friends) {
        $scope.people = friends;
    });
});

app.controller('postsCtrl', function ($scope, $people, $trips, $routeParams, peopleService, tripService, interfaceService, pingerService, flimageService) {
    if(!$rootScope.user) {
        $rootScope.login();
    } else
        $rootScope.posts();
    var request = new Request();
    $scope.loadTrips = function () {
        request.body = null;
        request.success = function (trips) {
            $scope.tripList = trips;
            interfaceService.styleTable();
        };
        request.error = function(err) {
            $scope.err = err;
            interfaceService.bubbleError();
        };

        request.filter = $scope.filter;
        tripService.getPostedTrips(request);
    };

    $scope.joinTrip = function(trip) {
        request.body = trip;
        request.success = function (res) {
            $trips.addTrip(res);
            $trips.updatePosts(res);
            $scope.tripList = $trips.getPostsList();
        };
        request.error = function(err) {
            $scope.err = err;
        };

        tripService.joinTrip(request);
    };

    $scope.unjoinTrip = function(trip) {
        request.body = trip;
        request.success = function (res) {
            $trips.updatePosts(res);
            $trips.removeTripById(res._id);
            $scope.tripList = $trips.getPostsList();
        };
        request.error = function(err) {
            $scope.err = err;
        };

        tripService.unjoinTrip(request);
    };

    $scope.getLength = function (trip) {
        return getLength(trip);
    };

    $scope.getPercComplete = function(trip) {
        return getPercComplete(trip);
    };

    $scope.statusType = function (pending) {
        return statusType(pending);
    };

    $scope.isOwner = function(trip) {
        if(!$rootScope.user)
            return false;
        var contains = false;
        for(var u in trip.users) {
            if(trip.users[u]._id == $rootScope.user._id) {
                contains = true;
                break;
            }
        }

        return {owned: $rootScope.user._id == trip.owner._id, joined: contains};
    };

    $scope.isValidDateRange = function(trip) {
        var dates = getDatesString($trips.getTripList());
        var checkDates = getDatesString([trip]);
        var contains = false;
        for(var d in checkDates) {
            if(dates.indexOf(checkDates[d]) != -1)
                contains = true;
        }
        return !contains;
    };

    $scope.isAccessible = function(trip) {
        var accessible = trip.access == 'public';
        if(trip.access == 'friends') {
            var fids = $people.getFriendIdList();
            if(fids.indexOf(trip.owner._id) != -1)
                accessible = true;
        }
        return accessible;
    };

    $scope.getTripImage = function (trip) {
        flimageService.getImageUrl(trip);
    };

    $trips.addPostWatcher(function (trips) {
        $scope.tripList = trips;
    });

    $scope.tripList = $trips.getPostsList();
    if($scope.tripList.length == 0)
        pingerService.reloadPeerData();
});

app.controller('profileCtrl', function ($scope, $people, $trips, $routeParams, peopleService, userService, flimageService) {
    if(!$rootScope.user) {
        $rootScope.login();
    } else
        $rootScope.profile($routeParams.id);
    var id = $routeParams.id;
    if(!id) {
        id = $rootScope.user._id;
        $scope.rootUser = $rootScope.user;
    } else if(id == $rootScope.user._id) {
        $scope.rootUser = $rootScope.user;
    }

    $scope.defaultPicture = 'test';

    var usr = function(id, name, username, address, dob, phone, profilePic) {
        this._id = id;
        this.name = name;
        this.username = username;
        this.address = address;
        this.dob = new Date(dob).addDays(1).toDateString();
        this.phone = phone;
        this.profilePic = profilePic;
    };

    usr.prototype.clone = function () {
        return new usr(
            this._id,
            this.name,
            this.username,
            [{add1: this.address[0].add1, add2: this.address[0].add2, city: this.address[0].city, state: this.address[0].state, zip: this.address[0].zip}],
            this.dob,
            this.phone,
            this.profilePic
        );
    };

    userService.getUserById(new Request({_id: id}, function(response) {
        $scope.usr = new usr(response._id, response.name, response.username, response.address, response.dob, response.phone, response.profilePic);
        if(response._id == $rootScope.user._id)
            $scope.usr.apiKey = response.apiKey;
    }, function(err){$scope.err = err}));

    $scope.editUserDetails = function() {
        $scope.editUser = $scope.usr.clone();
        $scope.editUser.dob = new Date($scope.editUser.dob);
    };

    $scope.clearEdit = function() {
        delete $scope.editUser;
    };

    $scope.isRootUser = function () {
        return $scope.usr._id == $rootScope.user._id;
    };

    $scope.isFriend = function (usr) {
        var fids = $people.getFriendIdList();
        if(!usr)
            return false;
        return fids.indexOf(usr._id) >= 0;
    };

    $scope.requestFriend = function (tripster) {
        if($scope.isFriend(tripster))
            return;
        var request = new Request();
        request.body = tripster;

        request.success = function (tripster) {
            /* wait for approval*/
        };

        request.error = function (err) {
            $scope.err = err;
        };

        peopleService.addFriend(request);
    };

    $scope.uploadPicture = function () {
        var Form = document.getElementById("profilePicture");
        var request = new XMLHttpRequest();
        request.open("POST", "http://tripplanner-cs6240nwaghela.rhcloud.com/users/profilePic", true);

        request.onload = function(oEvent) {
            if (request.status == 200) {
                console.log('uploaded');
            } else {
                console.log('failed!');
            }
        };

        request.onreadystatechange = function() {
            if(request.readyState == 4) {
                var response = JSON.parse(request.responseText);
                if(response.err) {
                    $scope.err = response.err;
                } else {
                    response  = response.body;
                    $scope.usr = new usr(response._id, response.name, response.username, response.address, response.dob, response.phone, response.profilePic);
                }
            }
        };


        var formData = new FormData(Form);
        formData.append('apiKey', $scope.usr.apiKey);
        request.send(formData);
    };

    $scope.selectImage = function () {
        var doc = $('#picture');
        doc.click();
    };

    $scope.save = function () {

        userService.updateUser(new Request($scope.editUser, function(response){
            $scope.usr = new usr(response._id, response.name, response.username, response.address, response.dob, response.phone, response.profilePic);
            $scope.clearEdit();
        }, function(err){
            $scope.err = err;
        }));
    }
});

function getLength(trip) {
    if(!trip) return "N/A";
    var ed = new Date(trip.end);
    ed.setHours(0,0,0,0);
    var sd = new Date(trip.start);
    sd.setHours(0,0,0,0);
    var today = new Date();
    today.setHours(0,0,0,0);

    var days = getDays(ed, sd) + 1;

    if(trip.pending === "plane") {
        days = days - (getDays(ed, today));
        /*
        if(days%10 === 1 && days%100 != 11)
            days = days+'st';
        else if(days%10 === 2 && days%100 != 12)
            days = days+'nd';
        else if(days%10 === 3 && days%100 != 13)
            days = days+'rd';
        else
            days = days+'th';
            */
        days = "day "+days;
    }

    if(isNaN(days))
        return days;
    else {
        if (days === 1)
            return days + " day";
        else
            return days + " days";
    }
}

function getPercComplete(trip) {
    var totalDays = getDays(new Date(trip.end), new Date(trip.start)) + 1;
    var days = totalDays - (getDays(new Date(trip.end), new Date()) + 1);
    days = days/totalDays;
    return Math.round(days*100);
}

function statusType(pending) {
    if(pending === "ok")
        return "success";
    if(pending === "briefcase")
        return "alert";
    if(pending === "plane")
        return "warn";
    return "primary";
}