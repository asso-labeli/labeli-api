/**
 * <h2>Model</h2>
 * <table>
 * <tr><td><b>Name</b></td><td><b>Type</b></td><td><b>Default Value</b></td></tr>
 * <tr><td>name</td><td>String</td></tr>
 * <tr><td>picture</td><td>String</td><td>null</td></tr>
 * <tr><td>type</td><td>Number</td><td>0</td></tr>
 * <tr><td>description</td><td>String</td><td>' '</td></tr>
 * <tr><td>created</td><td>Date</td><td>Date.now</td></tr>
 * <tr><td>lastEdited</td><td>Date</td><td>Date.now</td></tr>
 * <tr><td>picture</td><td>String</td><td>' '</td></tr>
 * <tr><td>status</td><td>Number</td><td>0</td></tr>
 * <tr><td>author</td><td>ObjectId</td></tr>
 * </table><br>
 * <h2>Routing Table</h2>
 * <table>
 * <tr><td>POST /projects/</td><td>{@link Project.createProject}</td></tr>
 * <tr><td>GET /projects/</td><td>{@link Project.getProjects}</td></tr>
 * <tr><td>GET /projects/:project_id</td><td>{@link Project.getProject}</td></tr>
 * <tr><td>PUT /projects/:project_id</td><td>{@link Project.editProject}</td></tr>
 * <tr><td>DELETE /projects/:project_id</td><td>{@link Project.deleteProject}</td></tr></table><br>
 * <h2>Constants</h2>
 * <h5>Project.Type</h5>
 * <table>
 * <tr><td>Project</td><td>0</td></tr>
 * <tr><td>Event</td><td>1</td></tr>
 * <tr><td>Team</td><td>2</td></tr></table>
 * <h5>Project.Status</h5>
 * <table>
 * <tr><td>Preparation</td><td>0</td></tr>
 * <tr><td>Vote</td><td>1</td></tr>
 * <tr><td>Working</td><td>2</td></tr>
 * <tr><td>Archived</td><td>3</td></tr></table>
 * @namespace Project
 * @author Florian Kauder
 */

var Project = require('../models/project');
var User = require('../models/user');
var ProjectUser = require('../models/projectUser');
var Vote = require('../models/vote');
var Message = require('../models/message');
var Response = require('../modules/response');
var Log = require('../modules/log');

var isMongooseId = require('mongoose').Types.ObjectId.isValid;

var express = require('express');
var async = require('async');
var calls = [];

var router = express.Router();

router.route('/projects').post(createProject);
router.route('/projects').get(getProjects);
router.route('/projects/:project_id').get(getProject);
router.route('/projects/:project_id').put(editProject);
router.route('/projects/:project_id').delete(deleteProject);

module.exports = router;

/**
 * Create a new project<br>
 * <b>Level needed :</b> Admin<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-1</td><td>Not logged</td></tr>
 * <tr><td>-2</td><td>Access denied (need more permissions)</td></tr>
 * <tr><td>-11</td><td>Missing name</td></tr>
 * <tr><td>-12</td><td>Missing type</td></tr>
 * <tr><td>-13</td><td>Missing authorUsername</td></tr>
 * <tr><td>-22</td><td>AuthorUsername not found</td></tr>
 * <tr><td>-23</td><td>Error during creation of projectUser</td></tr>
 * <tr><td>-27</td><td>MangoDB error during find()</td></tr>
 * <tr><td>-29</td><td>MangoDB error during save()</td></tr>
 * </table>
 * @memberof Project
 * @param {Express.Request} req - request send
 * @param {String} req.body.name - name of the project
 * @param {String} req.body.type - type of the project
 * @param {String} req.body.authorUsername - author username of the project
 * @param {Express.Response} res - variable to send the response
 */
