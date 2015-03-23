/**
 * {@link SurveyVote.getSurveyVotes}, {@link SurveyVote.getSurveyVote} and {@link SurveyVote.deleteSurveyVote} need admin rights to protect anonymity of votes.<br>
 * <h2>Model</h2>
 * <table>
 * <tr><td><b>Name</b></td><td><b>Type</b></td><td><b>Default Value</b></td></tr>
 * <tr><td>created</td><td>Date</td><td>Date.now</td></tr>
 * <tr><td>lastEdited</td><td>Date</td><td>Date.now</td></tr>
 * <tr><td>survey</td><td>ObjectId</td></tr>
 * <tr><td>value</td><td>ObjectId</td></tr>
 * <tr><td>user</td><td>ObjectId</td></tr>
 * </table><br>
 * <h2>Routing Table</h2>
 * <table>
 * <tr><td>POST /surveyVotes/:project_id</td><td>{@link SurveyVote.createOrEditSurveyVote}</td></tr>
 * <tr><td>GET /surveyVotes/:project_id</td><td>{@link SurveyVote.getSurveyVotes}</td></tr>
 * <tr><td>GET /surveyVote/:surveyVote_id</td><td>{@link SurveyVote.getSurveyVote}</td></tr>
 * <tr><td>DELETE /surveyVote/:surveyVote_id</td><td>{@link SurveyVote.deleteSurveyVote}</td></tr>
 * <tr><td>GET /surveyVoteForProject/:project_id</td><td>{@link SurveyVote.getSessionSurveyVote}</td></tr>
 * <tr><td>DELETE /surveyVoteForProject/:project_id</td><td>{@link SurveyVote.deleteSessionSurveyVote}</td></tr>
 * <tr><td>GET /surveyVoteResult/:project_id</td><td>{@link SurveyVote.getSurveyVoteResult}</td></tr>
 * </table><br></table><br>
 * @namespace SurveyVote
 * @author Florian Kauder
 */

var Survey = require('../models/survey');
var SurveyItem = require('../models/surveyItem');
var SurveyVote = require('../models/surveyVote');
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
router.route('/voteForSurvey/:survey_id').get(getSessionSurveyVote);
router.route('/voteForSurvey/:survey_id').delete(deleteSessionSurveyVote);
router.route('/surveyVoteResult/:survey_id').get(getSurveyVoteResult);

module.exports = router;

/**
 * Create or edit one or some surveyVotes on a survey<br>
 * <b>Level needed :</b> Member
 * @memberof SurveyVote
 * @param {Express.Request} req - request send
 * @param {Array(ObjectID)} req.body.items - array with id of items
 * @param {ObjectId} req.params.survey_id - id of the survey
 * @param {Express.Response} res - variable to send the response
 */
