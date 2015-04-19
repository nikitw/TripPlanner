/**
 * Created by nikit on 3/16/15.
 */
var mongoose = require('mongoose');
var mongooseIp = process.env.OPENSHIFT_MONGODB_DB_HOST;

if(!mongooseIp)
    mongooseIp = 'localhost';
else
    mongooseIp = 'admin:_H2xw6G4KYGF@'+mongooseIp;

var db = mongoose.createConnection(mongooseIp, 'tripplanner');

var userSchema = require('../models/users');
var tripsSchema = require('../models/trips');
var ObjectId = require('mongoose').Types.ObjectId;
var md5 = require('MD5');

var User = db.model('users', userSchema);
var Trip = db.model('trips', tripsSchema);

var dbService = {
    login: function(username, password, callback) {
        User.findOne({'username': username, 'password': password}, 'profilePic name username apiKey', function(err, result) {
            if(err || !result)
                callback(null, new Error('no such user exists!'));
            else
                callback(result);
        });
    },

    createUser: function(q, callback) {
        try{
            validateUser(q);
        } catch (err){
            callback(null, err);
            return;
        }
        q.apiKey = md5(q.username + q.zip);
        q.password = md5(q.password);
        q.trips = [];
        User.findOne({'username': q.username}, 'profilePic name username apiKey', function(err, result) {
            if(err || !result) {
                console.log('new User created!');
                var userEntry = new User(q);
                userEntry.save(function(nerr, doc){
                    if(nerr || !doc)
                        callback(null, nerr);
                    else
                        callback(doc);
                });
            }
            else callback(null, new Error('user already exists!'));
        });
    },

    setProfilePic: function (apiKey, filename, callback) {
        getStoredUser(apiKey, "profilePic name username address phone dob", function(user, err) {
            if (!err) {
                user.profilePic = filename;
                user.save(function(err, doc) {
                    callback(user);
                });
            } else {
                callback(null, err)
            }
        });
    },

    updateUser: function(apiKey, update, callback) {
        getStoredUser(apiKey, "profilePic name username address phone dob", function(user, err) {
            if (!err) {
                if(!update._id) {
                    callback(null, new Error('invalid update operation, no id specified'));
                } else if(update._id != user._id) {
                    callback(null, new Error('invalid update operation. id mismatch, this is fatal!'));
                } else {
                    delete update._id;
                    for (var u in update) {
                        if (user[u]) {
                            if(u == 'dob') {
                                user[u] = new Date(update[u]);
                                continue;
                            }
                            user[u] = update[u];
                        }
                    }
                    user.save(function (err, doc) {
                        if (err || !doc)
                            callback(null, new Error('couldn\'t update user!'));
                        else
                            callback(doc);
                    });
                }
            } else callback(null, err);
        });
    },

    deleteUser: function(apiKey, callback) {
        var user = undefined;
        User.findOneAndRemove({'apiKey': apiKey}, function(err, doc) {
            if(err || !doc)
                callback(null, new Error('no such user exists!'));
            else
                callback(doc);
        });
    },

    getUser: function(apiKey, callback) {
        getStoredUser(apiKey, 'profilePic name username apiKey', callback(user, err));
    },

    getUserById: function(apiKey, uid, callback) {
        getStoredUser(apiKey, 'name username', function(user, err) {
            if(err)
                callback(null, err);
            else {
                var fields = 'profilePic name username address phone dob trips';
                if(user._id.toString() == uid)
                    fields += ' apiKey';
                User.findOne({_id: new ObjectId(uid)}, fields, function (err, usr) {
                    if (err)
                        callback(null, new Error("No such user exists with specified uid"));
                    else
                        callback(usr);
                });
            }
        });
    },

    getUsers: function(apiKey, callback) {
        getStoredUser(apiKey, 'profilePic name username trips', function(user, err) {
            if(err)
                callback(null, err);
            else
                User.find({_id: {$nin: [user._id]}}, 'profilePic name username trips', function(err, users) {
                    if(err || users.length == 0)
                        callback(null, new Error("No users found"));
                    else
                        callback(users);
                });
        });
    },

    getFriends: function(apiKey, callback) {
        getStoredUser(apiKey, 'profilePic name username friends', function(user, err) {
            if(err)
                callback(null, err);
            else
                User.find({_id: {$in : user.friends}}, 'profilePic name username trips',function(err, friends) {
                    if(err)
                        callback(null, new Error("friendlist not searchable"));
                    else
                        callback(friends);
                });
        });
    },

    getFriendRequests: function(apiKey, callback) {
        getStoredUser(apiKey, 'name username requests', function(user, err) {
            if(err)
                callback(null, err);
            else
                User.find({_id: {$in : user.requests}}, 'name username trips',function(err, friends) {
                    if(err)
                        callback(null, new Error("requestlist not searchable"));
                    else
                        callback(friends);
                });
        });
    },

    requestFriend: function(apiKey, id, callback) {
        getStoredUser(apiKey, 'name username requests', function(user, err) {
            if(err)
                callback(null, err);
            else
                User.findOne({_id: new ObjectId(id)}, 'name username friends requests',function(err, usr) {
                    if(err)
                        callback(null, new Error("requestlist not searchable"));
                    else {
                        var reqid = usr.requests.indexOf(user._id.toString());
                        var frid = user.requests.indexOf(id);
                        var fid = usr.friends.indexOf(user._id.toString());
                        if(reqid == -1 && fid == -1 && frid == -1) {
                            usr.requests.push(user._id);
                            usr.save(function (err, doc) {
                                callback(user);
                            });
                        } else
                            callback(null, new Error('Already requested!'));
                    }
                });
        });
    },

    acceptFriend: function(apiKey, id, callback) {
        getStoredUser(apiKey, 'name username requests friends', function(user, err) {
            var reqid = user.requests.indexOf(id);
            if(reqid == -1)
                callback(null, new Error('user did not request to be friends'));
            else if(err)
                callback(null, err);
            else
                User.findOne({_id: new ObjectId(id)}, 'name username friends',function(err, usr) {
                    if(err)
                        callback(null, new Error("no such user exists"));
                    else {
                        user.friends.push(id);
                        usr.friends.push(user._id);
                        user.requests.splice(reqid, 1);
                        user.save(function(err, doc) {
                            usr.save(function(err, sdoc) {
                                callback(sdoc);
                            });
                        });
                    }
                });
        });
    },


    unFriend: function(apiKey, id, callback) {
        getStoredUser(apiKey, 'name username friends', function(user, err) {
            var reqid = user.friends.indexOf(id);
            if(reqid == -1)
                callback(null, new Error('user is not a friend'));
            else if(err)
                callback(null, err);
            else
                User.findOne({_id: new ObjectId(id)}, 'name username friends requests',function(err, usr) {
                    if(err)
                        callback(null, new Error("can not find this user"));
                    else {
                        user.friends.splice(reqid, 1);
                        var uid = usr.friends.indexOf(user._id.toString());
                        usr.friends.splice(uid, 1);
                        usr.save(function (err, doc) {
                            user.save(function(err, docr) {
                                callback(usr);
                            });
                        });
                    }
                });
        });
    },

    removeRequest: function(apiKey, id, callback) {
        getStoredUser(apiKey, 'name username requests friends', function(user, err) {
            var reqid = user.requests.indexOf(id);
            if(reqid == -1)
                callback(null, new Error('user is not a friend'));
            else if(err)
                callback(null, err);
            else {
                user.requests.splice(reqid, 1);
                user.save(function(err, doc) {
                    callback(doc);
                });
            }
        });
    },

    getTrips: function(apiKey, filter, callback) {

        getUserTrips(apiKey, getFilter(filter), 1,function (trips, err){
            if(err)
                callback(null, err);
            else
                callback(trips);
        });
    },

    getPostedTrips: function(apiKey, callback) {

        getAllTrips(apiKey, 1,function (trips, err){
            if(err)
                callback(null, err);
            else
                callback(trips);
        });
    },

    createTrip: function(apiKey, trip, callback) {
        try{
            validateTrip(trip);
        } catch (err){
            callback(null, err);
            return;
        }
        getStoredUser(apiKey, null, function(user, err) {
            if(!err) {
                trip.owner = user._id;
                var tripEntry = new Trip(trip);

                tripEntry.save(function(nerr, tripDoc){
                    if(nerr || !tripDoc)
                        callback(null, nerr);
                    else {
                        user.trips.push(tripDoc._id);
                        user.save(function (err, doc) {
                            if (err || !doc)
                                callback(null, new Error('couldn\'t add a trip!'));
                            else {
                                var t = tripDoc.toObject();
                                User.findOne({_id: t.owner}, "name username trips", function(err, docu) {
                                    if(!err)
                                        t.owner = docu;
                                    User.find({_id: {$in: t.users}}, "name username trips", function(err, docs) {
                                        t.users = docs;
                                        callback(t);
                                    });
                                });
                            }
                        });
                    }
                });
            } else callback(null, err);
        });
    },

    updateTrip: function(apiKey, id, update, callback) {
        if(!id) {
            callback(null, new Error('trip not found!'));
            return;
        }
        try{
            validateTrip(update);
        } catch (err){
            callback(null, err);
            return;
        }

        getStoredUser(apiKey, null, function(user, err) {
            if(err)
                callback(null, err);
            else {
                Trip.findOne({'_id': new ObjectId(id)}, function(err, trip) {
                    if(err)
                        callback(null, err);
                    else if(trip.owner.toString() == user._id.toString()) {
                        update.owner = user._id;

                        if(update.access == 'private' && trip.users.length != 0){
                            update.users = [];
                            var ut = trip.toObject();
                            ut.owner = ut.users.pop();
                            delete ut._id;
                            var utScheme = new Trip(ut);
                            utScheme.save(function(err, utTrip) {
                                var utusers = utTrip.users;
                                utusers.push(utTrip.owner);
                                User.find({_id: {$in: utusers}}, function(err, docr){
                                    docr.forEach(function(docru, i, arr){
                                        docru.trips.splice(docru.trips.indexOf(trip._id), 1);
                                        docru.trips.push(utTrip._id);
                                        docru.save(function(err, uuser){
                                            /* created entry for new trip in every user */
                                        });
                                    });
                                });
                            });
                        }

                        var users = [];
                        for(var v in update.users){
                            users.push(update.users[v]._id);
                        }
                        update.users = users;

                        trip.update(update, function (err, doc) {
                            if (err || !doc)
                                callback(null, new Error('couldn\'t update trip!'));
                            else {
                                dbService.getTrip(apiKey, id, callback);
                            }
                        });
                    } else
                        callback(null, new Error('User is not authorized to modify this trip'));
                });
            }
        });

    },

    deleteTrip: function(apiKey, id, callback) {
        if(!id || id == 'null' || id == 'undefined') {
            callback(null, new Error('trip not found!'));
            return;
        }
        getStoredUser(apiKey, null, function(user, err) {
            if(!err) {
                Trip.findOne({'_id': new ObjectId(id)}, function(err, trip) {
                    if(err)
                        callback(null, err);
                    else if(trip.owner.toString() == user._id.toString()) {
                        user.trips.splice(user.trips.indexOf(id), 1);
                        user.save(function(err, doc) {
                            /* do nothing */
                        });
                        if(trip.users.length == 0) {
                            trip.remove(function (err, doc) {
                                if (err || !doc)
                                    callback(null, new Error('couldn\'t remove  trip!'));
                                else {
                                    callback(user);
                                }
                            });
                        } else {
                            trip.owner = trip.users.pop();
                            trip.save(function(err, doc) {
                                if(err)
                                    callback(null, err);
                                else
                                    callback(user);
                            });
                        }
                    } else
                        callback(null, new Error('User is not authorized to modify this trip'));
                });
            }
            else callback(null, err);
        });
    },

    getTrip: function(apiKey, id, callback) {
        if(!id) {
            callback(null, new Error('trip not found!'));
            return;
        }

        getStoredUser(apiKey, null, function(user, err) {
            if(!err) {
                Trip.findOne({'_id': new ObjectId(id)}, function(err, trip) {
                    if(!err) {
                        var t = trip.toObject();
                        User.findOne({_id: t.owner}, "name username trips", function(err, docu) {
                            if(!err)
                                t.owner = docu;
                            User.find({_id: {$in: trip.users}}, "name username trips", function(err, docs) {
                                t.users = docs;
                                callback(t);
                            });
                        });
                    }
                    else
                        callback(null, new Error('no such trip found'));
                });
            }
            else
                callback(null, err);
        });
    },

    joinTrip: function(apiKey, id, callback) {
        if(!id) {
            callback(null, new Error('trip not found!'));
            return;
        }
        getStoredUser(apiKey, null, function(user, err) {
            if(!err) {
                Trip.findOne({'_id': new ObjectId(id)}, function(err, trip) {
                    if(!err) {
                        if(trip.owner.toString() == user._id.toString()) {
                            callback(trip, new Error('you own this trip'));
                        } else {
                            if(trip.access != "private") {
                                if((trip.access == "friends" && user.friends.indexOf(trip.owner) != -1) || trip.access == 'public'){
                                    if(user.trips.indexOf(id) == -1) {
                                        user.trips.push(id);
                                        trip.users.push(user._id);
                                        var t = trip.toObject();
                                        trip.save(function (err, doc) {
                                            user.save(function(err, docr){
                                                User.findOne({_id: doc.owner}, "name username trips", function(err, docu) {
                                                    if(!err)
                                                        t.owner = docu;
                                                    User.find({_id: {$in: doc.users}}, "name username trips", function(err, docs) {
                                                        t.users = docs;
                                                        callback(t);
                                                    });
                                                });
                                            });
                                        });
                                    } else {
                                        callback(null, new Error('you already joined this trip'));
                                    }
                                } else {
                                    callback(null, new Error('this trip is marked friends only'));
                                }
                            } else
                                callback(null, new Error('this trip is marked private'));
                        }
                    } else
                        callback(null, new Error('no such trip found'));
                });
            }
            else
                callback(null, err);
        });
    },

    unjoinTrip: function(apiKey, id, callback) {
        if(!id) {
            callback(null, new Error('trip not found!'));
            return;
        }
        getStoredUser(apiKey, null, function(user, err) {
            if(!err) {
                Trip.findOne({'_id': new ObjectId(id)}, function(err, trip) {
                    if(!err) {
                        if(trip.owner.toString() == user._id.toString()) {
                            callback(trip, new Error('you own this trip, delete to leave this trip'));
                        } else {
                            if(user.trips.indexOf(id) != -1) {
                                user.trips.splice(user.trips.indexOf(id), 1);
                                trip.users.splice(trip.users.indexOf(user._id), 1);
                                var t = trip.toObject();
                                trip.save(function (err, doc) {
                                    user.save(function(err, docr){
                                        User.findOne({_id: doc.owner}, "name username trips", function(err, docu) {
                                            if(!err)
                                                t.owner =  docu;
                                            User.find({_id: {$in: doc.users}}, "name username trips", function(err, docs) {
                                                t.users = docs;
                                                callback(t);
                                            });
                                        });
                                    });
                                });
                            } else {
                                callback(null, new Error('you never joined this trip'));
                            }
                        }
                    } else
                        callback(null, new Error('no such trip found'));
                });
            }
            else
                callback(null, err);
        });
    }
};