function createProject(req, res) {
  if (req.session.level == User.Level.Guest) {
    Response.notLogged(res);
    return;
  }
  else if (req.session.level < User.Level.Admin) {
    Response.notAdmin();
    return;
  }

  var project = new Project();

  // Check request variables
  if (!("name" in req.body)) {
    Response.missing(res, 'name', -11);
    return;
  }
  else if (!("type" in req.body)) {
    Response.missing(res, 'type', -12);
    return;
  }
  else if (!("authorUsername" in req.body)) {
    Response.missing(res, 'authorUsername', -13);
    return;
  }

  // Setting new project values
  project.name = req.body.name;
  project.type = req.body.type;

  User.findOne({
      username: req.body.authorUsername.toLowerCase()
    },
    function afterUserSearch(err, user) {
      if (err)
        Response.findError(res, err);
      else if (user === null)
        Response.notFound(res, 'authorUsername');
      else {
        project.author = user._id;
        project.save(function afterProjectSave(err) {
          if (err) Response.saveError(res, err);
          else {
            var projectUser = new ProjectUser();
            projectUser.author = project.author;
            projectUser.project = project;
            projectUser.level = ProjectUser.Level.Creator;

            projectUser.save(function afterProjectUserSave(err) {
              if (err) Response.serverError(res,
                "Error during projectUser creation", null, -23);
              else {
                Response.success(res, 'Project created', project);
                Log.i("Project \"" + project.name + "\"(" + project._id +
                  ") created by user " + req.session.userId);
              }
            });
          }
        });
      }
    });
}

/**
 * Get all projects<br>
 * <b>Level needed :</b> Guest<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-22</td><td>No project found</td></tr>
 * <tr><td>-27</td><td>MongoDB error during find()</td></tr>
 * </table>
 * @memberof Project
 * @param {Express.Request} req - request send
 * @param {Express.Response} res - variable to send the response
 */
function getProjects(req, res) {
  Project.find(function afterProjectSearch(err, projects) {
    if (err) Response.findError(res, err);
    else if (typeof projects === 'undefined' ||  projects.length == 0)
      Response.notFound(res, 'project');
    else Response.success(res, "Projects found", projects);
  });
}

/**
 * Get a specific project<br>
 * <b>Level needed :</b> Guest<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-22</td><td>No project found</td></tr>
 * <tr><td>-27</td><td>MongoDB error during find()</td></tr>
 * <tr><td>-31</td><td>ID not valid</td></tr>
 * </table>
 * @memberof Project
 * @param {Express.Request} req - request send
 * @param {ObjectID} [req.params.project_id] - ID of project
 * @param {Express.Response} res - variable to send the response
 */
function getProject(req, res) {
  if (isMongooseId(req.params.project_id))
    Project.findById(req.params.project_id,
      function afterProjectSearch(err, project) {
        if (err) Response.findError(res, err);
        else if (project == null)
          Response.notFound(res, 'project');
        else Response.success(res, "Project Found", project);
      });
  else
    Response.invalidID(res);
}

/**
 * Edit a project<br>
 * <b>Level needed :</b> Owner | Admin<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-1</td><td>Not logged</td></tr>
 * <tr><td>-2</td><td>Access denied (need more permissions)</td></tr>
 * <tr><td>-22</td><td>Project not found</td></tr>
 * <tr><td>-23</td><td>Project updated but authorUsername not found</td></tr>
 * <tr><td>-27</td><td>MangoDB error during find()</td></tr>
 * <tr><td>-29</td><td>MangoDB error during save()</td></tr>
 * <tr><td>-31</td><td>ID not valid</td></tr>
 * </table>
 * @memberof Project
 * @param {Express.Request} req - request send
 * @param {String} [req.body.name] - New name
 * @param {Number} [req.body.status] - New status
 * @param {String} [req.body.description] - New description
 * @param {Number} [req.body.type] - New type
 * @param {String} [req.body.authorUsername] - New author username
 * @param {ObjectID} [req.params.project_id] - ID of project to edit
 * @param {Express.Response} res - variable to send the response
 */
