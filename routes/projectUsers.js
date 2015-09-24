/**
 * This is the link between User module and Project module.<br>
 * Creator can only be set during creation of project.<br>
 * <h2>Model</h2>
 * <table>
 * <tr><td><b>Name</b></td><td><b>Type</b></td><td><b>Default Value</b></td></tr>
 * <tr><td>created</td><td>Date</td><td>Date.now</td></tr>
 * <tr><td>level</td><td>Number</td><td>0</td></tr>
 * <tr><td>lastEdited</td><td>Date</td><td>Date.now</td></tr>
 * <tr><td>user</td><td>ObjectId</td></tr>
 * <tr><td>project</td><td>ObjectId</td></tr>
 * </table><br>
 * <h2>Routing Table</h2>
 * <table>
 * <tr><td>POST /projectUsers/:project_id</td><td>{@link ProjectUser.createOrEditProjectUser}</td></tr>
 * <tr><td>GET /projectUsers/:project_id</td><td>{@link ProjectUser.getProjectUsers}</td></tr>
 * <tr><td>GET /projectUser/:projectUser_id</td><td>{@link ProjectUser.getProjectUser}</td></tr>
 * <tr><td>DELETE /projectUser/:projectUser_id</td><td>{@link ProjectUser.deleteProjectUser}</td></tr></table><br>
 * <h2>Constants</h2>
 * <h5>ProjectUser.Level</h5>
 * <table>
 * <tr><td>Member</td><td>0</td></tr>
 * <tr><td>Administrator</td><td>1</td></tr>
 * <tr><td>Creator</td><td>2</td></tr>
 * </table>
 * @namespace ProjectUser
 * @author Florian Kauder
 */

var Project = require('../models/project');
var User = require('../models/user');
var ProjectUser = require('../models/projectUser');
var Response = require('../modules/response');

var isMongooseId = require('mongoose').Types.ObjectId.isValid;

var express = require('express');
var async = require('async');
var calls = [];

var router = express.Router();

router.route('/projectUsers/:project_id').post(createOrEditProjectUser);
router.route('/projectUsers/:project_id').get(getProjectUsers);
router.route('/projectUser/:projectUser_id').get(getProjectUser);
router.route('/projectUser/:projectUser_id').delete(deleteProjectUser);

module.exports = router;

/**
 * Create or edit a new projectUser<br>
 * <b>Level needed :</b><br>
 * - At least <i>ProjectUser.Level.Admin</i> to invite someone or to name a new admin<br>
 * - <i>User.Member</i> to join a project<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-1</td><td>Not logged</td></tr>
 * <tr><td>-2</td><td>Not admin</td></tr>
 * <tr><td>-3</td><td>Not at least a member</td></tr>
 * <tr><td>-22</td><td>Project/User not found</td></tr>
 * <tr><td>-29</td><td>MangoDB error during save()</td></tr>
 * <tr><td>-31</td><td>ID not valid</td></tr>
 * <tr><td>-32</td><td>Invalid level in body</td></tr>
 * </table>
 * @memberof ProjectUser
 * @param {Express.Request} req - request send
 * @param {String} [req.body.level=0] - level to give to user in project
 * @param {ObjectID} [req.body.username] - name of user to join to the project
 * @param {String} req.params.project_id - ID of the reference project
 * @param {Express.Response} res - variable to send the response
 */
function createOrEditProjectUser(req, res) {
  if (req.session.level < User.Level.OldMember) {
    Response.notLogged(res);
    return;
  }
  else if (res.session.level < User.Level.Member) {
    Response.notMember(res);
    return;
  }
  else if (!isMongooseId(req.params.project_id)) {
    Response.invalidID(res);
    return;
  }

  var projectUser = new ProjectUser();
  var project = null;
  var projectUserOfClient = null;

  var userFound = true;
  var projectFound = true;

  // Check variables in body
  if (!('level' in req.body)) {
    req.body.level = 0;
  }
  else if (req.body.level >= ProjectUser.Level.Creator) {
    Response.invalidParameter(res, 'level');
    return;
  }

  // Search datas in database
  async.series([
      // Search the project
      function searchProject(callback) {
        Project.findById(req.params.project_id,
          function afterProjectSearch(err, project) {
            if (err || project == null) projectFound = false;
            else projectUser.project = project._id;
            callback();
          })
      },
      // Search user
      function searchUser(callback) {
        if ("username" in req.body)
        // Case where a user want to add another user to project
          User.findOne({
            username: req.body.username.toLowerCase()
          },
          function afterUserSearch(err, user) {
            if (err || user == null) userFound = false;
            else projectUser.user = user._id;
            callback();
          });
        else {
          // Case where a user want to take part in project
          projectUser.user = req.session.userId;
          callback();
        }

      },
      function searchProjectUserOfClient(callback) {
        // Search ProjectUser of the client
        ProjectUser.findOne({
          user: req.session.userId,
          project: projectUser.project
        }, function afterProjectUserSearch(err, pu) {
          projectUserOfClient = pu;
          callback();
        });
      }
    ],

    function afterSearch() {
      if (!projectFound)
        Response.notFound(res, 'project');
      else if (!userFound)
        Response.notFound(res, 'user');
      // Case where a user want to add another user to project
      else if ("username" in req.body) {
        // Client not found in project
        if (projectUserOfClient == null)
          Response.notAdmin(res);
        // Client not admin or creator of project
        else if (projectUserOfClient.level < ProjectUser.Level.Admin)
          Response.notAdmin(res);
        // Client is admin, so add the user to project
        else {
          ProjectUser.findOne({
              user: projectUser.user,
              project: projectUser.project
            },
            function afterPUSearch(err, pu) {
              if (err || pu == null) {
                projectUser.level = req.body.level;
                projectUser.save(function afterPUSave(err) {
                  if (err) Response.saveError(res, err);
                  else Response.success(res,
                    'ProjectUser created', projectUser);
                });
              }
              else {
                pu.level = req.body.level;
                pu.save(function afterPUSave(err) {
                  if (err) Response.saveError(res, err);
                  else Response.success(res,
                    'ProjectUser updated', pu);
                });
              }
            });
        }
      }
      else {
        // Already member of project
        if (projectUserOfClient != null) {
          Response.success(res, 'ProjectUser already good',
            projectUserOfClient);
        }
        else {
          projectUser.level = ProjectUser.Level.Member;
          projectUser.save(function afterPUSave(err) {
            if (err) Response.saveError(res, err);
            else Response.success(res, 'ProjectUser created',
              projectUser);
          });
        }
      }
    });
}

