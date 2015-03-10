var Survey = require('../models/survey');
var SurveyItem = require('../models/surveyitem');
var Response = require('../modules/response');

var express = require('express');
var async = require('async');
var calls = [];

var router = express.Router();

router.route('/surveyItems/:survey_id').post(createSurveyItem);
router.route('/surveyItems/:survey_id').get(getSurveyItems);
router.route('/surveyItem/:surveyItem_id').get(getSurveyItem);
router.route('/surveyItem/:surveyItem_id').put(editSurveyItem);
router.route('/surveyItem/:surveyItem_id').delete(deleteSurveyItem);

module.exports = router;

function createSurveyItem(req, res){
    
}

function getSurveyItems(req, res){
    
}

function getSurveyItem(req, res){
    
}

function editSurveyItem(req, res){
    
}

function deleteSurveyItem(req, res){
    
}
