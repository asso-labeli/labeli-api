var Project = require('../models/project');
var User = require('../models/user');
var Vote = require('../models/vote');
var Response = require('../modules/response');

var express = require('express');
var async = require('async');
var calls = [];

var router = express.Router();

router.route('/votes/:project_id').post(createOrEditVote);
router.route('/votes/:project_id').get(getVotes);
router.route('/vote/:vote_id').get(getVote);
router.route('/vote/:vote_id').delete(deleteVote);

module.exports = router;

function createOrEditVote(req, res){        
    var vote = new Vote();
    
    var userFound = true;
    var projectFound = true;
    
    if (!("value" in req.body)){
        Response(res,  "Error : No value given", null, 0);
        return;
    }
    else
        vote.value = req.body.value;
    
    if (!("authorUsername" in req.body)){
        Response(res,  "Error : No authorUsername given", null, 0);
        return;
    }
    else {
        calls.push(function(callback){
            User.findOne({username : req.body.authorUsername.toLowerCase()}, 
                        function(err, user){
                if (err || user == null) userFound = false;
                else vote.author = user;
                callback();
            });
        });
    }
    
    calls.push(function(callback){
        Project.findById(req.params.project_id, function(err, project){
            if (err || project == null) projectFound = false;
            else vote.project = project;
            callback();
        });
    });
    
    async.parallel(calls, function(){
        if (!projectFound){
            Response(res,  "Error : Project not found", null, 0);
            return;
        }
        else if (!userFound){
            Response(res,  "Error : User not found", null, 0);
            return;
        }
        else {
            Vote.findOne({author : vote.author, project : vote.project}, 
                         function(err, v){
                if (err || v == null) {
                    vote.save(function(err){
                        if (err) Response(res, "Error", err, 0);
                        else Response(res, "Vote created", vote, 1);
                    });
                }
                else { // Vote already exists
                    v.value = vote.value;
                    v.save(function(err){
                        if (err) Response(res, "Error", err, 0);
                        else Response(res, "Vote updated", v, 1);
                    });
                }
            });
        }
    });
        
}

function getVotes(req, res){
    Vote.find({project : req.params.project_id}, function(err, votes)
    {
        if (err) Response(res, "Error", err, 0);
        else Response(res, "Votes found", votes, 1);
    });
}

function getVote(req, res){
    Vote.findById(req.params.vote_id, function(err, vote){
        if (err) Response(res, "Error", err, 0);
        else Response(res, "Vote found", vote, 1);
    });
}

function deleteVote(req, res){
    Vote.remove({_id: req.params.vote_id}, function(err, vote){
        if (err) Response(res, "Error", err, 0);
        else Response(res, 'Vote deleted', vote, 1);
    });
}