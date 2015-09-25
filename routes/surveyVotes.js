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
 * <tr><td>POST /surveyVotes/:project_id</td><td>{@link SurveyVote.createSurveyVote}</td></tr>
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
var Log = require('../modules/log');

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
 * <b>Level needed :</b> Member<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-1</td><td>Not logged</td></tr>
 * <tr><td>-3</td><td>Not at least a member</td></tr>
 * <tr><td>-21</td><td>Survey with name already exists</td></tr>
 * <tr><td>-22</td><td>Survey not found</td></tr>
 * <tr><td>-28</td><td>MangoDB error during find()</td></tr>
 * <tr><td>-29</td><td>MangoDB error during save()</td></tr>
 * <tr><td>-31</td><td>Invalid ID</td></tr>
 * <tr><td>-32</td><td>Invalid items : must be an array / Invalid SurveyItem in array</td></tr>
 * <tr><td>-41</td><td>Survey closed</td></tr>
 * <tr><td>-42</td><td>Too many items</td></tr>
 * </table>
 * @memberof SurveyVote
 * @param {Express.Request} req - request send
 * @param {Array(ObjectID)} req.body.items - array with id of items
 * @param {ObjectId} req.params.survey_id - id of the survey
 * @param {Express.Response} res - variable to send the response
 */
