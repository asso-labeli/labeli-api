var User = require('./models/user');

var express     = require('express');
var session     = require('express-session');
var vhost       = require('vhost');
var app         = express();
var router      = express.Router();

app.use(vhost('hook.website.labeli.org', require('./hook.js')));

var mongoose   = require('mongoose');
mongoose.connect('mongodb://localhost:27017/labeli-api');

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

currentUser = null;

app.use(session({
    secret: 'labeliSessionPwordAss',
    resave: true,
    saveUninitialized: true
}));

app.use(function(req, res, next)
{
    res.header("Cache-Control", "no-cache");
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    next();
});

app.use(function(req, res, next)
{
    console.log("request by "+req.session.userId);
    if(req.session.userId == null)
    {
        currentUser = null;
        next();
    }
    else
    {
        User.findById(req.session.userId, function(err, user)
        {
            currentUser = user;
            next();
        });
    }
});

app.use(require('./routes/users'));
app.use(require('./routes/projects'));
app.use(require('./routes/auth'));

app.use(router);
module.exports = app;