/**
 * {@link SurveyVote.getSurveyVotes}, {@link SurveyVote.getSurveyVote} and {@link SurveyVote.deleteSurveyVote} need admin rights to protect anonymity of votes.<br>
 * <h2>Model</h2>
 * <table>
 * <tr><td><b>Name</b></td><td><b>Type</b></td><td><b>Default Value</b></td></tr>
 * <tr><td>created</td><td>Date</td><td>Date.now</td></tr>
 * <tr><td>lastEdited</td><td>Date</td><td>Date.now</td></tr>
 * <tr><td>survey</td><td>ObjectId</td></tr>
 * <tr><td>value</td><td>ObjectId</td></tr>
 * <tr><td>author</td><td>ObjectId</td></tr>
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
    if (req.session.level == User.Level.Guest) {
        Response(res, "Error : Not logged", null, 0);
        return;
    }

    // Check variables in req.body
    if (!('items' in req.body)) {
        Response(res, "Error : No items given", null, 0);
        return;
    } else if (!Array.isArray(req.body.items)) {
        Response(res, "Error : Items must be an array", null, 0);
        return;
    }

    // Checker for survey exist
    var surveyFound = true;
    // Checker for surveyItem exist
    var surveyItemFound = true;
    // Checker for surveyItem are in the survey
    var surveyItemValid = true;
    // Checker for descruction of old surveyVotes
    var surveyVotesDeleted = true;
    var deletionError = null;

    var survey = null;
    var surveyItems = [];

    var surveyVoteNotCreated = false;

    var surveyVotes = [];

    async.parallel([
        // Search survey give in params
        function searchSurvey(callback) {
                Survey.findById(req.params.survey_id,
                    function (err, s) {
                        if (err || s == null) surveyFound = false;
                        else survey = s;
                        callback();
                    });
        }],
        function useResult(err) {
            // For each item give in parameter
            async.each(req.body.items,
                function searchSurveyItem(v, callback) {
                    SurveyItem.findById(v, function (err, surveyItem) {
                        // Check if surveyItem exist
                        if (err || surveyItem == null)
                            surveyItemFound = false;
                        // Check if surveyItem are in good survey
                        else if (!surveyItem.survey.equals(survey._id))
                            surveyItemValid = false;
                        else surveyItems.push(surveyItem._id);
                        callback();
                    });
                },
                function useResult(err) {
                    // Check if the survey exist
                    if (!surveyFound)
                        Response(res, "Error : Survey not found", null, 0);
                    // Check if all surveyItems exists
                    else if (!surveyItemFound)
                        Response(res, "Error : One SurveyItem not exist",
                            null, 0);
                    // Check if the survey is closed
                    else if (survey.state == Survey.State.IsClosed)
                        Response(res, "Error : Survey closed", null, 0);
                    // Check if all surveyItems are in the good survey
                    else if (!surveyItemValid)
                        Response(res, "Error : One SurveyItem not valid");
                    // Check number of surveyItems 
                    else if (surveyItems.length > survey.numberChoices)
                        Response(res, "Error : Too many surveyItems",
                            null, 0);
                    else {
                        async.series([
                            // Remove all old surveyVotes
                    function removeOldSurveyVotes(callback) {
                                SurveyVote.remove({
                                    author: req.session.userId,
                                    survey: survey
                                }, function (err) {
                                    if (err) {
                                        surveyVotesDeleted = false;
                                        deletionError = err;
                                    }
                                    callback();
                                });
                    },
                            // Create all new surveyVotes
                    function createSurveyVotes(callback) {
                                if (surveyVotesDeleted) {
                                    // Create a new vote for each SurveyItem
                                    async.each(surveyItems,
                                        function createSurveyVote(v, callbackItem) {
                                            var sv = new SurveyVote();

                                            sv.author = req.session.userId;
                                            sv.survey = survey._id;
                                            sv.value = v;

                                            surveyVotes.push(sv);

                                            sv.save(function (err) {
                                                if (err)
                                                    surveyVoteNotCreated = true;
                                                callbackItem();
                                            });
                                        });
                                }
                                callback();
                    },
                            // Use results of creation and deletion
                    function useResult(callback) {
                                // Check if surveyVotes has been correctly deleted
                                if (!surveyVotesDeleted)
                                    Response(res,
                                        "Error : During deletion of old surveyVotes",
                                        deletionError, 0);
                                // Check if surveyVotes has been correctly created
                                else if (surveyVoteNotCreated)
                                    Response(res,
                                        "Error : SurveyVote not created",
                                        null, 0);
                                else
                                    Response(res, "SurveyVotes created",
                                        surveyVotes, 1);
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
    if (req.session.level == User.Level.Guest) {
        Response(res, "Error : Not logged", null, 0);
        return;
    } else if (req.session.level < User.Level.Admin) {
        Response(res, "Error : You're not an admin", null, 0);
        return;
    }

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
    if (req.session.level == User.Level.Guest) {
        Response(res, "Error : Not logged", null, 0);
        return;
    } else if (req.session.level < User.Level.Admin) {
        Response(res, "Error : You're not an admin", null, 0);
        return;
    }

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
    if (req.session.level == User.Level.Guest) {
        Response(res, "Error : Not logged", null, 0);
        return;
    }

    SurveyVote.find({
            survey: req.params.survey_id,
            // Use userId from logged client to find his surveyVotes
            author: req.session.userId
        },
        function (err, sv) {
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
    if (req.session.level == User.Level.Guest) {
        Response(res, "Error : Not logged", null, 0);
        return;
    } else if (req.session.level < User.Level.Admin) {
        Response(res, "Error : You're not an admin", null, 0);
        return;
    }

    SurveyVote.remove({
        _id: req.params.surveyVote_id
    }, function (err, sv) {
        if (err) Response(res, "Error", err, 0);
        else if (sv == null || sv == [])
            Response(res, "Error : SurveyVote not found", null, 0);
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
    if (req.session.level == User.Level.Guest) {
        Response(res, "Error : Not logged", null, 0);
        return;
    }

    SurveyVote.remove({
        survey: req.params.survey_id,
        // Use userId from logged client to find his surveyVotes
        author: req.session.userId
    }, function (err, sv) {
        if (err) Response(res, "Error", err, 0);
        else if (sv == null || sv == [])
            Response(res, "Error : SurveyVote not found", null, 0);
        else Response(res, "SurveyVote deleted", sv, 1);
    });
}

/**
 * Get results for a survey<br>
 * Result has this form :<br>
 * - a field with id of surveyItem for each surveyItem<br>
 * (example : data.54f2e15d4a1d54e2)<br>
 * - data.total for the total number of votes<br>
 * <b>Level needed :</b> Member
 * @memberof SurveyVote
 * @param {Express.Request} req - request send
 * @param {ObjectId} req.params.surveyVote_id - id of the surveyVote
 * @param {Express.Response} res - variable to send the response
 */
function getSurveyVoteResult(req, res) {
    if (req.session.level == User.Level.Guest) {
        Response(res, "Error : Not logged", null, 0);
        return;
    } 

    // Search all votes for the survey
    SurveyVote.find({
        survey: req.params.survey_id
    }, function (err, sv) {
        if (err) Response(res, "Error", err, 0);
        else if (sv == null || sv == [])
            Response(res, "Error : SurveyVotes not found", {total : 0}, 0);
        else{
            var data = {total : 0};
            // For each votes found
            for (var i = 0; i < sv.length; i++){
                // sv[i].value == vote.value == a surveyItem (see SurveyVote Model)
                // Initialize data field if not exist
                if (data[sv[i].value] == null)
                    data[sv[i].value] = 0;
                
                // Add a vote to field and to total
                data[sv[i].value]++;
                data.total++;
            }
            
            Response(res, "SurveyVotes found", data, 1);
        }
    });
}