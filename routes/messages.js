var Project = require('../models/project');
var User = require('../models/user');
var Message = require('../models/message');
var express = require('express');
var async = require('async');
var calls = [];

var router = express.Router();

router.route('/messages/:project_id').post(createMessage);
router.route('/messages/:project_id').get(getMessages);
router.route('/message/:message_id').get(getMessage);
router.route('/message/:message_id').put(editMessage);
// router.route('/messages/:project_id').delete(deleteProject);

module.exports = router;

function createMessage(req, res){        
    var message = new Message();
    var projectFound = true;
    var userFound = true;
    
    if (!("content" in req.body)){
        res.json({message : "Error : No content given !"});
        return ;
    } else
        message.content = req.body.content;
    
    if (!("project_id" in req.params)){
        res.json({message : "Error : No project id given in parameters !"});
        return ;
    } else {
        calls.push(function(callback){
            Project.findById(req.params.project_id, function(err, project){
                if (err || project == null) projectFound = false;
                else message.thread = project;
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
            User.findOne({username : req.body.authorUsername}, function(err, user){
                if (err || user == null) userFound = false;
                else message.author = user;
                callback();
            });
        });
    }
        
    async.parallel(calls, function(){
        if (!projectFound) res.send({message : "Error : Project not found !"});
        else if (!userFound) res.send({message : "Error : User not found !"});
        else {
            message.save(function(err){
                if (err) res.send(err);
                res.json({ message: 'Message created !' });
            });
        }
    });
}

function getMessages(req, res){
    
}
    
function getMessage(req, res){
    
}
    
function editMessage(req, res){
    
}