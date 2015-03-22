var Survey = require('../models/survey');
var SurveyItem = require('../models/surveyitem');
var SurveyVote = require('../models/surveyvote');
var User = require('../models/user');
var Response = require('../modules/response');

var express = require('express');
var async = require('async');
var calls = [];

var router = express.Router();

router.route('/surveyVotes/:survey_id').post(createSurveyVote);
router.route('/surveyVotes/:survey_id').get(getSurveyVotes);
router.route('/surveyVote/:surveyVote_id').get(getSurveyVote);
router.route('/surveyVote/:surveyVote_id').delete(deleteSurveyVote);

module.exports = router;

function createSurveyVote(req, res){
        console.log(req.body);
    var surveyFound = true;
    var userFound = true;
    var surveyItemFound = true;
    
    var surveyVoteFound = true;
    var numberChoices = -1;
    var surveyClosed = false;
    
    var user = null;
    var survey = null;
    var surveyItems = [];
    
    var surveyVoteNotCreated = false;
    
    var surveyVotes = [];
    
    if (!('username' in req.body)){
        Response(res, "Error : No username given", null, 0);
        return;
    }
    if (!('items' in req.body)){
        Response(res, "Error : No items given", null, 0);
        return;
    }
    else if (!Array.isArray(req.body.items)){
        Response(res, "Error : Items must be an array", null, 0);
        return;
    }
    
    async.parallel([
        function(callback){
            User.findOne({username : req.body.username}, function(err, u){
                if (err || u == null) userFound = false;
                else user = u._id;
                console.log("User in callback function : "+ user);
                callback();
            });
        },
        function(callback){
            Survey.findById(req.params.survey_id, function(err, s){
                if (err || s == null) surveyFound = false;
                else {
                    survey = s._id;
                    numberChoices = s.numberChoices;
                    surveyClosed = s.isClosed;
                }
                callback();
            });
        }],
                   function(err){
        async.each(req.body.items, function(v, callback){
            console.log(req.body.items);
            console.log("item : " + v);
            console.log("user : " + user + " - survey : " + survey + " - userFound : " +userFound);
            SurveyItem.findById(v, function(err, surveyItem){
                if (err || surveyItem == null) surveyItemFound = false;
                else surveyItems.push(surveyItem._id);
                callback();
            });
        }, function(err){
            console.log("Testing values");
            if (!userFound) Response(res, "Error : User not found", null, 0);
            else if (!surveyFound) Response(res, "Error : Survey not found", null, 0);
            else if (!surveyItemFound) Response(res, "Error : One SurveyItem not valid", null, 0);
            else if (surveyClosed) Response(res, "Error : Survey closed", null, 0);
            else {
                console.log("Survey : " + surveyItems);

                async.series([
                    function(callback){
                        SurveyVote.remove({user : user, survey : survey}, function(err){
                            callback();
                        });
                    },
                    function(callback){
                        async.each(surveyItems, function(v, callback2){
                            var sv = new SurveyVote();

                            sv.user = user;
                            sv.survey = survey;
                            sv.value = v;

                            surveyVotes.push(sv);
                            console.log(sv);
                            sv.save(function(err){
                                if (err){
                                    surveyVoteNotCreated = true;
                                }
                                callback2();
                            });
                        });
                        callback();
                    },
                    function(callback){
                        console.log("Pute " + surveyVotes);
                        if (surveyVoteNotCreated) 
                            Response(res, "Error : SurveyVote not created", null, 0);
                        else
                            Response(res, "SurveyVotes created", surveyVotes, 1);
                        callback();
                    }
                ]);
            }
        });
    });
}

function getSurveyVotes(req, res){
    SurveyVote.find({survey : req.params.survey_id}, function(err, sv){
        if (err) Response(res, "Error", err, 0);
        else Response(res, "SurveyVotes found", sv, 1);
    });
}

function getSurveyVote(req, res){
    SurveyVote.findById(req.params.surveyVote_id, function(err, sv){
        if (err) Response(res, "Error", err, 0);
        else if (sv == null) Response(res, "Error : SurveyVote not found", null, 0);
        else Response(res, "SurveyVote found", sv, 1);
    });
}


function deleteSurveyVote(req, res){
    SurveyVote.remove({_id : req.params.surveyVote_id}, function(err, sv){
        if (err) Response(res, "Error", err, 0);
        else Response(res, "SurveyVote deleted", sv, 1);
    });
}