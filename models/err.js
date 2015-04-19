/**
 * Created by nikit on 3/16/15.
 */
var Err = function (message, id) {
    this.message = message;
    this.id = id;
};

module.exports = Err;