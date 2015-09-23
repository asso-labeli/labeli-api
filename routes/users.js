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
 * <tr><td>lastEdited</td><td>Date</td><td>Date.now</td></tr>
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
var apiConf = require('../modules/apiConf');
var Mailer = require('../modules/mail');
var PasswordGenerator = require('../modules/passwordGenerator');
var Log = require('../modules/log');

var isMongooseId = require('mongoose').Types.ObjectId.isValid;
var express = require('express');
var router = express.Router();

router.route('/users').post(createUser);
router.route('/users').get(getUsers);
router.route('/users').put(editLoggedUser);
router.route('/users/:user_id').get(getUser);
router.route('/users/:user_id').put(editUser);
router.route('/users/:user_id').delete(deleteUser);
if (apiConf.debugMode)
  router.route('/admin').post(createAdmin);

module.exports = router;

/**
 * Get string select query for a specific level.<br>
 * This function select datas who must to be send.<br>
 * <b>PRIVATE FUNCTION</b>
 * @memberof User
 * @param {Number} level - level of user
 */
function getSelectQueryForLevel(level) {
  if (level < User.Level.Member)
    return 'firstName lastName role level picture';
  else
    return '-passwordHash -privateKey';
}

/**
 * Create a new user<br>
 * <b>Level needed :</b> Admin<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-1</td><td>Not logged</td></tr>
 * <tr><td>-2</td><td>Access denied (need more permissions)</td></tr>
 * <tr><td>-11</td><td>Missing firstName</td></tr>
 * <tr><td>-12</td><td>Missing lastName</td></tr>
 * <tr><td>-13</td><td>Missing email</td></tr>
 * <tr><td>-21</td><td>Email already exists</td></tr>
 * <tr><td>-29</td><td>MongoDB error during save()</td></tr>
 * </table>
 * @memberof User
 * @param {Express.Request} req - request send
 * @param {String} req.body.firstName - first name of user
 * @param {String} req.body.lastName - last name of user
 * @param {String} req.body.email - email of user
 * @param {Express.Response} res - variable to send the response
 */
function createUser(req, res) {
  if (req.session.level == User.Level.Guest) {
    Response.notLogged(res);
    return;
  }
  else if (req.session.level < User.Level.Admin) {
    Response.notAdmin(res);
    return;
  }

  var user = new User();

  // Check req variables
  if (!("firstName" in req.body)) {
    Response.missing(res, 'firstName', -11);
    return;
  }
  else if (!("lastName" in req.body)) {
    Response.missing(res, 'lastName', -12);
    return;
  }
  else if (!("email" in req.body)) {
    Response.missing(res, 'email', -13);
    return;
  }

  // Setting user values
  user.firstName = req.body.firstName;
  user.lastName = req.body.lastName;
  user.email = req.body.email;

  createUsername(res, user, function afterUsenameCreation(user) {
    // Error send by createUsername, so leave the function
    if (user == null) return;

    // Create random passwords and salt
    user.privateKey = PasswordGenerator.generateRandomString(32);
    var password = PasswordGenerator.generateRandomString(9);

    PasswordGenerator.encryptPassword(password,
      user.privateKey,
      function afterPasswordCreation(key) {
        // Stock the password in readable format
        user.passwordHash = key.toString("base64");
        user.save(function afterUserSave(err) {
          if (err) {
            if (err.code == 11000) // Duplicate email
              Response.alreadyExist(res, 'email');
            else
              Response.saveError(res, err);
          }
          else {
            Response.success(res, 'User created', user);
            Mailer.sendInscriptionMail(
              user.email,
              user.username,
              password);
            Log.i("User \"" + user.username + "\"(" + user._id +
              ") created by user " + req.session.userId);
          }
        });
      });
  });
}

/**
 * Create username for a user with an analysis of existing usernames.<br>
 * <b>PRIVATE FUNCTION</b>
 * @memberof User
 * @param {Express.Response} res - variable to send response
 * @param {User} user - variable with firstName and lastName fields
 * @param {Function} callback - function to call when username is created
 */