function getStoredUser (apiKey, fields, callback) {

    if(!apiKey) callback(null, new Error('undefined apiKey'));
    if(fields) {
        User.findOne({'apiKey': apiKey}, fields, function (err, result) {
            if (!err && result)
                callback(result);
            else callback(null, new Error('no such user exists!'));
        });
    } else {
        User.findOne({'apiKey': apiKey}, function (err, result) {
            if (!err && result)
                callback(result);
            else callback(null, new Error('no such user exists!'));
        });
    }
}

function getUserTrips(apiKey, filter, order, callback) {
    if(!apiKey) callback(null, new Error('undefined apiKey'));

    User.findOne({'apiKey': apiKey}, "trips", function (err, user) {
        if (!err && user) {
            var tripIds = [];
            for(var t in user.trips) {
                if(!isNaN(t)) {
                    tripIds.push(new ObjectId(user.trips[t]));
                }
            }
            Trip.aggregate([
                {$match: {'_id': {$in: tripIds}}},
                {
                    $project: {
                        dest: '$dest',
                        start:'$start',
                        end:'$end',
                        access: '$access',
                        comment:'$comment',
                        _id:'$_id',
                        users:'$users',
                        owner:'$owner',
                        img: '$img'
                    }
                },
                {$match: filter},
                {$sort: {start: order}}
            ], function(err, res) {
                if(err || !res)
                    callback(null, err);
                else {
                    if(res.length == 0)
                        callback([]);
                    else
                        res.forEach(function(t, index, arr){
                            User.findOne({_id: t.owner}, "name username trips", function(err, docu) {
                                if(!err)
                                    t.owner =  docu;
                                User.find({_id: {$in: t.users}}, "name username trips", function(err, docs) {
                                    t.users = docs;
                                    if(index == arr.length-1) {
                                        callback(res);
                                    }
                                });
                            });
                        });
                }
            });
        }
        else callback(null, new Error('no such user exists!'));
    });
}