function createSurveyVote(req, res) {
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

    if (!('username' in req.body)) {
        Response(res, "Error : No username given", null, 0);
        return;
    }
    if (!('items' in req.body)) {
        Response(res, "Error : No items given", null, 0);
        return;
    } else if (!Array.isArray(req.body.items)) {
        Response(res, "Error : Items must be an array", null, 0);
        return;
    }

    async.parallel([
        function (callback) {
                User.findOne({
                    username: req.body.username
                }, function (err, u) {
                    if (err || u == null) userFound = false;
                    else user = u._id;
                    console.log("User in callback function : " + user);
                    callback();
                });
        },
        function (callback) {
                Survey.findById(req.params.survey_id, function (err, s) {
                    if (err || s == null) surveyFound = false;
                    else {
                        survey = s._id;
                        numberChoices = s.numberChoices;
                        surveyClosed = s.isClosed;
                    }
                    callback();
                });
        }],
        function (err) {
            async.each(req.body.items, function (v, callback) {
                console.log(req.body.items);
                console.log("item : " + v);
                console.log("user : " + user + " - survey : " + survey + " - userFound : " + userFound);
                SurveyItem.findById(v, function (err, surveyItem) {
                    if (err || surveyItem == null) surveyItemFound = false;
                    else surveyItems.push(surveyItem._id);
                    callback();
                });
            }, function (err) {
                console.log("Testing values");
                if (!userFound) Response(res, "Error : User not found", null, 0);
                else if (!surveyFound) Response(res, "Error : Survey not found", null, 0);
                else if (!surveyItemFound) Response(res, "Error : One SurveyItem not valid", null, 0);
                else if (surveyClosed) Response(res, "Error : Survey closed", null, 0);
                else {
                    console.log("Survey : " + surveyItems);

                    async.series([
                    function (callback) {
                            SurveyVote.remove({
                                user: user,
                                survey: survey
                            }, function (err) {
                                callback();
                            });
                    },
                    function (callback) {
                            async.each(surveyItems, function (v, callback2) {
                                var sv = new SurveyVote();

                                sv.user = user;
                                sv.survey = survey;
                                sv.value = v;

                                surveyVotes.push(sv);
                                console.log(sv);
                                sv.save(function (err) {
                                    if (err) {
                                        surveyVoteNotCreated = true;
                                    }
                                    callback2();
                                });
                            });
                            callback();
                    },
                    function (callback) {
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

/**
 * Get all SurveyVotes of a survey<br>
 * <b>Level needed :</b> Admin
 * @memberof SurveyVote
 * @param {Express.Request} req - request send
 * @param {ObjectId} req.params.survey_id - id of the survey
 * @param {Express.Response} res - variable to send the response
 */
function getSurveyVotes(req, res) {
    SurveyVote.find({
        survey: req.params.survey_id
    }, function (err, sv) {
        if (err) Response(res, "Error", err, 0);
        else Response(res, "SurveyVotes found", sv, 1);
    });
}

/**
 * Get a specific surveyVote<br>
 * <b>Level needed :</b> Admin
 * @memberof SurveyVote
 * @param {Express.Request} req - request send
 * @param {ObjectId} req.params.surveyVote_id - id of the surveyVote
 * @param {Express.Response} res - variable to send the response
 */
function getSurveyVote(req, res) {
    SurveyVote.findById(req.params.surveyVote_id, function (err, sv) {
        if (err) Response(res, "Error", err, 0);
        else if (sv == null) Response(res, "Error : SurveyVote not found", null, 0);
        else Response(res, "SurveyVote found", sv, 1);
    });
}

/**
 * Get survey vote on a survey of logged client<br>
 * <b>Level needed :</b> Member
 * @memberof SurveyVote
 * @param {Express.Request} req - request send
 * @param {ObjectId} req.params.survey_id - id of the survey
 * @param {Express.Response} res - variable to send the response
 */
function getSessionSurveyVote(req, res) {
    SurveyVote.findById(req.params.surveyVote_id, function (err, sv) {
        if (err) Response(res, "Error", err, 0);
        else if (sv == null) Response(res, "Error : SurveyVote not found", null, 0);
        else Response(res, "SurveyVote found", sv, 1);
    });
}

/**
 * Delete a surveyVote<br>
 * <b>Level needed :</b> Admin
 * @memberof SurveyVote
 * @param {Express.Request} req - request send
 * @param {ObjectId} req.params.surveyVote_id - id of the surveyVote
 * @param {Express.Response} res - variable to send the response
 */
function deleteSurveyVote(req, res) {
    SurveyVote.remove({
        _id: req.params.surveyVote_id
    }, function (err, sv) {
        if (err) Response(res, "Error", err, 0);
        else Response(res, "SurveyVote deleted", sv, 1);
    });
}

/**
 * Delete surveyVotes on a survey of logged client<br>
 * <b>Level needed :</b> Member
 * @memberof SurveyVote
 * @param {Express.Request} req - request send
 * @param {ObjectId} req.params.survey_id - id of the survey
 * @param {Express.Response} res - variable to send the response
 */
function deleteSessionSurveyVote(req, res) {
    SurveyVote.remove({
        _id: req.params.surveyVote_id
    }, function (err, sv) {
        if (err) Response(res, "Error", err, 0);
        else Response(res, "SurveyVote deleted", sv, 1);
    });
}

/**
 * Get results for a survey<br>
 * Result has this form :<br>
 * - a field with id of surveyItem for each surveyItem<br>
 * (example : data.54f2e15d4a1d54e2)<br>
 * - data.total for the total number of votes<br>
 * <b>Level needed :</b> Admin
 * @memberof SurveyVote
 * @param {Express.Request} req - request send
 * @param {ObjectId} req.params.surveyVote_id - id of the surveyVote
 * @param {Express.Response} res - variable to send the response
 */
function getSurveyVoteResult(req, res) {

}