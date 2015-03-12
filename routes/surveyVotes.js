var Survey = require('../models/survey');
var SurveyItem = require('../models/surveyItem');
var SurveyVote = require('../models/surveyVote');
var Response = require('../modules/response');

var express = require('express');
var async = require('async');
var calls = [];

var router = express.Router();

router.route('/surveyVotes/:surveyVote_id').post(createSurveyVote);
router.route('/surveyVotes/:surveyVote_id').get(getSurveyVotes);
router.route('/surveyVote/:surveyVote_id').get(getSurveyVote);
router.route('/surveyVote/:surveyVote_id').put(editSurveyVote);
router.route('/surveyVote/:surveyVote_id').delete(deleteSurveyVote);

module.exports = router;

function createSurveyVote(req, res){
    
}

function getSurveyVotes(req, res){
    
}

function getSurveyVote(req, res){
    
}

function editSurveyVote(req, res){
    
}

function deleteSurveyVote(req, res){
    
}