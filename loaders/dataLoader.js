/**
 * Created by nikit on 3/23/15.
 */
/**
 * Created by nikit on 3/16/15.
 */
var mongoose = require('mongoose');
var db = mongoose.createConnection('localhost', 'tripPlannerApp');
var userSchema = require('../models/users');
var ObjectId = require('mongoose').Types.ObjectId;
var md5 = require('MD5');

var User = db.model('users', userSchema);

function updateAllPasswordHash() {
    User.find({}, function(err, doc) {
        if(err||!doc)
            console.log('No users to update');
        else {
            for(var u in doc) {
                doc[u].apiKey = md5(doc[u].username+doc[u].zip);
                doc[u].password = md5(doc[u].password);
                User.findOneAndUpdate({_id: new ObjectId(doc[u]._id)}, doc[u],function(err, docx){
                    if(err)
                        console.log(err);
                    else
                        console.log(docx.usename);
                });
            }
        }
        process.exit();
    })
}

updateAllPasswordHash();