function getAllTrips(apiKey, order, callback) {
    if (!apiKey) callback(null, new Error('undefined apiKey'));

    User.findOne({'apiKey': apiKey}, "trips friends", function (err, user) {
        if (!err && user) {
            var tripIds = [];
            for (var t in user.trips) {
                if (!isNaN(t)) {
                    tripIds.push(new ObjectId(user.trips[t]));
                }
            }

            User.find({'_id': {$in: user.friends}}, function(err, users) {
                for(var u in users) {
                    if (isNaN(u)) continue;
                    for (var t in users[u].trips) {
                        if (!isNaN(t)) {
                            tripIds.push(new ObjectId(users[u].trips[t]));
                        }
                    }
                }
                Trip.aggregate([
                    {$match: {'_id': {$in: tripIds}}},
                    {$match: {'access': {$ne : "private"}}},
                    {
                        $project: {
                            dest: '$dest',
                            start: '$start',
                            end: '$end',
                            access: '$access',
                            comment: '$comment',
                            _id: '$_id',
                            users: '$users',
                            owner: '$owner',
                            img: '$img'
                        }
                    },
                    {$sort: {start: order}}
                ], function (err, res) {
                    if (err || !res)
                        callback(null, err);
                    else {
                        if(res.length != 0)
                            res.forEach(function(t, index, arr){
                                User.findOne({_id: t.owner}, "name username trips", function(err, docu) {
                                    if(!err)
                                        t.owner =  docu;
                                    User.find({_id: {$in: t.users}}, "name username trips", function(err, docs) {
                                        t.users = docs;
                                        if(index == arr.length-1) {
                                            callback(res);
                                        }
                                    });
                                });
                            });
                        else
                            callback([]);
                    }
                });
            });
        }
        else callback(null, new Error('no such user exists!'));
    });
}

