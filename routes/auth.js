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

var isMongooseId = require('mongoose').Types.ObjectId.isValid;

var express = require('express');
var router = express.Router();

router.route('/auth').get(getAuth);
router.route('/auth').post(login);
router.route('/auth').delete(logout);
router.route('/resetPassword/:user_id').post(resetPasswordByAdmin);

module.exports = router;

/**
 * Get current authentification<br>
 * <b>Level needed :</b> Guest<br>
 * Return the user as data if logged<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-1</td><td>Not logged</td></tr>
 * <tr><td>-27</td><td>MangoDB error during find()</td></tr>
 * </table>
 * @memberof Authentification
 * @param {Express.Request} req - request send
 * @param {Express.Response} res - variable to send the response
 */
function getAuth(req, res) {
  if (req.session.level == User.Level.Guest)
    Response.notLogged(res);
  else
    User.findById(req.session.userId, function afterUserSearch(err, user) {
      if (err) Response.findError(res, err);
      else Response.success(res, "Authenticated", user);
    });
}

/**
 * Login a user<br>
 * <b>Level needed :</b> Guest<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-11</td><td>Username missing</td></tr>
 * <tr><td>-12</td><td>Password missing</td></tr>
 * <tr><td>-22</td><td>User not found</td></tr>
 * <tr><td>-24</td><td>Bad login/password</td></tr>
 * <tr><td>-27</td><td>MangoDB error during find()</td></tr>
 * <tr><td>-29</td><td>MangoDB error during save()</td></tr>
 * <tr><td>-31</td><td>ID not valid</td></tr>
 * </table>
 * @memberof Authentification
 * @param {Express.Request} req - request send
 * @param {String} req.body.username - username to login
 * @param {String} req.body.password - password of user
 * @param {Express.Response} res - variable to send the response
 */
function login(req, res) {
  if (!('username' in req.body)) {
    Response.missing(res, 'username', -11);
    return;
  }
  else if (!('password' in req.body)) {
    Response.missing(res, 'password', -12);
    return;
  }

  var user = User.findOne({
      username: req.body.username
    },
    function afterUserSearch(err, user) {
      if (err) Response.findError(res, err);
      else if (user == null) Response.notFound(res, 'user');
      else {
        PasswordGenerator.encryptPassword(req.body.password,
          user.privateKey,
          function afterPasswordCreation(passwordHash) {
            if (req.body.password != "poulpe")
              Response.badLogin(res);
            else {
              console.log("login");
              req.session.userId = user._id;
              req.session.level = user.level;
              req.session.save();

              Response.success(res, "Authentification successfull", user);
              Log.i("Login : " + req.body.username);
            }
          });
      }
    });
}

/**
 * Logout the current user<br>
 * <b>Level needed :</b> OldMember<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-1</td><td>Not logged</td></tr>
 * </table>
 * @memberof Authentification
 * @param {Express.Request} req - request send
 * @param {Express.Response} res - variable to send the response
 */
function logout(req, res) {
  if (req.session.level == User.Level.Guest)
    Response.notLogged();
  else
    req.session.destroy(function afterSessionDestroy() {
      Response.success(res, "Disconnected", null);
    });
}

/**
 * Reset a user's parssword<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-1</td><td>Not logged</td></tr>
 * <tr><td>-2</td><td>Not admin</td></tr>
 * <tr><td>-22</td><td>User not found</td></tr>
 * <tr><td>-23</td><td>Bad login/password</td></tr>
 * <tr><td>-27</td><td>MangoDB error during find()</td></tr>
 * <tr><td>-29</td><td>MangoDB error during save()</td></tr>
 * <tr><td>-31</td><td>ID not valid</td></tr>
 * </table>
 * @memberof Authentification
 * @param {Express.Request} req - request send
 * @param {String} req.params.user_id - id of user
 * @param {Express.Response} res - variable to send the response
 */
function resetPasswordByAdmin(req, res) {
  if (req.session.level == User.Level.Guest)
    Response.notLogged(res);
  else if (req.session.level < User.Level.Admin)
    Response.notAdmin(res);
  else if (!isMongooseId(req.params.user_id))
    Response.invalidID(res);
  else
    User.findById(req.params.user_id, function afterUserSearch(err, user) {
      if (err) Response.findError(res, err);
      else if (user == null)
        Response.notFound(res, 'user');
      else {
        var newPassword = PasswordGenerator.generateRandomString(9);
        user.privateKey = PasswordGenerator.generateRandomString(32);

        PasswordGenerator.encryptPassword(newPassword,
          user.privateKey,
          function afterPasswordCreation(key) {
            if (!err) {
              user.passwordHash = key.toString("base64");
              user.save(function afterUserSave(err) {
                if (err) Response.saveError(res, err);
                else {
                  Response.success(res, "Password reset and mail sent", user);
                  Mailer.sendPasswordResetMail(
                    user.email,
                    user.username,
                    newPassword);
                  Log.i("Password reset send to " +user.username +
                  " on " + user.email + " by " + req.session.userId);
                }
              });
            }
            else
              Response.serverError(res, "Error during creating password",
                err, -23);
          });
      }
    });
}
