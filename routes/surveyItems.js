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
    var surveyItem = new SurveyItem();
    var surveyFound = true;
    
    if (!('name' in req.body)){
        Response(res, "Error : No name given", null, 0);
        return;
    }
    else
        surveyItem.name = req.body.name;
        
    calls.push(function(callback){
        Survey.findById(req.params.survey_id, function(err, survey){
            if (err || survey == null) surveyFound = false;
            else surveyItem.survey = survey._id;
            callback();
        });
    });
    
    async.parallel(calls, function(){
        if(!surveyFound) Response(res, "Error : Survey not found", null, 0);
        else surveyItem.save(function(err){
            if (err) Response(res, "Error", err, 0);
            else Response(res, "SurveyItem created", surveyItem, 1);
        });
    });
}

function getSurveyItems(req, res){
    SurveyItem.find({survey : req.params.survey_id}, function(err, sis){
        if (err) Response(res, "Error", err, 0);
        else Response(res, "SurveyItems found", sis, 1);
    });
}

function getSurveyItem(req, res){
    SurveyItem.findById(req.params.surveyItem_id, function(err, si){
        if (err) Response(res, "Error", err, 0);
        else if (si == null) Response(res, "Error : SurveyItem not found", null, 0);
        else Response(res, "SurveyItem found", si, 1);
    });
}

function editSurveyItem(req, res){
    SurveyItem.findById(req.params.surveyItem_id, function(err, si){
        if (err){
            Response(res, "Error", err, 0);
            return;
        }
        
        if ('name' in req.body) si.name = req.body.name;
        
        si.save(function(err){
            if (err) Response(res, "Error", err, 0);
            else Response(res, "SurveyItem updated", si, 1);
        });
    });
}

function deleteSurveyItem(req, res){
    SurveyItem.remove({_id : req.params.surveyItem_id}, function(err, si){
        if (err) Response(res, "Error", err, 0);
        else Response(res, "SurveyItem deleted", si, 1);
    });
}
