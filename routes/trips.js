var express = require('express');
var router = express.Router();
var dbService = require('../service/dbService');
var Response = require('../models/response');
var Err = require('../models/err');

/* GET trips listing. */
router.get('/', function(req, res, next) {
    var apiKey = req.query.apiKey;
    var filter = {
        keyword: req.query.keyword,
        start: new Date(req.query.start),
        end: new Date(req.query.end),
        pending: req.query.pending
    };

    dbService.getTrips(apiKey, filter, function(trips, err) {
        if(err) {
            res.jsonp(new Response(null, new Err(err.message)));
        }
        else {
            res.jsonp(new Response(trips));
        }
    });
});

router.get('/posts', function(req, res, next) {
    var apiKey = req.query.apiKey;

    dbService.getPostedTrips(apiKey, function(trips, err) {
        if(err) {
            res.jsonp(new Response(null, new Err(err.message)));
        }
        else {
            res.jsonp(new Response(trips));
        }
    });
});

router.get('/:id', function(req, res){
    var apiKey = req.query.apiKey;
    var id = req.params.id;
    dbService.getTrip(apiKey, id, function(trip, err) {
        if(err) {
            res.jsonp(new Response(null, new Err(err.message)));
        }
        else {
            res.jsonp(new Response(trip));
        }
    });
});

router.put('/:id', function(req, res){
    var id = req.params.id;
    var update = req.body;
    var apiKey = req.query.apiKey;
    delete update.apiKey;

    dbService.updateTrip(apiKey, id, update, function(trips, err) {
        if(err) {
            res.jsonp(new Response(null, new Err(err.message)));
        }
        else {
            res.jsonp(new Response(trips));
        }
    });
});

router.post('/', function(req, res){

    var newtrip = req.body;
    var apiKey = newtrip.apiKey;
    delete newtrip.apiKey;

    dbService.createTrip(apiKey, newtrip, function(trips, err) {
        if(err) {
            res.jsonp(new Response(null, new Err(err.message)));
        }
        else {
            res.jsonp(new Response(trips));
        }
    });
});

router.delete('/:id', function(req, res){
    var id = req.params.id;
    var apiKey = req.query.apiKey;
    dbService.deleteTrip(apiKey, id, function(trips, err) {
        if(err) {
            res.jsonp(new Response(null, new Err(err.message)));
        }
        else {
            res.jsonp(new Response(trips));
        }
    });
});

router.post('/join', function(req, res){
    if(!req.body)
        res.josnp(new Response(null, new Err('trip handle undefined in request')));
    var id = req.body._id;
    var apiKey = req.query.apiKey;
    dbService.joinTrip(apiKey, id, function(trips, err) {
        if(err) {
            res.jsonp(new Response(null, new Err(err.message)));
        }
        else {
            res.jsonp(new Response(trips));
        }
    });
});

router.post('/unjoin', function(req, res){
    if(!req.body)
        res.josnp(new Response(null, new Err('trip handle undefined in request')));
    var id = req.body._id;
    var apiKey = req.query.apiKey;
    dbService.unjoinTrip(apiKey, id, function(trips, err) {
        if(err) {
            res.jsonp(new Response(null, new Err(err.message)));
        }
        else {
            res.jsonp(new Response(trips));
        }
    });
});

module.exports = router;
