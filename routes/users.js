var User = require('../models/user');
var Response = require('../modules/response');

var isMongooseId = require('mongoose').Types.ObjectId.isValid;
var express = require('express');
var router = express.Router();

router.route('/users').post(createUser);
router.route('/users').get(getUsers);
router.route('/users/:user_id').get(getUser);
router.route('/users/:user_id').put(editUser);
router.route('/users/:user_id').delete(deleteUser);
if (require('../modules/apiConf').debugMode)
    router.route('/admin').post(createAdmin);

module.exports = router;

function createUser(req, res) {
    var user = new User();

    if (!("firstName" in req.body)) {
        Response(res, "Error : No firstName given", null, 0);
        return;
    } else
        user.firstName = req.body.firstName;

    if (!("lastName" in req.body)) {
        Response(res, "Error : No lastName given", null, 0);
        return;
    } else
        user.lastName = req.body.lastName;

    if (!("email" in req.body)) {
        Response(res, "Error : No email given", null, 0);
        return;
    } else
        user.email = req.body.email;

    user.username = user.firstName.replace(/\s/g, '').toLowerCase() + "." + user.lastName.replace(/\s/g, '').toLowerCase();
    user.privateKey = generateRandomString(32);
    user.passwordHash = "098f6bcd4621d373cade4e832627b4f6";

    user.save(function (err) {
        if (err) Response(res, "Error", err, 0);
        else Response(res, 'User created', user, 1);
    });
}

function getUsers(req, res) {
    User.find(function (err, users) {
        if (err) Response(res, "Error", err, 0);
        else Response(res, "Users found", users, 1);
    });
}

function getUser(req, res) {
    if (isMongooseId(req.params.user_id)) {
        User.findById(req.params.user_id, function (err, user) {
            if (err) Response(res, "Error", err, 0);
            else if (user == null)
                Response(res, 'Error : User not found', null, 0);
            else Response(res, 'User found', user, 1);
        });
    } else {
        User.findOne({
            username: req.params.user_id
        }, function (err, user) {
            if (err) Response(res, "Error", err, 0);
            else if (user == null)
                Response(res, 'Error : User not found', null, 0);
            else Response(res, 'User found', user, 1);
        });
    }
}

function editUser(req, res) {
    User.findOne(req.params.user_id, function (err, user) {
        if (err) Response(res, "Error", err, 0);
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
            user.save(function (err) {
                if (err) Response(res, "Error", err, 0);
                else Response(res, 'User updated', user, 1);
            });
        }
    });
}

function deleteUser(req, res) {
    User.remove({
        _id: req.params.user_id
    }, function (err, user) {
        if (err) Response(res, "Error", err, 0);
        else Response(res, 'User deleted', user, 1);
    });
}

function createAdmin(req, res)
{        
    var user = new User();
    
    user.firstName = "AdminTest";
    user.lastName = "AdminTest";
    user.email = "admin@test.com";
    user.level = 3;

    user.username = user.firstName.replace(/\s/g,'').toLowerCase()
        + "." + user.lastName.replace(/\s/g, '').toLowerCase();
    user.privateKey = generateRandomString(32);
    user.passwordHash = "098f6bcd4621d373cade4e832627b4f6";

    user.save(function(err)
    {
        if (err) Response(res, "Error", err, 0);
        else Response(res, 'Admin created', user, 1);
    });
}

function generateRandomString(length) {
    var result = "";
    var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < length; i++)
        result += charset.charAt(Math.floor(Math.random() * charset.length));
    return result;
}