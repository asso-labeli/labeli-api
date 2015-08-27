/**
 * <h2>Model</h2>
 * <table>
 * <tr><td><b>Name</b></td><td><b>Type</b></td><td><b>Default Value</b></td></tr>
 * <tr><td>lastName</td><td>String</td></tr>
 * <tr><td>firstName</td><td>String</td></tr>
 * <tr><td>username</td><td>String</td></tr>
 * <tr><td>email</td><td>String</td></tr>
 * <tr><td>passwordHash</td><td>String</td></tr>
 * <tr><td>privateKey</td><td>String</td></tr>
 * <tr><td>picture</td><td>String</td><td>null</td></tr>
 * <tr><td>role</td><td>String</td><td>Membre</td></tr>
 * <tr><td>level</td><td>Number</td><td>1</td></tr>
 * <tr><td>description</td><td>String</td><td> ' '</td></tr>
 * <tr><td>created</td><td>Date</td><td>Date.now</td></tr>
 * <tr><td>birthday</td><td>Date</td><td>new Date('01.01.1970T01:00')</td></tr>
 * <tr><td>universityGroup</td><td>String</td><td>'Inconnu'</td></tr>
 * <tr><td>website</td><td>String</td><td>null</td></tr>
 * </table><br>
 * <h2>Routing Table</h2>
 * <table>
 * <tr><td>POST /users/</td><td>{@link User.createUser}</td></tr>
 * <tr><td>GET /users/</td><td>{@link User.getUsers}</td></tr>
 * <tr><td>GET /users/:user_id</td><td>{@link User.getUser}</td></tr>
 * <tr><td>PUT /users/:user_id</td><td>{@link User.editUser}</td></tr>
 * <tr><td>DELETE /users/:user_id</td><td>{@link User.deleteUser}</td></tr>
 * </table><br>
 * <h2>Constants</h2>
 * <h5>User.Level</h5>
 * <table>
 * <tr><td>Guest</td><td>-1</td></tr>
 * <tr><td>OldMember</td><td>0</td></tr>
 * <tr><td>Member</td><td>1</td></tr>
 * <tr><td>Admin</td><td>3</td></tr></table>
 * @namespace User
 * @author Florian Kauder
 */

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

/**
 * Create a new user<br>
 * <b>Level needed :</b> Admin
 * @memberof User
 * @param {Express.Request} req - request send
 * @param {String} req.body.firstName - first name of user
 * @param {String} req.body.lastName - last name of user
 * @param {String} req.body.email - email of user
 * @param {Express.Response} res - variable to send the response
 */
function createUser(req, res) {
    if (req.session.level == -1) {
        Response(res, "Error : Not logged", null, 0);
        return;
    } else if (req.session.level < User.Level.Admin) {
        Response(res, "Error : You're not an admin", null, 0);
        return;
    }

    var user = new User();

    // Check req variables
    if (!("firstName" in req.body)) {
        Response(res, "Error : No firstName given", null, 0);
        return;
    } else if (!("lastName" in req.body)) {
        Response(res, "Error : No lastName given", null, 0);
        return;
    } else if (!("email" in req.body)) {
        Response(res, "Error : No email given", null, 0);
        return;
    }

    // Setting user values
    user.firstName = req.body.firstName;
    user.lastName = req.body.lastName;
    user.email = req.body.email;

    user.username = user.firstName.replace(/\s/g, '').toLowerCase() + "." + user.lastName.replace(/\s/g, '').toLowerCase();
    user.privateKey = generateRandomString(32);
    user.passwordHash = "098f6bcd4621d373cade4e832627b4f6";

    user.save(function (err) {
        if (err) Response(res, "Error", err, 0);
        else Response(res, 'User created', user, 1);
    });
}

/**
 * Get all users<br>
 * <b>Level needed :</b> Guest
 * @memberof User
 * @param {Express.Request} req - request send
 * @param {Express.Response} res - variable to send the response
 */
function getUsers(req, res) {
    User.find(function useResult(err, users) {
        if (err) Response(res, "Error", err, 0);
        else if (users == null)
            Response(res, "Error : No users found", null, 0);
        else Response(res, "Users found", users, 1);
    });
}

