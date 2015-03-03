var Project = require('../models/project');
var User = require('../models/user');
var ProjectUser = require('../models/projectUser');
var express = require('express');
var async = require('async');
var calls = [];

var router = express.Router();

router.route('/projectUsers/:project_id').post(createOrEditProjectUser);
router.route('/projectUsers/:project_id').get(getProjectUsers);
router.route('/projectUser/:projectUser_id').get(getProjectUser);
router.route('/projectUser/:projectUser_id').delete(deleteProjectUser);

module.exports = router;

function createOrEditProjectUser(req, res){
    var projectUser = new ProjectUser();
    
    var userFound = true;
    var projectFound = true;
    
    if (!('value' in req.body)){
        res.send({message : "Error : No value given !"});
        return;
    }
    else
        projectUser.value = req.body.value;
    
    if (!("project_id" in req.params)){
        res.json({message : "Error : No project id given in parameters !"});
        return ;
    } else {
        calls.push(function(callback){
            Project.findById(req.params.project_id, function(err, project){
                if (err || project == null) projectFound = false;
                else projectUser.thread = project;
                callback();
            });
        });   
    }
    
    if (!("authorUsername" in req.body)){
        res.json({message : "Error : No authorUsername given !"});
        return ;
    }
    else {
        calls.push(function(callback){
            User.findOne({username : req.body.authorUsername.toLowerCase()}, function(err, user){
                if (err || user == null) userFound = false;
                else projectUser.author = user;
                callback();
            });
        });
    }
        
    async.parallel(calls, function(){
        if (!projectFound) res.send({message : "Error : Project not found !"});
        else if (!userFound) res.send({message : "Error : User not found !"});
        else {
            ProjectUser.findOne({author : projectUser.author,
                                 thread : projectUser.thread},
                                function(err, pu){
                if (err || pu == null) {        
                    projectUser.save(function(err){
                        if (err) res.send(err);
                        else res.json({ message: 'ProjectUser created !' });
                    });
                }
                else {
                    pu.value = projectUser.value;
                    pu.save(function(err){
                        if (err) res.send(err);
                        else res.json({message : 'ProjectUser updated !'});
                    });
                }
            });
        }
    });
        
}

function getProjectUsers(req, res){
    ProjectUser.find({thread : req.params.project_id}, function(err, projectUsers){
        if (err) res.send(err);
        else res.json(projectUsers);
    });
}

function getProjectUser(req, res){
    ProjectUser.findById(req.params.projectUser_id, function(err, projectUser){
        if (err) res.send(err);
        else res.json(projectUser);
    });
}

function deleteProjectUser(req, res){
    ProjectUser.remove({_id : req.params.projectUser_id}, function(err, projectUser){
        if (err) res.send(err);
        else res.send({message : 'ProjectUser deleted !'});
    });
}
