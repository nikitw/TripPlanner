var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');
var routes = require('./routes/index');
var users = require('./routes/users');
var trips = require('./routes/trips');
var multer = require('multer');
var Response = require('./models/response');
var dbService = require('./service/dbService');
var Err = require('./models/err');
var fileExts = ['jpg', 'jpeg', 'png'];
var app = express();

var done=false;
var filename;
/*Configure the multer.*/

app.use(multer({ dest: './uploads/',
    rename: function (fieldname, filename) {
        return filename+Date.now();
    },
    onFileUploadStart: function (file) {
        done = false;
        filename = null;
        console.log(file.originalname + ' is starting ...');
        var parts = file.path.split('.');
        if(fileExts.indexOf(parts[parts.length - 1]) < 0) {
            res.jsonp({err: 'invalid file format'});
            throw new Error('invalid file format');
        }
    },
    onFileUploadComplete: function (file) {
        console.log(file.fieldname + ' uploaded to  ' + file.path);
        var parts = file.path.split('/');
        filename = parts[parts.length - 1];
        done=true;
    }
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(function(req, res, next) {

    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type,X-Requested-With');

    next();
});
app.use(express.static(path.join(__dirname, 'public/ui/boardUI')));


app.use('/', routes);
app.use('/users', users);
app.use('/trips', trips);

app.post('/users/profilePic', function(req, res, next) {
    if(done == true) {
        dbService.setProfilePic(req.body.apiKey, filename,function (usr, err) {
            if(err)
                res.jsonp(new Response(null, new Err(err.message)));
            else
                res.jsonp(new Response(usr));
        });
    } else
        res.jsonp({err: {message: 'failed!'}});
});

app.get('/users/photos/:name', function(req, res) {
    var fname = req.params.name;
    fs.readFile('./uploads/'+fname, function (err, file){
        if(err)
            throw new Error('no file found');
        else {
            var parts = fname.split('.');
            res.writeHead(200, {'Content-Type': 'images/' + fileExts[fileExts.indexOf(parts[parts.length - 1])]});
            res.end(file);
        }
    });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
