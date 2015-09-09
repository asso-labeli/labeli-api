var User = require('./models/user');
var Log = require('./modules/log');
Log.init('file.log');

var express = require('express');
var session = require('express-session');
var vhost = require('vhost');
var app = express();
var router = express.Router();
var qt = require('quickthumb');

var favicon = require('serve-favicon');

Log.i('Connection to Mongo Database');

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/labeli-api');


Log.i('Preparing API');

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use(session({
    secret: 'labeliSessionPwordAss',
    resave: true,
    saveUninitialized: true
}));

app.use(function (req, res, next) {
    res.header("Cache-Control", "no-cache");
    res.header("Access-Control-Allow-Origin", "http://localhost:9020");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    next();
});

app.use(function (req, res, next) {
    if (req.session.userId == undefined) {
        req.session.userId = null;
        req.session.level = -1;
    }

    next();
});

app.use(require('./routes/users'));
app.use(require('./routes/projects'));
app.use(require('./routes/auth'));
app.use(require('./routes/messages'));
app.use(require('./routes/votes'));
app.use(require('./routes/projectUsers'));
app.use(require('./routes/surveys'));
app.use(require('./routes/surveyItems'));
app.use(require('./routes/surveyVotes'));
app.use(require('./routes/upload'));

// Use quickthumb
app.use(qt.static(__dirname + '/', { type : 'resize' }));

// Add doc
app.use("/", express.static("./doc/"));

// Add favicon
app.use(favicon(__dirname + "/styles/favicon.ico"));

app.use(router);

Log.i('API Ready');

app.listen(9010);
