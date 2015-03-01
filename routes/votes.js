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

}

function getVotes(req, res){
    
}

function getVote(req, res){
    
}

function deleteVote(req, res){
    
}