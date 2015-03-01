var Project = require('../models/project');
var User = require('../models/user');
var Vote = require('../models/vote');
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
        res.send({message : "Error : No value given !"});
        return;
    }
    else
        vote.value = req.body.value;
    
    if (!("authorUsername" in req.body)){
        res.send({message : "Error : No authorUsername given !"});
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
            else vote.thread = project;
            callback();
        });
    });
    
    async.parallel(calls, function(){
        if (!userFound){
            res.send({message : "Error : Username not found"});
            return;
        }
        else if (!projectFound){
            res.send({message : "Error : Project not found"});
            return;
        }
        else {
            Vote.findOne({author : vote.author, thread : vote.thread}, 
                         function(err, v){
                if (err || v == null) {
                    vote.save(function(err){
                        if (err) res.send(err);
                        else res.send({message : "Vote created !"});
                    });
                }
                else { // Vote already exists
                    v.value = vote.value;
                    v.save(function(err){
                        if (err) res.send(err);
                        else res.send({message : "Vote updated !"});
                    });
                }
            });
        }
    });
        
}

function getVotes(req, res){
    Vote.find({thread : req.params.project_id}, function(err, votes)
    {
        if (err) res.send(err);
        else res.json(votes);
    });
}

function getVote(req, res){
    Vote.findById(req.params.vote_id, function(err, vote){
        if (err) res.send(err);
        else res.json(vote);
    });
}

function deleteVote(req, res){
    Vote.remove({_id: req.params.vote_id}, function(err, vote){
        if (err) res.send(err);
        else res.json({ message: 'Vote deleted !' });
    });
}