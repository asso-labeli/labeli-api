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

function createOrEditProjectUser(req, res){
    var projectUser = new ProjectUser();
    
    var userFound = true;
    var projectFound = true;
    
    if (!('value' in req.body)){
        Response(res, "Error : No value given", null, 0);
        return;
    }
    else
        projectUser.value = req.body.value;
    
    calls.push(function(callback){
        Project.findById(req.params.project_id, function(err, project){
            if (err || project == null) projectFound = false;
            else projectUser.thread = project;
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
                else projectUser.author = user;
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
                                 thread : projectUser.thread},
                                function(err, pu){
                if (err || pu == null) {        
                    projectUser.save(function(err){
                        if (err) Response(res, "Error", err, 0);
                        else Response(res, 'ProjectUser created', projectUser, 1);
                    });
                }
                else {
                    pu.value = projectUser.value;
                    pu.save(function(err){
                        if (err) Response(res, "Error", err, 0);
                        else Response(res, 'ProjectUser updated', pu, 1);
                    });
                }
            });
        }
    });
        
}

function getProjectUsers(req, res){
    ProjectUser.find({thread : req.params.project_id}, function(err, projectUsers){
        if (err) Response(res, "Error", err, 0);
        else Response(res, "ProjectUsers found", projectUsers, 1);
    });
}

function getProjectUser(req, res){
    ProjectUser.findById(req.params.projectUser_id, function(err, projectUser){
        if (err) Response(res, "Error", err, 0);
        else Response(res, "ProjectUser found", projectUser, 1);
    });
}

function deleteProjectUser(req, res){
    ProjectUser.remove({_id : req.params.projectUser_id}, function(err, projectUser){
        if (err) Response(res, "Error", err, 0);
        else Response(res, 'ProjectUser deleted', projectUser, 1);
    });
}