function createSurveyVote(req, res) {
  if (req.session.level == User.Level.Guest) {
    Response.notLogged(res);
    return;
  }
  else if (req.session.level == User.Level.OldMember) {
    Response.notMember(res);
    return;
  }
  else if (!isMongooseId(req.params.survey_id)) {
    Response.invalidID(res);
    return;
  }

  // Check variables in req.body
  if (!('items' in req.body)) {
    Response.missing(res, 'items');
    return;
  }
  else if (!Array.isArray(req.body.items)) {
    Response.invalidParameter(res, 'items : must be an array');
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
          function afterSurveySearch(err, s) {
            if (err || s == null) surveyFound = false;
            else survey = s;
            callback();
          });
      }
    ],
    function afterSearch(err) {
      // For each item give in parameter
      async.each(req.body.items,
        function searchSurveyItem(v, callback) {
          SurveyItem.findById(v,
            function afterSISearch(err, surveyItem) {
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
        function afterSearch(err) {
          // Check if the survey exist
          if (!surveyFound) Response.notFound(res, 'survey');
          // Check if all surveyItems exists
          else if (!surveyItemFound)
            Response.notFound(res, 'surveyItem');
          // Check if the survey is closed
          else if (survey.state == Survey.State.IsClosed)
            Response.surveyClosed(res);
          // Check if all surveyItems are in the good survey
          else if (!surveyItemValid)
            Response.invalidParameter(res, "surveyItem not valid");
          // Check number of surveyItems
          else if (surveyItems.length > survey.numberChoices)
            Response.tooManyItems(res);
          else {
            async.series([
              // Remove all old surveyVotes
              function removeOldSurveyVotes(callback) {
                SurveyVote.remove({
                  user: req.session.userId,
                  survey: survey
                }, function afterSVRemove(err) {
                  if (err) {
                    surveyVotesDeleted = false;
                    Response.removeError(res, err);
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

                      sv.user = req.session.userId;
                      sv.survey = survey._id;
                      sv.value = v;

                      surveyVotes.push(sv);

                      sv.save(function afterSVSave(err) {
                        if (err){
                          surveyVoteNotCreated = true;
                          Response.saveError(res, err);
                        }
                        callbackItem();
                      });
                    });
                }
                callback();
              },
              // Use results of creation and deletion
              function useResult(callback) {
                // Check if surveyVotes has been correctly deleted
                if (!surveyVotesDeleted) return;
                // Check if surveyVotes has been correctly created
                else if (surveyVoteNotCreated) return;
                else
                  Response.success(res, "SurveyVotes created", surveyVotes);
                callback();
              }
            ]);
          }
        });
    });
}

/**
 * Get all SurveyVotes of a survey<br>
 * <b>Level needed :</b> Admin<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-1</td><td>Not logged</td></tr>
 * <tr><td>-2</td><td>Not admin</td></tr>
 * <tr><td>-22</td><td>SurveyVote not found</td></tr>
 * <tr><td>-27</td><td>MangoDB error during find()</td></tr>
 * <tr><td>-31</td><td>Invalid ID</td></tr>
 * </table>
 * @memberof SurveyVote
 * @param {Express.Request} req - request send
 * @param {ObjectId} req.params.survey_id - id of the survey
 * @param {Express.Response} res - variable to send the response
 */
function getSurveyVotes(req, res) {
  if (req.session.level == User.Level.Guest)
    Response.notLogged(res);
  else if (req.session.level < User.Level.Admin)
    Response.notAdmin(res);
  else if (!isMongooseId(req.params.survey_id))
    Response.invalidID(res);
  else
    SurveyVote.find({
      survey: req.params.survey_id
    }, function afterSVSearch(err, sv) {
      if (err) Response.findError(res, err);
      else if (typeof sv === 'undefined' ||  sv.length == 0)
        Response.notFound(res, 'surveyVote');
      else Response.success(res, "SurveyVotes found", sv);
    });
}

/**
 * Get a specific surveyVote<br>
 * <b>Level needed :</b> Admin<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-1</td><td>Not logged</td></tr>
 * <tr><td>-2</td><td>Not admin</td></tr>
 * <tr><td>-22</td><td>SurveyVote not found</td></tr>
 * <tr><td>-27</td><td>MangoDB error during find()</td></tr>
 * <tr><td>-31</td><td>Invalid ID</td></tr>
 * </table>
 * @memberof SurveyVote
 * @param {Express.Request} req - request send
 * @param {ObjectId} req.params.surveyVote_id - id of the surveyVote
 * @param {Express.Response} res - variable to send the response
 */
function getSurveyVote(req, res) {
  if (req.session.level == User.Level.Guest)
    Response.notLogged(res);
  else if (req.session.level < User.Level.Admin)
    Response.notAdmin(res);
  else if (!isMongooseId(req.params.surveyVote_id))
    Response.invalidID(res);
  else
    SurveyVote.findById(req.params.surveyVote_id,
      function afterSVSearch(err, sv) {
        if (err) Response.findError(res, err);
        else if (sv == null) Response.notFround(res, 'surveyVote');
        else Response.success(res, "SurveyVote found", sv);
      });
}

/**
 * Get survey vote on a survey of logged client<br>
 * <b>Level needed :</b> Member<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-1</td><td>Not logged</td></tr>
 * <tr><td>-3</td><td>Not at least a member</td></tr>
 * <tr><td>-22</td><td>SurveyVote not found</td></tr>
 * <tr><td>-27</td><td>MangoDB error during find()</td></tr>
 * <tr><td>-31</td><td>Invalid ID</td></tr>
 * </table>
 * @memberof SurveyVote
 * @param {Express.Request} req - request send
 * @param {ObjectId} req.params.survey_id - id of the survey
 * @param {Express.Response} res - variable to send the response
 */
function getSessionSurveyVote(req, res) {
  if (req.session.level == User.Level.Guest)
    Response.notLogged(res);
  else if (res.session.level < User.Level.OldMember)
    Response.notMember(res);
  else if (!isMongooseId(req.params.survey_id))
    Response.invalidID(res);
  else
    SurveyVote.find({
        survey: req.params.survey_id,
        // Use userId from logged client to find his surveyVotes
        user: req.session.userId
      },
      function afterSVSearch(err, sv) {
        if (err) Response.findError(res, err);
        else if (typeof sv === 'undefined' ||  sv.length == 0)
          Response.notFound(res, 'surveyVote');
        else Response.success(res, "SurveyVote found", sv);
      });
}

/**
 * Delete a surveyVote<br>
 * <b>Level needed :</b> Admin<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-1</td><td>Not logged</td></tr>
 * <tr><td>-2</td><td>Not admin</td></tr>
 * <tr><td>-28</td><td>MangoDB error during remove()</td></tr>
 * <tr><td>-31</td><td>Invalid ID</td></tr>
 * </table>
 * @memberof SurveyVote
 * @param {Express.Request} req - request send
 * @param {ObjectId} req.params.surveyVote_id - id of the surveyVote
 * @param {Express.Response} res - variable to send the response
 */
function deleteSurveyVote(req, res) {
  if (req.session.level == User.Level.Guest)
    Response.notLogged(res);
  else if (req.session.level < User.Level.Admin)
    Response.notAdmin(res);
  else if (!isMongooseId(req.params.surveyVote_id))
    Response.invalidID(res);
  else
    SurveyVote.remove({
      _id: req.params.surveyVote_id
    }, function afterSVRemove(err, sv) {
      if (err) Response.removeError(res, err);
      else Response.success(res, "SurveyVote deleted", sv);
    });
}

/**
 * Delete surveyVotes on a survey of logged client<br>
 * <b>Level needed :</b> Member<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-1</td><td>Not logged</td></tr>
 * <tr><td>-3</td><td>Not at least a member</td></tr>
 * <tr><td>-28</td><td>MangoDB error during remove()</td></tr>
 * <tr><td>-31</td><td>Invalid ID</td></tr>
 * </table>
 * @memberof SurveyVote
 * @param {Express.Request} req - request send
 * @param {ObjectId} req.params.survey_id - id of the survey
 * @param {Express.Response} res - variable to send the response
 */
function deleteSessionSurveyVote(req, res) {
  if (req.session.level == User.Level.Guest)
    Response.notLogged(res);
  else if (res.session.level < User.Level.OldMember)
    Response.notMember(res);
  else if (!isMongooseId(req.params.survey_id))
    Response.invalidID(res);
  else
    SurveyVote.remove({
      survey: req.params.survey_id,
      // Use userId from logged client to find his surveyVotes
      user: req.session.userId
    }, function afterSVRemove(err, sv) {
      if (err) Response.removeError(res, err);
      else Response.success(res, "SurveyVote deleted", sv);
    });
}

/**
 * Get results for a survey<br>
 * Result has this form :<br>
 * - a field with id of surveyItem for each surveyItem<br>
 * (example : data.54f2e15d4a1d54e2)<br>
 * - data.total for the total number of votes<br>
 * <b>Level needed :</b> Member<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-1</td><td>Not logged</td></tr>
 * <tr><td>-3</td><td>Not at least a member</td></tr>
 * <tr><td>-22</td><td>SurveyVote not found</td></tr>
 * <tr><td>-27</td><td>MangoDB error during find()</td></tr>
 * <tr><td>-31</td><td>Invalid ID</td></tr>
 * </table>
 * @memberof SurveyVote
 * @param {Express.Request} req - request send
 * @param {ObjectId} req.params.surveyVote_id - id of the surveyVote
 * @param {Express.Response} res - variable to send the response
 */
function getSurveyVoteResult(req, res) {
  if (req.session.level == User.Level.Guest)
    Response.notLogged(res);
  else if (res.session.level < User.Level.OldMember)
    Response.notMember(res);
  else if (!isMongooseId(req.params.surveyVote_id))
    Response.invalidID(res);
  else // Search all votes for the survey
    SurveyVote.find({
    survey: req.params.survey_id
  }, function afterSVSearch(err, sv) {
    if (err) Response.findError(res, err);
    else if (typeof sv === 'undefined' ||  sv.length == 0)
      Response.notFound(res, 'surveyVote');
    else {
      var data = {
        total: 0
      };

      // For each votes found
      for (var i = 0; i < sv.length; i++) {
        // sv[i].value == vote.value == a surveyItem (see SurveyVote Model)
        // Initialize data field if not exist
        if (data[sv[i].value] == null)
          data[sv[i].value] = 0;

        // Add a vote to field and to total
        data[sv[i].value]++;
        data.total++;
      }

      Response.success(res, "SurveyVotes found", data);
    }
  });
}