function getTrips(apiKey, filter, order, callback) {
    if(!apiKey) callback(null, new Error('undefined apiKey'));

    User.findOne({'apiKey': apiKey}, function (err, user) {
        if (!err && user) {
            Trip.aggregate([
                {
                    $project: {
                        dest: '$dest',
                        start:'$start',
                        end:'$end',
                        access: '$access',
                        comment:'$comment',
                        _id:'$_id',
                        users:'$users',
                        owner:'$owner',
                        img: '$img'
                    }
                },
                {$match: filter},
                {$sort: {start: order}}
            ], function(err, res) {
                if(err || !res)
                    callback(null, err);
                else
                    callback(res);
            });
        }
        else callback(null, new Error('no such user exists!'));
    });
}

function getFilter(filter) {
    var flt = {};
    if(filter.keyword) {
        flt.$or = [];
        flt.$or.push({dest: {$regex: new RegExp(filter.keyword,'i')}});
        flt.$or.push({comment: {$regex: new RegExp(filter.keyword,'i')}});
    }
    if(isNaN( filter.start.getTime() ) && isNaN( filter.end.getTime()))
        return flt;
    if(filter.start || filter.end) {
        flt.$and = [];
        if(filter.start && !isNaN( filter.start.getTime() ))
            flt.$and.push({start: {$gte: filter.start}});
        if(filter.end && !isNaN( filter.end.getTime() ))
            flt.$and.push({start: {$lte: filter.end}});
    }
    return flt;
}

