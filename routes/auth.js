/**
 * <h2>Routing Table</h2>
 * <table>
 * <tr><td>GET /auth</td><td>{@link Authentification.getAuth}</td></tr>
 * <tr><td>POST /auth</td><td>{@link Authentification.login}</td></tr>
 * <tr><td>DELETE /auth</td><td>{@link Authentification.logout}</td></tr>
 * </table><br>
 * @namespace Authentification
 * @author Florian Kauder
 */

var User = require('../models/user');
var Response = require('../modules/response');

var express = require('express');
var router = express.Router();

router.route('/auth').get(getAuth);
router.route('/auth').post(login);
router.route('/auth').delete(logout);

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
            else if (user.passwordHash != encryptPassword(req.body.password))
                Response(res, "Error : Bad combinaison username/password", null, 0);
            else {
                console.log("login");
                req.session.userId = user._id;
                req.session.level = user.level;
                req.session.save();
                Response(res, "Authentification successfull", user, 1);
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
        console.log("logout");
        req.session.destroy(function () {
            Response(res, "Disconnected", null, 1);
        });
    }
}

/**
 * Encrypt the password<br>
 * <b>[Private Function]</b>
 * @memberof Authentification
 * @param {Express.Request} req - request send
 * @param {Express.Response} res - variable to send the response
 */
function encryptPassword(password) {
    return '098f6bcd4621d373cade4e832627b4f6';
}