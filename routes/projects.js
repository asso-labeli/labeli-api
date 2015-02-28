var Project = require('../models/project');
var User = require('../models/user');
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
        res.json({message : "Error : No name given !"});
        return ;
    } else
        project.name = req.body.name;
    
    if (!("type" in req.body)){
        res.json({message : "Error : No type given !"});
        return ;
    } else
        project.type = req.body.type;
    
    if (!("authorUsername" in req.body)){
        res.json({message : "Error : No authorUsername given !"});
        return ;
    }
    else {
        User.findOne({username : req.body.authorUsername.toLowerCase()}, function(err, user){
            if (err) {
                res.send(err);
            } else if (user === null){
                res.send({message : "Error : authorUsername not found !"});
            } else {
                project.author = user;
                project.save(function(err){
                    if (err) res.send(err);
                    else res.json({ message: 'Project created !' });
                });
            }
        });
    }
}

function getProjects(req, res)
{
    Project.find(function(err, projects)
    {
        if (err) res.send(err);
        else res.json(projects);
    });
}

function getProject(req, res)
{
    Project.findById(req.params.project_id, function(err, project)
    {
        if (err) res.send(err);
        else res.json(project);
    });
}

function editProject(req, res)
{
    Project.findById(req.params.project_id, function(err, project)
    {
        var usernameFound = true;
        
        if (err) res.send(err);
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
                if (err) res.send(err);
                else if (!usernameFound) res.send({message : 'Project updated but authorUsername not found!'});
                else res.json({ message: 'Project updated!' });
            });
        });

    });
}
function deleteProject(req, res)
{
    Project.remove({_id: req.params.project_id}, function(err, project)
    {
        if (err) res.send(err);
        else res.json({ message: 'Project deleted!' });
    });
}