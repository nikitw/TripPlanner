var express = require('express');
var router = express.Router();
var Response = require('../models/response');
var dbService = require('../service/dbService');
var Err = require('../models/err');

/* GET users listing. */
router.get('/', function(req, res, next) {
    var apiKey = req.query.apiKey;
    dbService.getUsers(apiKey, function(users, err) {
        if(err)
            res.jsonp(new Response(null, new Err(err.message)));
        else
            res.jsonp(new Response(users));
    });
});

router.get('/user/:id', function(req, res, next) {
    var apiKey = req.query.apiKey;
    var uid = req.params.id;
    console.log(uid);
    dbService.getUserById(apiKey, uid, function(user, err) {
        if(err)
            res.jsonp(new Response(null, new Err(err.message)));
        else
            res.jsonp(new Response(user));
    });
});

router.post('/', function(req, res) {
    var q = req.body;
    dbService.createUser(q, function(user, err) {
        if(err)
            res.jsonp(new Response(null, new Err(err.message)));
        else
            res.jsonp(new Response(user));
    });
});

router.get('/friends', function(req, res, next) {
    var apiKey = req.query.apiKey;
    dbService.getFriends(apiKey, function(users, err) {
        if(err)
            res.jsonp(new Response(null, new Err(err.message)));
        else
            res.jsonp(new Response(users));
    });
});

router.get('/friends/request', function(req, res, next) {
    var apiKey = req.query.apiKey;
    dbService.getFriendRequests(apiKey, function(users, err) {
        if(err)
            res.jsonp(new Response(null, new Err(err.message)));
        else
            res.jsonp(new Response(users));
    });
});

router.post('/friends/request', function(req, res, next) {
    var apiKey = req.query.apiKey;
    dbService.requestFriend(apiKey, req.body._id, function(user, err) {
        if(err)
            res.jsonp(new Response(null, new Err(err.message)));
        else
            res.jsonp(new Response(user));
    });
});

router.delete('/friends/request/:id', function(req, res, next) {
    var apiKey = req.query.apiKey;
    var fid = req.params.id;
    dbService.removeRequest(apiKey, fid, function(user, err) {
        if(err)
            res.jsonp(new Response(null, new Err(err.message)));
        else
            res.jsonp(new Response(user));
    });
});


router.post('/friends/accept', function(req, res, next) {
    var apiKey = req.query.apiKey;
    dbService.acceptFriend(apiKey, req.body._id, function(user, err) {
        if(err)
            res.jsonp(new Response(null, new Err(err.message)));
        else
            res.jsonp(new Response(user));
    });
});

router.delete('/friends/:id', function(req, res, next) {
    var apiKey = req.query.apiKey;
    var fid = req.params.id;
    dbService.unFriend(apiKey, fid, function(users, err) {
        if(err)
            res.jsonp(new Response(null, new Err(err.message)));
        else
            res.jsonp(new Response(users));
    });
});

router.put('/user', function(req, res, next) {
    var apiKey = req.query.apiKey;
    dbService.updateUser(apiKey, req.body, function(user, err) {
        if(err)
            res.jsonp(new Response(null, new Err(err.message)));
        else
            res.jsonp(new Response(user));
    });
});

module.exports = router;
