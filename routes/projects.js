var Project = require('../models/project');
var User = require('../models/user');
var ProjectUser = require('../models/projectUser');
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
        res.send({message : "Error : No name given!",
                 data : null,
                 success : 0});
        return ;
    } else
        project.name = req.body.name;
    
    if (!("type" in req.body)){
        res.send({message : "Error : No type given!",
                 data : null,
                 success : 0});
        return ;
    } else
        project.type = req.body.type;
    
    if (!("authorUsername" in req.body)){
        res.send({message : "Error : No authorUsername given!",
                 data : null,
                 success : 0});
        return ;
    }
    else {
        User.findOne({username : req.body.authorUsername.toLowerCase()}, function(err, user){
            if (err) {
                res.send({message:"Error!", data : err, success : 0});
            } else if (user === null){
                res.send({message : "Error : authorUsername not found!",
                          data : null,
                          success : 0});
            } else {
                project.author = user;
                project.save(function(err){
                    if (err) res.send({message:"Error!", data : err, success : 0});
                    else {                        
                        var projectUser = new ProjectUser();
                        projectUser.author = project.author;
                        projectUser.thread = project;
                        projectUser.value = 2;
                        
                        projectUser.save(function(err){
                            if (err) res.send({message:"Error!", data : err, success : 0});
                            else res.send({ message: 'Project created!',
                                          data : project,
                                          success : 1});
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
        if (err) res.send({message:"Error!", data : err, success : 0});
        else res.send({message : "Projects found!",
                       data : projects,
                       success : 1});
    });
}

function getProject(req, res)
{
    Project.findById(req.params.project_id, function(err, project)
    {
        if (err) res.send({message:"Error!", data : err, success : 0});
        else if (project == null) res.send({message : "Error : Project not found!",
                                            data : project,
                                            success : 0});
        else res.send({message : "Project Found!",
                       data : project,
                       success : 1});
    });
}

function editProject(req, res)
{
    Project.findById(req.params.project_id, function(err, project)
    {
        var usernameFound = true;
        
        if (err) {
            res.send({message:"Error!", data : err, success : 0});
            return;
        }
        else if (project == null) {
            res.send({message:"Error : Project not found!",
                      data : project,
                      success : 0});
            return;
        }
        
        if ("name" in req.body) project.name = req.body.name;
        if ("status" in req.body) project.status = req.body.status;
        if ("description" in req.body) project.description = req.body.description;
        if ("type" in req.body) project.type = req.body.type;
        if ("authorUsername" in req.body) 
            calls.push(function(callback){
                User.findOne({username : req.body.authorUsername.toLowerCase()}, function(err, user){
                    if (err) usernameFound = false;
                    else project.author = user;
                    callback();
                });
            });
        
        async.parallel(calls, function(){
            project.save(function(err){
                if (err) res.send({message:"Error!", data : err, success : 0});
                else if (!usernameFound) res.send({message : 'Project updated but authorUsername not found!',
                                                  data : project,
                                                  success : 0});
                else res.send({ message: 'Project updated!',
                              data : project,
                              success : 1});
            });
        });

    });
}
function deleteProject(req, res)
{
    Project.remove({_id: req.params.project_id}, function(err, project)
    {
        if (err) res.send({message:"Error!", data : err, success : 0});
        else res.send({ message: 'Project deleted!',
                      data : null,
                      success : 1});
    });
}