/**
 * Get all projectUsers of a project<br>
 * <b>Level needed :</b> Guest<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-22</td><td>No users found</td></tr>
 * <tr><td>-27</td><td>MangoDB error during find()</td></tr>
 * <tr><td>-31</td><td>Invalid ID</td></tr>
 * </table>
 * @memberof ProjectUser
 * @param {Express.Request} req - request send
 * @param {String} req.params.project_id - ID of the reference project
 * @param {Express.Response} res - variable to send the response
 */
function getProjectUsers(req, res) {
  if (!isMongooseId(req.params.project_id))
    Response.invalidID(res);
  else
    ProjectUser.find({
      project: req.params.project_id
    }, function afterPUSearch(err, projectUsers) {
      if (err) Response.findError(res, err);
      else if (typeof projectUsers === 'undefined' ||  
        projectUsers.length == 0)
        Response.notFound(res, 'projectUser');
      else Response.success(res, "ProjectUsers found", projectUsers);
    });
}

/**
 * Get a specific projectUser<br>
 * <b>Level needed :</b> Guest<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-22</td><td>No users found</td></tr>
 * <tr><td>-27</td><td>MangoDB error during find()</td></tr>
 * <tr><td>-31</td><td>Invalid ID</td></tr>
 * </table>
 * @memberof ProjectUser
 * @param {Express.Request} req - request send
 * @param {String} req.params.projectUser_id - ID of the projectUser
 * @param {Express.Response} res - variable to send the response
 */
function getProjectUser(req, res) {
  if (!isMongooseId(req.params.projectUser_id))
    Response.invalidID(res);
  else
    ProjectUser.findById(req.params.projectUser_id,
      function afterPUSearch(err, projectUser) {
        if (err) Response.findError(res, err);
        else if (projectUser == null)
          Response.notFound(res, 'projectUser');
        else
          Response.success(res, "ProjectUser found", projectUser);
      });
}

/**
 * Delete a projectUser<br><br>
 * <b>/!\</b> : Creator cannot be kicked.<br>
 * To delete him, you must delete the project.<br>
 * <b>Level needed :</b> <br>
 * - At least <i>ProjectUser.Level.Admin</i> to kick someone<br>
 * - <i>ProjectUser.Level.Member</i> to leave the project<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-1</td><td>Not logged</td></tr>
 * <tr><td>-2</td><td>Not admin</td></tr>
 * <tr><td>-5</td><td>Not allowed (cannot kick the creator)</td></tr>
 * <tr><td>-22</td><td>ProjectUser not found</td></tr>
 * <tr><td>-27</td><td>MangoDB error during find()</td></tr>
 * <tr><td>-28</td><td>MangoDB error during remove()</td></tr>
 * <tr><td>-31</td><td>Invalid ID</td></tr>
 * </table>
 * @memberof ProjectUser
 * @param {Express.Request} req - request send
 * @param {String} req.params.projectUser_id - ID of the projectUser to delete
 * @param {Express.Response} res - variable to send the response
 */
function deleteProjectUser(req, res) {
  if (req.session.level < User.Level.OldMember) {
    Response.notLogged(res);
    return;
  }
  else if (!isMongooseId(req.params.projectUser_id)){
    Response.invalidID(res);
    return;
  }

  var projectUser = null;
  var projectUserOfClient = null;

  async.series([
      // Search the projectUser to delete
      function searchProjectUser(callback) {
        ProjectUser.findById(req.params.projectUser_id,
          function afterPUSearch(err, pu) {
            if (err) Response.findError(res, err);
            else if (pu == null)
              Response.notFound(res, 'projectUser');
            else projectUser = pu;
            callback();
          })
      },
      // Search the projectUser of Client
      function searchProjectUserOfClient(callback) {
        if (projectUser != null) {
          ProjectUser.findOne({
              user: req.session.userId,
              project: projectUser.project
            },
            function afterPUClientSearch(err, pu) {
              projectUserOfClient = pu;
              callback();
            });
        }
        else callback();
      }
    ],
    function afterSearch() {
      // ProjectUser not found : message send in searchProjectUser()
      if (projectUser == null) return;
      // Creator cannot be kicked
      else if (projectUser.level == ProjectUser.Level.Creator)
        Response.notAllowed(res);
      // Need to be at least an admin to kick
      else if (projectUserOfClient.level < ProjectUser.Level.Admin)
        Response.notAdmin(res);
      else
        ProjectUser.remove({
          _id: req.params.projectUser_id
        }, function afterPURemove(err, projectUser) {
          if (err) Response.removeError(res, err);
          else Response.success(res, 'ProjectUser deleted', projectUser);
        });
    });
}