/**
 * Get a specific user<br>
 * <b>Level needed :</b> Guest
 * @memberof User
 * @param {Express.Request} req - request send
 * @param {ObjectId} req.params.user_id - User Id OR User username
 * @param {Express.Response} res - variable to send the response
 */
function getUser(req, res) {
    // If is an ID, search with id
    if (isMongooseId(req.params.user_id)) {
        User.findById(req.params.user_id, function useResult(err, user) {
            if (err) Response(res, "Error", err, 0);
            else if (user == null)
                Response(res, 'Error : User not found', null, 0);
            else Response(res, 'User found', user, 1);
        });
    } else { // Username case
        User.findOne({
            username: req.params.user_id
        }, function useResult(err, user) {
            if (err) Response(res, "Error", err, 0);
            else if (user == null)
                Response(res, 'Error : User not found', null, 0);
            else Response(res, 'User found', user, 1);
        });
    }
}

/**
 * Edit a user<br>
 * <b>Level needed :</b> Owner | Admin
 * @memberof User
 * @param {Express.Request} req - request send
 * @param {String} [req.body.firstName] - New first name
 * @param {String} [req.body.lastName] - New last name
 * @param {String} [req.body.email] - New email
 * @param {String} [req.body.website] - New website
 * @param {String} [req.body.universityGroup] - New university group
 * @param {String} [req.body.birthday] - New birthday (LocaleDateString)
 * @param {String} [req.body.description] - New description
 * @param {String} [req.body.picture] - New url for picture
 * @param {ObjectID} [req.params.user_id] - ID of user to edit
 * @param {Express.Response} res - variable to send the response
 */
function editUser(req, res) {
    User.findById(req.params.user_id, function (err, user) {
        if (err) Response(res, "Error", err, 0);
        else if (user == null)
            Response(res, "Error : User not found", null, 0);
        else if ((user._id != req.session.userId) && (req.session.level < User.Level.Admin))
            Response(res, "Error : You're not an admin", null, 0);
        else {
            if ("firstName" in req.body) user.firstName = req.body.firstName;
            if ("lastName" in req.body) user.lastName = req.body.lastName;
            if ("email" in req.body) user.email = req.body.email;
            if ("website" in req.body) user.website = req.body.website;
            if ("universityGroup" in req.body) user.universityGroup = req.body.universityGroup;
            if ("birthday" in req.body) user.birthday = new Date(req.body.birthday);
            if ("description" in req.body) user.description = req.body.description;
            if ("picture" in req.body) user.picture = req.body.picture;

            user.save(function (err) {
                if (err) Response(res, "Error", err, 0);
                else Response(res, 'User updated', user, 1);
            });
        }
    });
}

/**
 * Delete a user<br>
 * <b>Level needed :</b> Admin
 * @memberof User
 * @param {Express.Request} req - request send
 * @param {ObjectID} [req.params.user_id] - ID of user to delete
 * @param {Express.Response} res - variable to send the response
 */
function deleteUser(req, res) {
    if (req.session.level < User.Level.Admin)
        Response(res, "Error : You're not an admin", null, 0);
    else
        User.remove({
            _id: req.params.user_id
        }, function (err, user) {
            if (err) Response(res, "Error", err, 0);
            else Response(res, 'User deleted', user, 1);
        });
}

// Function available only in debug mode
function createAdmin(req, res) {
    var user = new User();

    user.firstName = "AdminTest";
    user.lastName = "AdminTest";
    user.email = "admin@test.com";
    user.level = User.Level.Admin;

    user.username = user.firstName.replace(/\s/g, '').toLowerCase() + "." + user.lastName.replace(/\s/g, '').toLowerCase();
    user.privateKey = "poulpe";
    user.passwordHash = "098f6bcd4621d373cade4e832627b4f6";

    user.save(function (err) {
        if (err) Response(res, "Error", err, 0);
        else Response(res, 'Admin created', user, 1);
    });
}

/**
 * Generate a random string<br>
 * <b>[Private Function]</b>
 * @memberof User
 * @param {Number} length - Length of the generated string
 * @return {String} the random String
 */
function generateRandomString(length) {
    var result = "";
    var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < length; i++)
        result += charset.charAt(Math.floor(Math.random() * charset.length));
    return result;
}
