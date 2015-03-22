/**
 * This is the link between User module and Project module.<br>
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
 * <tr><td>POST /projectUsers/</td><td>{@link Project.createOrEditProjectUser}</td></tr>
 * <tr><td>GET /projectUsers/</td><td>{@link Project.getProjectUsers}</td></tr>
 * <tr><td>GET /projectUser/:projectUser_id</td><td>{@link Project.getProjectUser}</td></tr>
 * <tr><td>DELETE /projectUser/:projectUser_id</td><td>{@link Project.deleteProjectUser}</td></tr></table><br>
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
 * <b>Level needed :</b> Member
 * @memberof ProjectUser
 * @param {Express.Request} req - request send
 * @param {String} req.body.level - name of the project
 * @param {String} req.params.project_id - ID of the reference project
 * @param {Express.Response} res - variable to send the response
 */
function createOrEditProjectUser(req, res){
    var projectUser = new ProjectUser();
    
    var userFound = true;
    var projectFound = true;
    
    if (!('level' in req.body)){
        Response(res, "Error : No level given", null, 0);
        return;
    }
    else
        projectUser.level = req.body.level;
    
    calls.push(function(callback){
        Project.findById(req.params.project_id, function(err, project){
            if (err || project == null) projectFound = false;
            else projectUser.project = project._id;
            callback();
        });
    });   
    
    if (!("authorUsername" in req.body)){
        Response(res, "Error : No authorUsername given", null, 0);
        return ;
    }
    else {
        calls.push(function(callback){
            User.findOne({username : req.body.authorUsername.toLowerCase()}, 
                         function(err, user){
                if (err || user == null) userFound = false;
                else projectUser.author = user._id;
                callback();
            });
        });
    }
        
    async.parallel(calls, function(){
        if (!projectFound) 
            Response(res, "Error : Project not found", null, 0);
        else if (!userFound) 
            Response(res, "Error : User not found", null, 0);
        else {
            ProjectUser.findOne({author : projectUser.author,
                                 project : projectUser.project},
                                function(err, pu){
                if (err || pu == null) {        
                    projectUser.save(function(err){
                        if (err) Response(res, "Error", err, 0);
                        else Response(res, 'ProjectUser created', projectUser, 1);
                    });
                }
                else {
                    pu.level = projectUser.level;
                    pu.save(function(err){
                        if (err) Response(res, "Error", err, 0);
                        else Response(res, 'ProjectUser updated', pu, 1);
                    });
                }
            });
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
function getProjectUsers(req, res){
    ProjectUser.find({project : req.params.project_id}, function(err, projectUsers){
        if (err) Response(res, "Error", err, 0);
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
function getProjectUser(req, res){
    ProjectUser.findById(req.params.projectUser_id, function(err, projectUser){
        if (err) 
            Response(res, "Error", err, 0);
        else if (projectUser == null) 
            Response(res, "Error : ProjectUser not found", null, 0);
        else 
            Response(res, "ProjectUser found", projectUser, 1);
    });
}

/**
 * Delete a projectUser<br>
 * <b>Level needed :</b> Owner
 * @memberof ProjectUser
 * @param {Express.Request} req - request send
 * @param {String} req.params.projectUser_id - ID of the projectUser to delete
 * @param {Express.Response} res - variable to send the response
 */
function deleteProjectUser(req, res){
    ProjectUser.remove({_id : req.params.projectUser_id}, function(err, projectUser){
        if (err) Response(res, "Error", err, 0);
        else Response(res, 'ProjectUser deleted', projectUser, 1);
    });
}
