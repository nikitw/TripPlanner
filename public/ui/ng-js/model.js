/**
 * Created by nikit on 3/14/15.
 */
var models = angular.module('TripPlanner.models', []);

models.factory('$users', function() {
    var User = function (name, username, apiKey) {
        this.name = name;
        this.username = username;
        this.apiKey = apiKey;
        this.password = null;
        this.cPassword = null;
    };

    var users = {};

    users.getUser = function (userJson) {
        if(userJson) {
            return new User(
                userJson.name,
                userJson.username,
                userJson.apiKey,
                userJson.trips
            );
        } else {
            return new User(null,null,null);
        }
    };

    users.formUser = function () {
        var emptyUser = new User();
        emptyUser.dob = undefined;
        emptyUser.address = [{
            add1 : null,
            add2 : null,
            city : null,
            state: null,
            zip  : null
        }];
        emptyUser.phone = undefined;

        return emptyUser;
    };

    users.validate = function (user) {
        if(user) {
            if(user.name && user.password && user.dob && user.cPassword && user.username && user.address[0].zip && user.address[0].city && user.address[0].state) {
                if(! /^[A-Za-z]{1}[A-Za-z0-9\.\-_]*[A-Za-z0-9]+\@[A-Za-z]{2}[A-Za-z0-9\.]*\.[A-Za-z]{3,5}$/.test(user.username) || /(\.){2,}/.test(user.username))
                    throw new Error('Invalid username, it should be a valid email address');
                if(! /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/.test(user.password))
                    throw new Error('Passwords must contain at least six characters, including uppercase, lowercase letters and numbers');
                if(user.password != user.cPassword)
                    throw new Error('Passwords did not match');
                if(! /^\d{5}(-\d{4})?(?!-)$/.test(user.address[0].zip))
                    throw new Error('Zip code should be numeric [5]');
                if(user.phone && ! /^[0-9]+$/.test(user.phone))
                    throw new Error('Phone number should be numeric');
            } else {
                throw new Error('* marked fields are mandatory!');
            }
        } else {
            throw new Error('User handle not found. Refresh and try again!');
        }
    };

    return users;
});

models.factory('$trips', function() {

    var Trip = function (id, dest, start, end, comment, pending) {
        this._id = id;
        this.dest = dest;
        this.start = start;
        this.end = end;
        this.comment = comment;
        this.pending = pending;
    };

    var Filter = function (keyword, start, end, pending) {
        this.keyword = keyword;
        this.start = start;
        this.end = end;
        this.pending = pending;
    };

    var filter = new Filter();
    var trips = {};
    var today = new Date();
    var tripList = [];

    trips.getTrip = function (tripJson) {
        if(tripJson) {
            var pending = 0;
            var startdt = new Date(tripJson.start);
            var enddt = new Date(tripJson.end);

            if(startdt < today && enddt >= today) {
                pending = "plane";
            } else if(startdt < today && enddt < today){
                pending = "ok";
            } else {
                pending = startdt - today;
                pending = Math.round(pending/1000/60/60/24);
                if(pending == 0)
                    pending = "briefcase";
            }

            return new Trip(
                tripJson._id,
                tripJson.dest,
                startdt.toDateString(),
                enddt.toDateString(),
                tripJson.comment,
                pending
            );
        } else {
            var trip = new Trip(null, null, null, null, null, null);
            delete trip._id;
            return trip;
        }
    };

    trips.getTrips = function (tripListJson) {
        tripList = [];
        for(var t in tripListJson) {
            tripList.push(trips.getTrip(tripListJson[t]));
        }
        return tripList;
    };

    trips.getTripById = function (id) {
        for(var t in tripList) {
            if(tripList[t]._id == id)
                return tripList[t];
        }
        return null;
    };

    trips.removeTripById = function (id) {
        for(var t in tripList)
            if(tripList[t]._id == id) {
                tripList.splice(t, 1);
                return;
            }
    };

    trips.addTrip = function (trip) {
        tripList.push(trip);
    };

    trips.editTrip = function(id, trip) {
        for(var t in tripList)
            if(tripList[t]._id == id) {
                tripList[t] = trip;
                return;
            }
    };

    trips.clearTrips = function () {
        tripList = [];
    };

    trips.getTripList = function () {
        tripList.sort(function (t1, t2) {
            return new Date(t1.start) - new Date(t2.start);
        });

        return tripList;
    };

    trips.searchFilter = function () {
        return filter;
    };

    trips.newFilter = function () {
        return new Filter();
    };

    trips.validate = function(trip) {
        if(trip) {
            if(trip.dest && trip.start && trip.end){
                if(trip.comment && !/^[A-Za-z0-9\._\-\,\;\:\!\s]+$/.test(trip.comment))
                    throw new Error('Comment should contain no special characters except [_ - . , : ; ! ]');
            } else
                throw new Error('Destination, start and end date are mandatory!');
        } else
            throw new Error('Undefined trip! [web client error]');
    };

    return trips;
});


var defResponseHandler = function (res) {
    console.log('No response handler specified for this event.\nRESPONSE: '+res);
};

var Request = function (body, success, error) {
    this.body = body;
    this.success = (success)? success : defResponseHandler;
    this.error = (error)? error : defResponseHandler;
};
