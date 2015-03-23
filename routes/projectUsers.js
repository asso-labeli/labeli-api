/**
 * This is the link between User module and Project module.<br>
 * Creator can only be set during creation of project.<br>
 * <h2>Model</h2>
 * <table>
 * <tr><td><b>Name</b></td><td><b>Type</b></td><td><b>Default Value</b></td></tr>
 * <tr><td>created</td><td>Date</td><td>Date.now</td></tr>
 * <tr><td>level</td><td>Number</td><td>0</td></tr>
 * <tr><td>author</td><td>ObjectId</td></tr>
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
 * - <i>User.Member</i> to join a project
 * @memberof ProjectUser
 * @param {Express.Request} req - request send
 * @param {String} [req.body.level=0] - level to give to user in project
 * @param {ObjectID} [req.body.username] - name of user to join to the project
 * @param {String} req.params.project_id - ID of the reference project
 * @param {Express.Response} res - variable to send the response
 */
function createOrEditProjectUser(req, res) {
    if (req.session.level < User.Level.OldMember) {
        Response(res, "Error : Not logged", null, 0);
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
    } else if (req.body.level >= ProjectUser.Level.Creator) {
        Response(res, "Error : Impossible to name a new creator");
        return;
    }

    // Search datas in database
    async.series([
        // Search the project
        function searchProject(callback) {
                Project.findById(req.params.project_id,
                    function (err, project) {
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
                    function (err, user) {
                        if (err || user == null) userFound = false;
                        else projectUser.author = user._id;
                        callback();
                    });
                else {
                    // Case where a user want to take part in project
                    projectUser.author = req.session.userId;
                    callback();
                }

        },
        function searchProjectUserOfClient(callback) {
                // Search ProjectUser of the client
                ProjectUser.findOne({
                    author: req.session.userId,
                    project: projectUser.project
                }, function (err, pu) {
                    console.log("found : " + pu);
                    projectUserOfClient = pu;
                    callback();
                });
        }],

        function useResult() {
            if (!projectFound)
                Response(res, "Error : Project not found", null, 0);
            else if (!userFound)
                Response(res, "Error : User not found", null, 0);
            // Case where a user want to add another user to project
            else if ("username" in req.body) {
                // Client not found in project
                if (projectUserOfClient == null)
                    Response(res, "Error : You're not an admin", null, 0);
                // Client not admin or creator of project
                else if (projectUserOfClient.level < ProjectUser.Level.Admin)
                    Response(res, "Error : You're not an admin", null, 0);
                // Client is admin, so add the user to project
                else {
                    ProjectUser.findOne({
                            author: projectUser.author,
                            project: projectUser.project
                        },
                        function (err, pu) {
                            if (err || pu == null) {
                                projectUser.level = req.body.level;
                                projectUser.save(function (err) {
                                    if (err) Response(res, "Error", err, 0);
                                    else Response(res, 'ProjectUser created',
                                        projectUser, 1);
                                });
                            } else {
                                pu.level = req.body.level;
                                pu.save(function (err) {
                                    if (err) Response(res, "Error", err, 0);
                                    else Response(res, 'ProjectUser updated',
                                        pu, 1);
                                });
                            }
                        });
                }
            } else {
                // Already member of project
                if (projectUserOfClient != null) {
                    Response(res, 'ProjectUser already good',
                        projectUserOfClient, 1);
                } else {
                    projectUser.level = ProjectUser.Level.Member;
                    projectUser.save(function (err) {
                        if (err) Response(res, "Error", err, 0);
                        else Response(res, 'ProjectUser created',
                            projectUser, 1);
                    });
                }
            }
        });
}

/**
 * Get all projectUsers of a project<br>
 * <b>Level needed :</b> Guest
 * @memberof ProjectUser
 * @param {Express.Request} req - request send
 * @param {String} req.params.project_id - ID of the reference project
 * @param {Express.Response} res - variable to send the response
 */
function getProjectUsers(req, res) {
    ProjectUser.find({
        project: req.params.project_id
    }, function (err, projectUsers) {
        if (err) Response(res, "Error", err, 0);
        else if (projectUsers == null) 
            Response(res, "Error : No ProjectUsers found", null, 0);
        else Response(res, "ProjectUsers found", projectUsers, 1);
    });
}

/**
 * Get a specific projectUser<br>
 * <b>Level needed :</b> Guest
 * @memberof ProjectUser
 * @param {Express.Request} req - request send
 * @param {String} req.params.projectUser_id - ID of the projectUser
 * @param {Express.Response} res - variable to send the response
 */
function getProjectUser(req, res) {
    ProjectUser.findById(req.params.projectUser_id,
        function (err, projectUser) {
            if (err)
                Response(res, "Error", err, 0);
            else if (projectUser == null)
                Response(res, "Error : ProjectUser not found", null, 0);
            else
                Response(res, "ProjectUser found", projectUser, 1);
        });
}

/**
 * Delete a projectUser<br><br>
 * <b>/!\</b> : Creator cannot be kicked.<br>
 * To delete him, you must delete the project.<br>
 * <b>Level needed :</b> <br>
 * - At least <i>ProjectUser.Level.Admin</i> to kick someone<br>
 * - <i>ProjectUser.Level.Member</i> to leave the project
 * @memberof ProjectUser
 * @param {Express.Request} req - request send
 * @param {String} req.params.projectUser_id - ID of the projectUser to delete
 * @param {Express.Response} res - variable to send the response
 */
function deleteProjectUser(req, res) {
    if (req.session.level < User.Level.OldMember) {
        Response(res, "Error : Not logged", null, 0);
        return;
    }

    var projectUser = null;
    var projectUserOfClient = null;

    async.series([
        // Search the projectUser to delete
        function searchProjectUser(callback) {
                ProjectUser.findById(req.params.projectUser_id,
                    function (err, pu) {
                        if (err) Response(res, "Error", err, 0);
                        else if (pu == null)
                            Response(res, "Error : ProjectUser not found",
                                null, 0);
                        else projectUser = pu;
                        callback();
                    })
        },
        // Search the projectUser of Client
        function searchProjectUserOfClient(callback) {
                if (projectUser != null) {
                    ProjectUser.findOne({
                            author: req.session.userId,
                            project: projectUser.project
                        },
                        function (err, pu) {
                            projectUserOfClient = pu;
                            callback();
                        });
                } else callback();
    }],
        function useResult() {
            // ProjectUser not found : message send in searchProjectUser()
            if (projectUser == null) return;
            // Creator cannot be kicked
            else if (projectUser.level == ProjectUser.Level.Creator)
                Response(res, "Error : You cannot kick the creator", null, 0);
            // Need to be at least an admin to kick
            else if (projectUserOfClient.level < ProjectUser.Level.Admin)
                Response(res, "Error : You're not an admin", null, 0);
            else
                ProjectUser.remove({
                    _id: req.params.projectUser_id
                }, function (err, projectUser) {
                    if (err) Response(res, "Error", err, 0);
                    else Response(res, 'ProjectUser deleted', projectUser, 1);
                });
        });
}