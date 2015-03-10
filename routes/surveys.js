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
    var survey = new Survey();
    var userFound = true;
    var surveyNameFound = false;
    
    if (!('name' in req.body)){
        Response(res, "Error : No name given", null, 0);
        return;
    }
    else
        survey.name = req.body.name;
    
    if (!('username' in req.body)){
        Response(res, "Error : No username given", null, 0);
        return;
    }
    else {
        calls.push(function(callback){
            User.findOne({username : req.body.username}, function(err, user){
                if (err || user == null) userFound = false;
                else survey.author = user._id;
                callback();
            });
        });
    }
    
    calls.push(function(callback){
        Survey.findOne({name : req.body.name}, function(err, s){
            if (err || s == null) surveyNameFound = false;
            else surveyNameFound = true;
            callback();
        });
    });
    
    async.parallel(calls, function(){
        if (!userFound)
            Response(res, "Error : User not found", null, 0);
        else if (surveyNameFound)
            Response(res, "Error : Survey's name already exists", null, 0);
        else
            survey.save(function(err){
                if (err) Response(res, "Error", err, 0);
                else Response(res, "Survey created", survey, 1);
            });
    });
}

function getSurveys(req, res){
    Survey.find(function(err, surveys){
        if (err) Response(res, "Error", err, 0);
        else Response(res, "Surveys found", surveys, 1);
    });
}

function getSurvey(req, res){
    Survey.findById(req.params.survey_id, function(err, survey){
        if (err) 
            Response(res, "Error", err, 0);
        else if (survey == null) 
            Response(res, "Error : Survey not found", null, 0);
        else 
            Response(res, "Survey found", survey, 1);
    });
}

function editSurvey(req, res){
    Survey.findById(req.params.survey_id, function(err, survey){
        if (err) {
            Response(res, "Error", err, 0);
            return;
        }
        
        if ('description' in req.body) survey.description = req.body.description;
        if ('name' in req.body) survey.name = req.body.name;
        
        survey.save(function(err){
            if (err) Response(res, "Error", err, 0);
            else Response(res, "Survey updated", survey, 1);
        });
    });
}

function deleteSurvey(req, res){
    Survey.remove({_id : req.params.survey_id}, function(err, survey){
        if (err) Response(res, "Error", err, 0);
        else Response(res, "Survey deleted", survey, 1);
    });
}