var User = require('../models/user');
var express = require('express');
var router = express.Router();

router.route('/auth').get(getAuth);
router.route('/auth').post(login);
router.route('/auth').delete(logout);
module.exports = router;

function getAuth(req, res)
{
    if(req.session.userId == null)
        res.json(null);
    else
        User.findById(req.session.userId, function(err, user) { res.json(user); });
}

function login(req, res)
{
    var user = User.findOne({username : req.body.username, passwordHash : encryptPassword(req.body.password)}, function(err, user)
    {
        if(user != null)
        {
            console.log("login");
            req.session.userId = user._id;
            req.session.save();
        }
        
        res.json(user);
    });
    
}

function logout(req, res)
{
    console.log("logout");
    req.session.destroy(function(){res.json(true);});
}


function encryptPassword(password)
{
    return '098f6bcd4621d373cade4e832627b4f6';
}