function createUsername(res, user, callback) {
  var username = user.firstName.replace(/\s/g, '').toLowerCase() + "." +
    user.lastName.replace(/\s/g, '').toLowerCase();

  User.find({
    username: {
      "$regex": username,
      "$options": "i"
    }
  }, function afterUserSearch(err, users) {
    if (err) {
      Response.findError(res, err);
      callback(null);
    }
    else {
      if (typeof users === 'undefined' || users.length == 0) {
        user.username = username;
        callback(user);
      }
      else {
        var tmp = 1;
        var usernameFound = false;

        while (!usernameFound) {
          var usernameExist = false;

          for (var i = 0; i < users.length; i++) {
            if (users[i].username == (username + tmp))
              usernameExist = true;
          }

          if (!usernameExist) {
            usernameFound = true;
            username = username + tmp;
          }
          else
            tmp++;
        }

        user.username = username;

        callback(user);
      }
    }
  });
}

/**
 * Get all users<br>
 * Under Level.Member, datas are : firstName - lastName - role - level
 * Else, all datas (except passwordhash and privateKey) are get
 * <b>Level needed :</b> Guest<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-22</td><td>No users found</td></tr>
 * <tr><td>-27</td><td>MangoDB error during find()</td></tr>
 * </table>
 * @memberof User
 * @param {Express.Request} req - request send
 * @param {Express.Response} res - variable to send the response
 */
function getUsers(req, res) {
  var selectQuery = getSelectQueryForLevel(req.session.level);

  User.find().select(selectQuery)
    .exec(function afterUserSearch(err, users) {
      if (err) Response.findError(res, err);
      else if (typeof users === 'undefined' ||  users.length == 0)
        Response.notFound(res, 'user');
      else Response.success(res, "Users found", users);
    });
}

/**
 * Get a specific user<br>
 * <b>Level needed :</b> Guest<br>
 * Under Level.Member, datas are : firstName - lastName - role - level
 * Else, all datas (except passwordhash and privateKey) are get
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-22</td><td>No users found</td></tr>
 * <tr><td>-27</td><td>MangoDB error during find()</td></tr>
 * </table>
 * @memberof User
 * @param {Express.Request} req - request send
 * @param {ObjectId} req.params.user_id - User Id OR User username
 * @param {Express.Response} res - variable to send the response
 */
function getUser(req, res) {
  var selectQuery = getSelectQueryForLevel(req.session.level);

  // If is an ID, search with id
  if (isMongooseId(req.params.user_id)) {
    User.findById(req.params.user_id)
      .select(selectQuery)
      .exec(function afterUserSearch(err, user) {
        if (err) Response.findError(res, err);
        else if (user == null) Response.notFound(res, 'user');
        else Response.success(res, "User found", user);
      });
  }
  else { // Username case
    User.findOne({
        username: req.params.user_id
      }).select(selectQuery)
      .exec(function afterUserSearch(err, user) {
        if (err) Response.findError(res, err);
        else if (user == null) Response.notFound(res, 'user');
        else Response.success(res, "User found", user);
      });
  }
}

/**
 * Edit a user<br>
 * <b>Level needed :</b> Owner | Admin<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-1</td><td>Not logged</td></tr>
 * <tr><td>-2</td><td>Access denied (need more permissions)</td></tr>
 * <tr><td>-22</td><td>User not found</td></tr>
 * <tr><td>-23</td><td>Error during password creation</td></tr>
 * <tr><td>-27</td><td>MangoDB error during find()</td></tr>
 * <tr><td>-29</td><td>MangoDB error during save()</td></tr>
 * <tr><td>-31</td><td>ID not valid</td></tr>
 * </table>
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
 * @param {String} [req.body.password] - New password
 * @param {ObjectID} [req.params.user_id] - ID of user to edit
 * @param {Express.Response} res - variable to send the response
 */
