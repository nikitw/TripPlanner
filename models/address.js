/**
 * Created by nikit on 3/16/15.
 */
var mongoose = require('mongoose');

var addressSchema = new mongoose.Schema({
    add1: String,
    add2: String,
    zip: String,
    city: String,
    state: String
});

module.exports = addressSchema;