var Project = require('../models/project');
var User = require('../models/user');
var ProjectUser = require('../models/projectUser');
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

function getProjects(req, res)
{
    Project.find(function(err, projects)
    {
        if (err) Response(res, "Error", err, 0);
        else Response(res, "Projects found", projects, 1);
    });
}

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
function deleteProject(req, res)
{
    Project.remove({_id: req.params.project_id}, function(err, project)
    {
        if (err) Response(res, "Error", err, 0);
        else Response(res, 'Project deleted', null, 1);
    });
}