/**
 * Created by nikit on 3/15/15.
 */
var mongoose = require('mongoose');
var addressSchema = require('./address');

var userSchema = new mongoose.Schema({
    name: String,
    username: String,
    password: String,
    apiKey: String,
    dob: {"type":Date, "default": new Date('undefined')},
    phone: {"type":String, "default": " - - "},
    address: [addressSchema],
    trips: [String],
    friends: [String],
    requests: [String],
    messages: [String],
    notifications: [String],
    profilePic: {"type": String, "default": '.default-user.png'}
});

module.exports = userSchema;