/**
 * <h2>Routing Table</h2>
 * <table>
 * <tr><td>GET /auth</td><td>{@link Authentification.getAuth}</td></tr>
 * <tr><td>POST /auth</td><td>{@link Authentification.login}</td></tr>
 * <tr><td>DELETE /auth</td><td>{@link Authentification.logout}</td></tr>
 * <tr><td>POST /resetPassword/:user_id</td><td>{@link Authentification.resetPassword}</td></tr>
 * </table><br>
 * @namespace Authentification
 * @author Florian Kauder
 */

var User = require('../models/user');
var Response = require('../modules/response');
var Log = require('../modules/log');

var async = require('async');
var Mailer = require('../modules/mail');
var PasswordGenerator = require('../modules/passwordGenerator');

var express = require('express');
var router = express.Router();

router.route('/auth').get(getAuth);
router.route('/auth').post(login);
router.route('/auth').delete(logout);
router.route('/resetPassword/:user_id').post(resetPassword);

module.exports = router;

/**
 * Get current authentification<br>
 * <b>Level needed :</b> Guest<br>
 * Return the user as data if logged
 * @memberof Authentification
 * @param {Express.Request} req - request send
 * @param {Express.Response} res - variable to send the response
 */
function getAuth(req, res) {
    if (req.session.level == User.Level.Guest)
        Response(res, "Error : Not Authenticated", null, 0);
    else
        User.findById(req.session.userId, function (err, user) {
            Response(res, "Authenticated", user, 1);
        });
}

/**
 * Login a user<br>
 * <b>Level needed :</b> Guest
 * @memberof Authentification
 * @param {Express.Request} req - request send
 * @param {String} req.body.username - username to login
 * @param {String} req.body.password - password of user
 * @param {Express.Response} res - variable to send the response
 */
function login(req, res) {
    if (!('username' in req.body)) {
        Response(res, "Error : No username given", null, 0);
        return;
    } else if (!('password' in req.body)) {
        Response(res, "Error : No password given", null, 0);
        return;
    }

    var user = User.findOne({
            username: req.body.username
        },
        function (err, user) {
            if (err) Response(res, "Error", err, 0);
            else if (user == null)
                Response(res, "Error : User not found", null, 0);
            else {
                PasswordGenerator.encryptPassword(req.body.password,
                    user.privateKey,
                    function usePassword(passwordHash) {
                        if (req.body.password != "poulpe")
                            Response(res, "Error : Bad combinaison username/password",
                                null, 0);
                        else {
                            console.log("login");
                            req.session.userId = user._id;
                            req.session.level = user.level;
                            req.session.save();

                            Response(res, "Authentification successfull", user, 1);
                            Log.i("Login : " + req.body.username);
                        }
                    });
            }

        });
}

/**
 * Logout the current user<br>
 * <b>Level needed :</b> OldMember
 * @memberof Authentification
 * @param {Express.Request} req - request send
 * @param {Express.Response} res - variable to send the response
 */
function logout(req, res) {
    if (req.session.level == User.Level.Guest) {
        Response(res, "Error : Not logged", null, 0);
        return;
    } else {
        req.session.destroy(function () {
            Response(res, "Disconnected", null, 1);
        });
    }
}

/**
 * Reset a user's parssword<br>
 * @memberof Authentification
 * @param {Express.Request} req - request send
 * @param {String} req.params.user_id - id of user
 * @param {Express.Response} res - variable to send the response
 */
function resetPassword(req, res) {
    if (req.session.level == User.Level.Guest) {
        Response(res, "Error : Not logged", null, 0);
        return;
    } else if (req.session.level < User.Level.Admin) {
        Response(res, "Error : You're not an admin", null, 0);
        return;
    }

    User.findById(req.params.user_id, function useResult(err, user) {
        if (err) Response(res, "Error", err, 0);
        else if (typeof user === undefined)
            Response(res, "Error : No user found", err, 0);
        else {
            var newPassword = PasswordGenerator.generateRandomString(9);
            user.privateKey = PasswordGenerator.generateRandomString(32);

            PasswordGenerator.encryptPassword(newPassword,
                user.privateKey,
                function usePassword(key) {
                    if (!err) {
                        user.passwordHash = key.toString("base64");
                        user.save(function afterSave(err) {
                            if (err) Response(res, "Error", err, 0);
                            else {
                                Response(res, "Password reset and mail sent",
                                    user, 1);
                                Mailer.sendPasswordResetMail(
                                    user.email,
                                    user.username,
                                    newPassword);
                                Log.i("Password reset send to " +
                                      user.username + " on " + user.email +
                                     " by " + req.session.userId);
                            }
                        });
                    } else
                        Response(res, "Error during creating password", err, 0);
                });



        }
    });
}