function editProject(req, res) {
  if (req.session.level < User.Level.OldMember)
    Response.notLogged(res);
  else if (!isMongooseId(req.params.project_id))
    Response.invalidID(res);
  else
    Project.findById(req.params.project_id,
      function afterProjectSearch(err, project) {
        if (err) {
          Response.findError(res, err);
          return;
        }
        else if (project == null) {
          Response.notFound(res, 'project');
          return;
        }
        else if ((project.author != req.session.userId) &&
          (req.session.level < User.Level.Admin)) {
          Response.notAdmin();
          return;
        }

        var usernameFound = true;

        // Edit project values
        if ("name" in req.body) project.name = req.body.name;
        if ("status" in req.body) project.status = req.body.status;
        if ("description" in req.body)
          project.description = req.body.description;
        if ("type" in req.body) project.type = req.body.type;
        if ("picture" in req.body) project.picture = req.body.picture;
        if ("authorUsername" in req.body)
          calls.push(function searchUserWithUsername(callback) {
            User.findOne({
                username: req.body.authorUsername.toLowerCase()
              },
              function afterUserSearch(err, user) {
                if (err) usernameFound = false;
                else project.author = user._id;
                callback();
              });
          });

        project.lastEdited = Date.now();

        // Wait and save the project
        async.parallel(calls, function afterProjectIsEdited() {
          project.save(function afterProjectSave(err) {
            if (err) Response.saveError(res, err);
            else if (!usernameFound)
              Response.serverError(res,
                'Error : Project updated but authorUsername not found',
                project, -23);
            else {
              Response.success(res, 'Project updated', project);
              Log.i("Project \"" + project.name + "\"(" + project._id +
                ") edited by user " + req.session.userId);
            }
          });
        });
      });
}

/**
 * Delete a project<br>
 * <b>Level needed :</b> Admin<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-1</td><td>Not logged</td></tr>
 * <tr><td>-2</td><td>Access denied (need more permissions)</td></tr>
 * <tr><td>-23</td><td>Project remove, but some datas always exist (datas are detailled in message)</td></tr>
 * <tr><td>-28</td><td>MangoDB error during remove()</td></tr>
 * </table>
 * @memberof Project
 * @param {Express.Request} req - request send
 * @param {ObjectID} [req.params.project_id] - ID of project to delete
 * @param {Express.Response} res - variable to send the response
 */
function deleteProject(req, res) {
  if (req.session.level < User.Level.OldMember) {
    Response.notLogged(res);
    return;
  }
  else if (req.session.level < User.Level.Admin) {
    Response.notAdmin(res);
    return;
  }

  // Remove the project
  Project.remove({
    _id: req.params.project_id
  }, function afterProjectRemove(err, project) {
    if (err) Response.removeError(res, err);
    else {
      var errors = [];
      var voteDeleted = true;
      var projectUserDeleted = true;
      var messageDeleted = true;

      // Remove all votes with this project
      calls.push(function removeVotes(callback) {
        Vote.remove({
          project: req.params.project_id
        }, function afterVoteRemove(err) {
          if (err) {
            voteDeleted = false;
            errors.push(err);
          }
          callback();
        });
      });

      // Remove all projectUsers with this project
      calls.push(function removeProjectUsers(callback) {
        ProjectUser.remove({
          project: req.params.project_id
        }, function afterProjectUserRemove(err) {
          if (err) {
            projectUserDeleted = false;
            errors.push(err);
          }
          callback();
        });
      });

      // Remove all messages with this project
      calls.push(function removeMessages(callback) {
        Message.remove({
          project: req.params.project_id
        }, function afterMessageRemove(err) {
          if (err) {
            messageDeleted = false;
            errors.push(err);
          }
          callback();
        });
      });

      // Wait and send result of deleting
      async.parallel(calls, function afterDataRemove() {
        var errorMessage = "Error during delete :";
        if (!voteDeleted) errorMessage += "Vote ";
        if (!projectUserDeleted) errorMessage += "ProjectUser ";
        if (!messageDeleted) errorMessage += "Message ";

        if (voteDeleted && projectUserDeleted && messageDeleted) {
          Response.success(res, 'Project deleted', project);
          Log.i("Project \"" + project.name + "\"(" + project._id +
            ") deleted by user " + req.session.userId);
        }
        else
          Response.serverError(res, errorMessage, errors, -23);
      });
    }
  });
}
