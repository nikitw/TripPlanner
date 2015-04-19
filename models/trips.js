/**
 * Created by nikit on 3/16/15.
 */
var mongoose = require('mongoose');

var tripSchema = new mongoose.Schema({
    dest: String,
    owner: String,
    start: Date,
    end: Date,
    access: String,
    comment: String,
    pending: Boolean,
    users: [String],
    img: String
});

module.exports = tripSchema;