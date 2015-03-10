var User = require('../models/user');
var Response = require('../modules/response');

var express = require('express');
var router = express.Router();

router.route('/auth').get(getAuth);
router.route('/auth').post(login);
router.route('/auth').delete(logout);

module.exports = router;

function getAuth(req, res)
{
    if(req.session.userId == null)
        Response(res, "Error : Not Authenticated", null, 0);
    else
        User.findById(req.session.userId, function(err, user) { 
            Response(res, "Authenticated", user, 1); 
        });
}

function login(req, res)
{
    if (!('username' in req.body)){
        Response(res, "Error : No username given", null, 0);
        return;
    }
    else if (!('password' in req.body)){
        Response(res, "Error : No password given", null, 0);
        return;
    }
    
    var user = User.findOne({username : req.body.username}, 
                            function(err, user)
    {
        if (err) Response(res, "Error", err, 0);
        else if (user == null)
            Response(res, "Error : User not found", null, 0);
        else if (user.passwordHash != encryptPassword(req.body.password))
            Response(res, "Error : Bad combinaison username/password", null, 0);
        else {
            console.log("login");
            req.session.userId = user._id;
            req.session.save();
            Response(res, "Authentification successfull", user, 1);
        }
    });
    
}

function logout(req, res)
{
    console.log("logout");
    req.session.destroy(function(){
        Response(res, "Disconnected", null, 1);
    });
}


function encryptPassword(password)
{
    return '098f6bcd4621d373cade4e832627b4f6';
}