function validateTrip(trip) {
    if(trip) {
        if(trip.dest && trip.start && trip.end){
            if(trip.comment && !/^[A-Za-z0-9\._\-\,\;\:\!\s]+$/.test(trip.comment))
                throw new Error('Comment should contain no special characters except [_ - . , : ; ! ]');
        } else
            throw new Error('Destination, start and end date are mandatory!');
    } else
        throw new Error('Undefined trip!');
};

function validateUser(user) {
    if(user) {
        if(user.name && user.password && user.username) {
            if(! /^[A-Za-z]{1}[A-Za-z0-9\.\-_]*[A-Za-z0-9]+\@[A-Za-z]{2}[A-Za-z0-9\.]*\.[A-Za-z]{3,5}$/.test(user.username) || /(\.){2,}/.test(user.username))
                throw new Error('Invalid username, it should be a valid email address');
            if(! /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/.test(user.password))
                throw new Error('Passwords must contain at least six characters, including uppercase, lowercase letters and numbers');
        } else {
            throw new Error('[username, password, name] fields are mandatory!');
        }
    } else {
        throw new Error('User handle not found. Try again!');
    }
}

function validateUserDetails(user) {
    if(user) {
        if(user.name && user.password && user.dob && user.username && user.address[0].zip && user.address[0].city && user.address[0].state) {
            if(! /^[A-Za-z]{1}[A-Za-z0-9\.\-_]*[A-Za-z0-9]+\@[A-Za-z]{2}[A-Za-z0-9\.]*\.[A-Za-z]{3,5}$/.test(user.username) || /(\.){2,}/.test(user.username))
                throw new Error('Invalid username, it should be a valid email address');
            if(! /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/.test(user.password))
                throw new Error('Passwords must contain at least six characters, including uppercase, lowercase letters and numbers');
            if(! /^\d{5}(-\d{4})?(?!-)$/.test(user.address[0].zip))
                throw new Error('Zip code should be numeric [5]');
            if(user.phone && ! /^[0-9]+$/.test(user.phone))
                throw new Error('Phone number should be numeric');
        } else {
            throw new Error('[username, password, dob, name, address[zip], address[city], address[state]] fields are mandatory!');
        }
    } else {
        throw new Error('User handle not found. Try again!');
    }
}
module.exports = dbService;