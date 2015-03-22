/**
 * <table><tr>
 * <td>POST /projects/</td><td>{@link Project.createProject}</td></tr>
 * <td>GET /projects/</td><td>{@link Project.getProjects}</td></tr>
 * <td>GET /projects/:project_id</td><td>{@link Project.getProject}</td></tr>
 * <td>PUT /projects/:project_id</td><td>{@link Project.editProject}</td></tr>
 * <td>DELETE /projects/:project_id</td><td>{@link Project.deleteProject}</td></tr>
 * </table>
 * @namespace Project
 * @author Florian Kauder
 */

var Project = require('../models/project');
var User = require('../models/user');
var ProjectUser = require('../models/projectUser');
var Vote = require('../models/vote');
var Message = require('../models/message');
var Response = require('../modules/response');

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
 * <b>Level needed :</b> Admin
 * @memberof Project
 * @param {Express.Request} req - request send
 * @param {String} req.body.name - name of the project
 * @param {String} req.body.type - type of the project
 * @param {String} req.body.authorUsername - author username of the project
 * @param {Express.Response} res - variable to send the response
 */
function createProject(req, res)
{        
    var project = new Project();
    
    if (!("name" in req.body)){
        Response(res, "Error : No name given", null, 0);
        return ;
    } 
    else
        project.name = req.body.name;
    
    if (!("type" in req.body)){
        Response(res, "Error : No type given", null, 0);
        return ;
    } 
    else
        project.type = req.body.type;
    
    if (!("authorUsername" in req.body)){
        Response(res, "Error : No authorUsername given", null, 0);
        return ;
    }
    else {
        User.findOne({username : req.body.authorUsername.toLowerCase()}, 
                     function(err, user){
            if (err) {
                Response(res, "Error", err, 0);
            } else if (user === null){
                Response(res, "Error : authorUsername not found", null, 0);
            } else {
                project.author = user._id;
                project.save(function(err){
                    if (err) Response(res, "Error", err, 0);
                    else {                        
                        var projectUser = new ProjectUser();
                        projectUser.author = project.author;
                        projectUser.project = project;
                        projectUser.value = 2;
                        
                        projectUser.save(function(err){
                            if (err) Response(res, "Error", err, 0);
                            else Response(res, 'Project created', project, 1);
                        });
                    }                            
                });
            }
        });
    }
}

/**
 * Get all projects<br>
 * <b>Level needed :</b> Guest
 * @memberof Project
 * @param {Express.Request} req - request send
 * @param {Express.Response} res - variable to send the response
 */
function getProjects(req, res)
{
    Project.find(function(err, projects)
    {
        if (err) Response(res, "Error", err, 0);
        else Response(res, "Projects found", projects, 1);
    });
}

/**
 * Get a specific project<br>
 * <b>Level needed :</b> Guest
 * @memberof Project
 * @param {Express.Request} req - request send
 * @param {ObjectID} [req.params.project_id] - ID of project
 * @param {Express.Response} res - variable to send the response
 */
function getProject(req, res)
{
    Project.findById(req.params.project_id, function(err, project)
    {
        if (err) Response(res, "Error", err, 0);
        else if (project == null) 
            Response(res, "Error : Project not found", project, 0);
        else Response(res, "Project Found", project, 1);
    });
}

/**
 * Edit a project<br>
 * <b>Level needed :</b> Owner | Admin
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
function editProject(req, res)
{
    Project.findById(req.params.project_id, function(err, project)
    {
        var usernameFound = true;
        
        if (err) {
            Response(res, "Error", err, 0);
            return;
        }
        else if (project == null) {
            Response(res, "Error : Project not found", project, 0);
            return;
        }
        
        if ("name" in req.body) project.name = req.body.name;
        if ("status" in req.body) project.status = req.body.status;
        if ("description" in req.body) project.description = req.body.description;
        if ("type" in req.body) project.type = req.body.type;
        if ("authorUsername" in req.body) 
            calls.push(function(callback){
                User.findOne({username : req.body.authorUsername.toLowerCase()}, 
                             function(err, user){
                    if (err) usernameFound = false;
                    else project.author = user;
                    callback();
                });
            });
        
        async.parallel(calls, function(){
            project.save(function(err){
                if (err) Response(res, "Error", err, 0);
                else if (!usernameFound) 
                    Response(res, 'Project updated but authorUsername not found', 
                             project, 0);
                else Response(res, 'Project updated', project, 1);
            });
        });

    });
}

/**
 * Delete a project<br>
 * <b>Level needed :</b> Admin
 * @memberof Project
 * @param {Express.Request} req - request send
 * @param {ObjectID} [req.params.project_id] - ID of project to delete
 * @param {Express.Response} res - variable to send the response
 */
function deleteProject(req, res)
{
    Project.remove({_id: req.params.project_id}, function(err, project)
    {
        if (err) Response(res, "Error", err, 0);
        else {
            var errors = [];
            var voteDeleted = true;
            var projectUserDeleted = true;
            var messageDeleted = true;
            
            calls.push(function(callback){
                Vote.remove({project : req.params.project_id}, function(err){
                    if (err) {
                        voteDeleted = false;
                        errors.push(err);
                    }
                    callback();
                });
            });
            
            calls.push(function(callback){
                ProjectUser.remove({project : req.params.project_id}, function(err){
                    if (err) {
                        projectUserDeleted = false;
                        errors.push(err);
                    }
                    callback();
                });
            });
            
            calls.push(function(callback){
                Message.remove({project : req.params.project_id}, function(err){
                    if (err) {
                        messageDeleted = false;
                        errors.push(err);
                    }
                    callback();
                });
            });
            
            async.parallel(calls, function(){
                var errorMessage = "Error during delete :";
                if (!voteDeleted) errorMessage += "Vote ";
                if (!projectUserDeleted) errorMessage += "ProjectUser ";
                if (!messageDeleted) errorMessage += "Message ";
                
                if (voteDeleted && projectUserDeleted && messageDeleted)
                    Response(res, 'Project deleted', project, 1);
                else
                    Response(res, errorMessage, errors, 0);
            });
        }
    });
}