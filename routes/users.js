var User = require('../models/user');
var isMongooseId = require('mongoose').Types.ObjectId.isValid;
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

    if (!("firstName" in req.body)){
        res.json({message : "Error : No firstName given !"});
        return ;
    }
    else
        user.firstName = req.body.firstName;
    
    if (!("lastName" in req.body)){
        res.json({message : "Error : No lastName given !"});
        return ;
    }
    else
        user.lastName = req.body.lastName;
    
    if (!("email" in req.body)){
        res.json({message : "Error : No email given !"});
        return ;
    }
    else
        user.email = req.body.email;

    user.username = user.firstName.replace(/\s/g, '').toLowerCase()+"."+user.lastName.replace(/\s/g, '').toLowerCase();
    user.privateKey = generateRandomString(32);
    user.passwordHash = "098f6bcd4621d373cade4e832627b4f6";

    user.save(function(err)
    {
        if (err) res.send(err);
        else res.json({ message: 'User created!', id : user._id, success : 1});
    });
}

function getUsers(req, res)
{
    User.find(function(err, users)
    {
        if (err) res.send(err);
        else res.json(users);
    });
}

function getUser(req, res)
{
    if (isMongooseId(req.params.user_id)){
        User.findById(req.params.user_id, function(err, user){
            if (err) res.send(err);
            else res.json(user);
        });
    } else {
        User.findOne({username : req.params.user_id}, function(err, user){
            if (err) res.send(err);
            else res.json(user);
        });
    }        
}

function editUser(req, res)
{
    User.findOne(req.params.user_id, function(err, user)
    {
        if (err) res.send(err);
        else {
            if ("firstName" in req.body) user.firstName = req.body.firstName;
            if ("lastName" in req.body) user.lastName = req.body.lastName;
            if ("email" in req.body) user.email = req.body.email;
            if ("website" in req.body) user.website = req.body.website;
            if ("universityGroup" in req.body) user.universityGroup = req.body.universityGroup;
            if ("birthday" in req.body) user.birthday = new Date(req.body.birthday);
            if ("description" in req.body) user.description = req.body.description;
            if ("picture" in req.body) user.picture = req.body.picture;

            // save the bear
            user.save(function(err)
            {
                if (err) res.send(err);
                else res.json({ message: 'User updated !', id:user._id, success:1 });
            });
        }
    });
}
function deleteUser(req, res)
{
    User.remove({_id: req.params.user_id}, function(err, user)
    {
        if (err) res.send(err);
        else res.json({ message: 'User deleted! ', id:user._id, success:1 });
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