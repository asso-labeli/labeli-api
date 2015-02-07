var User = require('../models/user');
var express = require('express');
var router = express.Router();

router.route('/users').post(createUser);
router.route('/users').get(getUsers);
router.route('/users/:user_id').get(getUser);
router.route('/users/:user_id').put(editUser);
router.route('/users/:user_id').delete(deleteUser);

module.exports = router;

function createUser(req, res)
{        
    var user = new User();
    user.firstName = req.body.firstName;
    user.lastName = req.body.lastName;
    user.username = user.firstName.replace(/\s/g, '').toLowerCase()+"."+user.lastName.replace(/\s/g, '').toLowerCase();
    user.privateKey = generateRandomString(32);
    user.passwordHash = "098f6bcd4621d373cade4e832627b4f6";
    user.created = Date.now();

    user.save(function(err)
    {
        if (err) res.send(err);
        res.json({ message: 'User created !' });
    });
}

function getUsers(req, res)
{
    User.find(function(err, users)
    {
        if (err) res.send(err);
        res.json(users);
    });
}

function getUser(req, res)
{
    User.findOne({username : req.params.user_id}, function(err, user)
    {
        if (err) res.send(err);
        res.json(user);
    });
}
function editUser(req, res)
{
    User.findById(req.params.user_id, function(err, user)
    {
        if (err) res.send(err);
        user.name = req.body.name;

        // save the bear
        user.save(function(err)
        {
            if (err) res.send(err);
            res.json({ message: 'User updated!' });
        });

    });
}
function deleteUser(req, res)
{
    User.remove({_id: req.params.user_id}, function(err, user)
    {
        if (err) res.send(err);
        res.json({ message: 'User deleted!' });
    });
}

function generateRandomString(length)
{
    var result = "";
    var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for( var i=0; i < length; i++ )
        result += charset.charAt(Math.floor(Math.random() * charset.length));
    return result;
}