function editUser(req, res) {
  if (req.session.level < User.Level.OldMember) Response.notLogged(res);
  else if (!isMongooseId(req.params.user_id)) Response.invalidID(res);
  else
    User.findById(req.params.user_id, function afterUserSearch(err, user) {
      if (err) Response.findError(res, err);
      else if (user == null) Response.notFound(res, 'user');
      else if ((user._id != req.session.userId) &&
        (req.session.level < User.Level.Admin))
        Response.notAdmin(res);
      else {
        user.lastEdited = Date.now();
        if ("firstName" in req.body) user.firstName = req.body.firstName;
        if ("lastName" in req.body) user.lastName = req.body.lastName;
        if ("email" in req.body) user.email = req.body.email;
        if ("website" in req.body) user.website = req.body.website;
        if ("universityGroup" in req.body)
          user.universityGroup = req.body.universityGroup;
        if ("birthday" in req.body) user.birthday = new Date(req.body.birthday);
        if ("description" in req.body) user.description = req.body.description;
        if ("picture" in req.body) user.picture = req.body.picture;
        // Edit role if logged user is an admin
        if ("role" in req.body && req.session.level == User.Level.Admin)
          user.role = req.body.role;
        if ("password" in req.body) {
          // Create random salt
          user.privateKey = PasswordGenerator.generateRandomString(32);

          PasswordGenerator.encryptPassword(req.body.password,
            user.privateKey,
            function afterPasswordCreated(err, key) {
              if (!err) {
                // Stock the password in readable format
                user.passwordHash = key.toString("base64");
                user.save(function afterUserSaved(err) {
                  if (err) Response.saveError(res, err);
                  else {
                    Response(res, 'User updated', user, 1);
                    Log.i("User \"" + user.username + "\"(" + user._id +
                      ") edited by user " + req.session.userId);
                  }
                });
              }
              else
                Response.serverError(res, "Error during creating password",
                  err, -23);
            });
        }
        else user.save(function afterUserSaved(err) {
          if (err) Response.saveError(res, err);
          else Response.success(res, 'User updated', user);
        });
      }
    });
}

/**
 * Edit the current logged user<br>
 * <b>Level needed :</b> Member<br>
 * Same documentation for : {@link User.editUser}
 * @memberof User
 * @param {Express.Request}  req - request send
 * @param {Express.Response} res - variable to send the response
 */
function editLoggedUser(req, res) {
  req.params.user_id = req.session.userId;
  editUser(req, res);
}

/**
 * Delete a user<br>
 * <b>Level needed :</b> Admin<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-1</td><td>Not logged</td></tr>
 * <tr><td>-2</td><td>Access denied (need more permissions)</td></tr>
 * <tr><td>-28</td><td>MangoDB error during remove()</td></tr>
 * </table>
 * @memberof User
 * @param {Express.Request} req - request send
 * @param {ObjectID} [req.params.user_id] - ID of user to delete
 * @param {Express.Response} res - variable to send the response
 */
function deleteUser(req, res) {
  if (req.session.level < User.Level.OldMember)
    Response.notLogged(res);
  else if (req.session.level < User.Level.Admin)
    Response.notAdmin(res);
  else
    User.remove({
      _id: req.params.user_id
    }, function(err, user) {
      if (err) Response.removeError(res, err);
      else {
        Response.success(res, 'User deleted', user);
        Log.i("User \"" + user.username + "\"(" + user._id +
          ") deleted by user " + req.session.userId);
      }
    });
}

// Function available only in debug mode
function createAdmin(req, res) {
  var user = new User();

  user.firstName = "AdminTest";
  user.lastName = "AdminTest";
  user.email = "admin@test.com";
  user.level = User.Level.Admin;

  user.username = user.firstName.replace(/\s/g, '').toLowerCase() + "." +
    user.lastName.replace(/\s/g, '').toLowerCase();
  user.privateKey = "poulpe";
  user.passwordHash = "098f6bcd4621d373cade4e832627b4f6";

  user.save(function(err) {
    if (err) Response.saveError(res, err);
    else Response.success(res, 'Admin created', user);
    createUserTest(1);
  });
}

// Function available only in debug mode
function createUserTest(n) {
  var user = new User();

  user.firstName = "UserTest"+n;
  user.lastName = "UserTest"+n;
  user.email = "user"+n+"@test.com";

  user.username = user.firstName.replace(/\s/g, '').toLowerCase() + "." +
    user.lastName.replace(/\s/g, '').toLowerCase();
  user.privateKey = "poulpe";
  user.passwordHash = "098f6bcd4621d373cade4e832627b4f6";

  user.save(function(err) {
    if (n == 1) createUserTest(2);
  });
}
