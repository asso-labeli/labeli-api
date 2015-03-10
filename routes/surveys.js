var User = require('../models/user');
var Survey = require('../models/survey');
var Response = require('../modules/response');

var express = require('express');
var async = require('async');
var calls = [];

var router = express.Router();

router.route('/surveys').post(createSurvey);
router.route('/surveys').get(getSurveys);
router.route('/surveys/:survey_id').get(getSurvey);
router.route('/surveys/:survey_id').put(editSurvey);
router.route('/surveys/:survey_id').delete(deleteSurvey);

module.exports = router;

function createSurvey(req, res){
    
}

function getSurveys(req, res){
    
}

function getSurvey(req, res){
    
}

function editSurvey(req, res){
    
}

function deleteSurvey(req, res){
    
}