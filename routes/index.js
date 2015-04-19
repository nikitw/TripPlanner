var express = require('express');
var router = express.Router();
var dbService = require('../service/dbService');
var Response = require('../models/response');
var Err = require('../models/err');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.post('/auth/login', function(req, res) {
    var q = req.body;
    dbService.login(q.username, q.password, function(user, err) {
        if(err)
            res.jsonp(new Response(null, new Err(err.message)));
        else
            res.jsonp(new Response(user));
    });
});

module.exports = router;