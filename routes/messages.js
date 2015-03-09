var Project = require('../models/project');
var User = require('../models/user');
var Message = require('../models/message');
var Response = require('../modules/response');

var express = require('express');
var async = require('async');
var calls = [];

var router = express.Router();

router.route('/messages/:project_id').post(createMessage);
router.route('/messages/:project_id').get(getMessages);
router.route('/message/:message_id').get(getMessage);
router.route('/message/:message_id').put(editMessage);
router.route('/message/:message_id').delete(deleteMessage);

module.exports = router;

function createMessage(req, res){        
    var message = new Message();
    
    var projectFound = true;
    var userFound = true;
    
    if (!("content" in req.body)){
        Response(res, "Error : No content given", null, 0);
        return ;
    } 
    else
        message.content = req.body.content;
    
    if (!("project_id" in req.params)){
        Response(res, "Error : No project id given in parameters", null, 0);
        return ;
    } 
    else {
        calls.push(function(callback){
            Project.findById(req.params.project_id, function(err, project){
                if (err || project == null) projectFound = false;
                else message.project = project;
                callback();
            });
        });   
    }
    
    if (!("authorUsername" in req.body)){
        Response(res, "Error : No authorUsername given", null, 0);
        return ;
    }
    else {
        calls.push(function(callback){
            User.findOne({username : req.body.authorUsername.toLowerCase()}, 
                         function(err, user){
                if (err || user == null) userFound = false;
                else message.author = user;
                callback();
            });
        });
    }
        
    async.parallel(calls, function(){
        if (!projectFound) Response(res, "Error : Project not found", null, 0);
        else if (!userFound) Response(res, "Error : User not found", null, 0);
        else {
            message.save(function(err){
                if (err) 
                    Response(res, "Error", err, 0);
                else Response(res, 'Message created', message, 1);
            });
        }
    });
}

function getMessages(req, res){
    Message.find({thread : req.params.project_id}, function(err, messages)
    {
        if (err) Response(res, "Error", err, 0);
        else Response(res, "Messages found", messages, 1);
    });
}
    
function getMessage(req, res){
    Message.findById(req.params.message_id, function(err, message){
        if (err) Response(res, "Error", err, 0);
        else if (message == null) 
            Response(res, "Error : Message not found", message, 0);
        else Response(res, "Message found", message, 1);
    });
}
    
function editMessage(req, res){
    Message.findById(req.params.message_id, function(err, message)
    {
        if (err) {
            Response(res, "Error", err, 0);
            return;
        }
        if ("content" in req.body) message.content = req.body.content;
        message.lastEdited = Date.now();
        
        message.save(function(err){
            if (err) Response(res, "Error", err, 0);
            else Response(res, 'Message edited', message, 1);
        });

    });
}

function deleteMessage(req, res){
    Message.remove({_id: req.params.message_id}, function(err, obj)
    {
        if (err) Response(res, "Error", err, 0);
        else Response(res, 'Message deleted', obj, 1);
    });
}