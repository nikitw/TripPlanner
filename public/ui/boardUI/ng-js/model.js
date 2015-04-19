/**
 * Created by nikit on 3/14/15.
 */
var models = angular.module('TripPlanner.models', []);

models.factory('$users', function() {
    var User = function (id, name, username, apiKey, profilePic) {
        this._id = id;
        this.name = name;
        this.username = username;
        this.apiKey = apiKey;
        this.profilePic = profilePic;
        this.password = null;
        this.cPassword = null;
    };

    var users = {};

    users.getUser = function (userJson) {
        if(userJson) {
            return new User(
                userJson._id,
                userJson.name,
                userJson.username,
                userJson.apiKey,
                userJson.profilePic,
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

    users.regValidate = function (user) {
        if(user) {
            if(user.name && user.password && user.cPassword && user.username) {
                if(! /^[A-Za-z]{1}[A-Za-z0-9\.\-_]*[A-Za-z0-9]+\@[A-Za-z]{2}[A-Za-z0-9\.]*\.[A-Za-z]{3,5}$/.test(user.username) || /(\.){2,}/.test(user.username))
                    throw new Error('Invalid username, it should be a valid email address');
                if(! /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/.test(user.password))
                    throw new Error('Passwords must contain at least six characters, including uppercase, lowercase letters and numbers');
                if(user.password != user.cPassword)
                    throw new Error('Passwords did not match');
            } else {
                throw new Error('* marked fields are mandatory!');
            }
        } else {
            throw new Error('User handle not found. Refresh and try again!');
        }
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

models.factory('$trips', function(flimageService) {

    var Trip = function (id, dest, start, end, comment, pending, owner, users, access, img) {
        this._id = id;
        this.dest = dest;
        this.start = start;
        this.end = end;
        this.comment = comment;
        this.pending = pending;
        this.owner = owner;
        this.users = users;
        this.access = access;
        this.img = img;
    };

    Trip.prototype = {
        clone: function(){
            return new Trip(
                this._id,
                this.dest,
                this.start,
                this.end,
                this.comment,
                this.pending,
                this.owner,
                this.users,
                this.access,
                this.img
            );
        }
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
    today.setHours(0,0,0,0);
    var tripList = [];
    var posts = [];
    trips.pw = [];

    trips.getTrip = function (tripJson) {
        if(tripJson) {
            var pending = 0;
            var startdt = new Date(tripJson.start);
            var enddt = new Date(tripJson.end);
            var sdays = getDays(startdt, today);

            if(sdays > 0) {
                pending = sdays;
            } else if(sdays == 0) {
                pending = "briefcase";
            } else if(sdays < 0) {
                pending = "plane";
            }

            if(enddt < today){
                pending = "ok";
            }

            var t = new Trip(
                tripJson._id,
                tripJson.dest,
                startdt.toDateString(),
                enddt.toDateString(),
                tripJson.comment,
                pending,
                tripJson.owner,
                tripJson.users,
                tripJson.access,
                tripJson.img
            );

            return t
        } else {
            var trip = new Trip(null, null, null, null, null, null, null, [], 'public', null);
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

    trips.getPostedTrips = function (tripListJson) {
        posts = [];
        for(var t in tripListJson) {
            posts.push(trips.getTrip(tripListJson[t]));
        }

        trips.pw.forEach(function(callback) {
            callback(posts);
        });
        return posts;
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
        var contains = false;
        var postC = false;
        for(var t in tripList) {
            if(tripList[t]._id == trip._id) {
                contains = true;
                break;
            }
        }

        for(var t in posts) {
            if(posts[t]._id == trip._id) {
                postC = true;
                break;
            }
        }
        if(!contains)
            tripList.push(trip);

        if(!postC)
            posts.push(trip);
    };

    trips.editTrip = function(id, trip) {
        for(var t in tripList)
            if(tripList[t]._id == id) {
                tripList[t] = trip;
                return;
            }
    };

    trips.updatePosts =function (res) {
        for(var t in posts)
            if(posts[t]._id == res._id) {
                posts[t] = res;
                return;
            }
    };

    trips.clearTrips = function () {
        tripList = [];
        posts = [];
        trips.pw = [];
    };

    trips.getTripList = function () {
        tripList.sort(function (t1, t2) {
            return new Date(t1.start) - new Date(t2.start);
        });

        return tripList;
    };

    trips.getPostsList = function () {
        posts.sort(function (t1, t2) {
            return new Date(t1.start) - new Date(t2.start);
        });

        return posts;
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

    trips.addPostWatcher = function(callback) {
        trips.pw.push(callback);
    };

    return trips;
});

models.factory('$people', function() {
    var Tripster = function (id, name, email, trips, profilePic) {
        this._id = id;
        this.name = name;
        this.email = email;
        this.trips = trips;
        this.profilePic = profilePic;
    };

    var friends = [];
    var fidList = [];
    var ridList = [];
    var requests = [];

    var people = {};
    people.fw = [];
    people.rw = [];

    people.getTripster = function(tripsterJson) {
        return new Tripster(tripsterJson._id, tripsterJson.name, tripsterJson.username, tripsterJson.trips, tripsterJson.profilePic);
    };

    people.getTripsters = function(tripsterListJson) {
        var tripsters = [];
        for(var t in tripsterListJson) {
            tripsters.push(people.getTripster(tripsterListJson[t]));
        }
        return tripsters;
    };

    people.getRequests = function(tripsterListJson) {
        requests = [];
        ridList = [];
        for(var t in tripsterListJson) {
            requests.push(people.getTripster(tripsterListJson[t]));
            ridList.push(tripsterListJson[t]._id);
        }
        people.rw.forEach(function(callback) {
            callback(requests);
        });

        return requests;
    };

    people.getFriends = function(friendsJson) {
        friends = [];
        fidList = [];
        for(var f in friendsJson) {
            friends.push(people.getTripster(friendsJson[f]));
            fidList.push(friendsJson[f]._id);
        }

        people.fw.forEach(function(callback) {
            callback(friends);
        });

        return friends;
    };

    people.getFriendList = function() {
        return friends;
    };

    people.clearFriends = function () {
        friends = [];
        people.fw = [];
        people.rw = [];
    };

    people.removeFriend = function (index) {
        if(index) {
            friends.splice(index, 1);
        }
        return friends;
    };

    people.removeFriendById = function (id) {
        if(id) {
            for(var f in friends) {
                if(friends[f]._id == id){
                    friends.splice(f, 1);
                    break;
                }
            }
        }

        try {
            fidList.splice(fidList.indexOf(id), 1);
        } catch(err) {}

        people.fw.forEach(function(callback) {
            callback(friends);
        });

        return friends;
    };

    people.removeRequestById = function (id) {
        if(id) {
            for(var f in requests) {
                if(requests[f]._id == id){
                    requests.splice(f, 1);
                    break;
                }
            }
        }

        try {
            ridList.splice(ridList.indexOf(id), 1);
        } catch(err) {}

        people.rw.forEach(function(callback) {
            callback(requests);
        });

        return requests;
    };

    people.getFriendIdList = function () {
        return fidList;
    };

    people.getRequestIdList = function () {
        return ridList;
    };

    people.addFriendsWatcher = function (callback) {
        people.fw.push(callback);
    };

    people.addRequestWatcher = function (callback) {
        people.rw.push(callback);
    };

    return people;
});

var defResponseHandler = function (res) {
    console.log('No response handler specified for this event.\nRESPONSE: '+res);
};

var Request = function (body, success, error) {
    this.body = body;
    this.success = (success)? success : defResponseHandler;
    this.error = (error)? error : defResponseHandler;
};


function getDays(end, start) {
    return Math.round((end - start)/1000/60/60/24);
}