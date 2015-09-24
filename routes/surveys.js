/**
 * <h2>Model</h2>
 * <table>
 * <tr><td><b>Name</b></td><td><b>Type</b></td><td><b>Default Value</b></td></tr>
 * <tr><td>description</td><td>String</td></tr>
 * <tr><td>name</td><td>String</td></tr>
 * <tr><td>state</td><td>Number</td><td>1</td></tr>
 * <tr><td>numberChoices</td><td>Number</td><td>1</td></tr>
 * <tr><td>created</td><td>Date</td><td>Date.now</td></tr>
 * <tr><td>lastEdited</td><td>Date</td><td>Date.now</td></tr>
 * <tr><td>author</td><td>ObjectId</td></tr>
 * </table><br>
 * <h2>Routing Table</h2>
 * <table>
 * <tr><td>POST /surveys/</td><td>{@link Survey.createSurvey}</td></tr>
 * <tr><td>GET /surveys/</td><td>{@link Survey.getSurveys}</td></tr>
 * <tr><td>GET /surveys/:survey_id</td><td>{@link Survey.getSurvey}</td></tr>
 * <tr><td>PUT /surveys/:survey_id</td><td>{@link Survey.editSurvey}</td></tr>
 * <tr><td>DELETE /surveys/:survey_id</td><td>{@link Survey.deleteSurvey}</td></tr></table><br>
 * <h2>Constants</h2>
 * <h5>Survey.State</h5>
 * <table>
 * <tr><td>IsClosed</td><td>0</td></tr>
 * <tr><td>IsOpened</td><td>1</td></tr></table>
 * @namespace Survey
 * @author Florian Kauder
 */

var User = require('../models/user');
var Survey = require('../models/survey');
var Response = require('../modules/response');
var Log = require('../modules/log');

var isMongooseId = require('mongoose').Types.ObjectId.isValid;

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

/**
 * Create a new survey<br>
 * <b>Level needed :</b> Member<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-1</td><td>Not logged</td></tr>
 * <tr><td>-3</td><td>Not at least a member</td></tr>
 * <tr><td>-21</td><td>Survey with name already exists</td></tr>
 * <tr><td>-22</td><td>Survey not found</td></tr>
 * <tr><td>-29</td><td>MangoDB error during save()</td></tr>
 * </table>
 * @memberof Survey
 * @param {Express.Request} req - request send
 * @param {String} req.body.name - name of the survey
 * @param {String} [req.body.description] - description of the survey
 * @param {Number} [req.body.state] - new state (0 : closed - 1 : opened)
 * @param {Express.Response} res - variable to send the response
 */
function createSurvey(req, res) {
  if (req.session.level == User.Level.Guest) {
    Response.notLogged(res);
    return;
  }
  else if (req.session.level < User.Level.Member) {
    Response.notMember(res);
    return;
  }

  var survey = new Survey();
  var surveyNameFound = false;

  // Check variables in req.body
  if (!('name' in req.body)) {
    Response.missing(res, 'name');
    return;
  }

  if ('description' in req.body) survey.description = req.body.description;
  if ('state' in req.body) {
    if (state > 1) survey.state = 1;
    else if (state < 0) survey.state = 0;
    else survey.state = req.body.state;
  }

  // Assign values to survey
  survey.name = req.body.name;
  survey.author = req.session.userId;

  async.parallel([
    function searchSurveyWithSameName(callback) {
      Survey.findOne({
        name: req.body.name
      }, function afterNameSearch(err, s) {
        if (err || s == null) surveyNameFound = false;
        else surveyNameFound = true;
        callback();
      });
    }
  ], function afterSearch() {
    if (surveyNameFound)
      Response.alreadyExist(res, 'survey with this name');
    else
      survey.save(function afterSurveySave(err) {
        if (err) Response.saveError(err, res);
        else {
          Response.success(res, "Survey created", survey);
          Log.i("Survey \"" + survey.name + "\"(" + survey._id +
            ") created by user " + req.session.userId);
        }
      });
  });
}

/**
 * Get all surveys<br>
 * <b>Level needed :</b> Guest<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-22</td><td>Survey not found</td></tr>
 * <tr><td>-27</td><td>MangoDB error during find()</td></tr>
 * </table>
 * @memberof Survey
 * @param {Express.Request} req - request send
 * @param {Express.Response} res - variable to send the response
 */
function getSurveys(req, res) {
  Survey.find(function afterSurveySearch(err, surveys) {
    if (err) Response.findError(res, err);
    else if (typeof surveys === 'undefined' || surveys.length == 0)
      Response.notFound(res, 'survey');
    else Response.success(res, "Surveys found", surveys);
  });
}

/**
 * Get a specific survey<br>
 * <b>Level needed :</b> Guest<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-22</td><td>Survey not found</td></tr>
 * <tr><td>-27</td><td>MangoDB error during find()</td></tr>
 * <tr><td>-31</td><td>Invalid ID</td></tr>
 * </table>
 * @memberof Survey
 * @param {Express.Request} req - request send
 * @param {ObjectID} req.params.survey_id - ID of survey
 * @param {Express.Response} res - variable to send the response
 */
function getSurvey(req, res) {
  if (!isMongooseId(req.params.survey_id))
    Response.invalidID(res);
  else
    Survey.findById(req.params.survey_id,
      function afterSurveySearch(err, survey) {
        if (err) Response.findError(res, err);
        else if (survey == null) Response.notFound(res, 'survey');
        else
          Response.success(res, "Survey found", survey);
      });
}

/**
 * Edit a survey<br>
 * <b>Level needed :</b> Owner | Admin<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-1</td><td>Not logged</td></tr>
 * <tr><td>-4</td><td>Not owner</td></tr>
 * <tr><td>-22</td><td>Survey not found</td></tr>
 * <tr><td>-27</td><td>MangoDB error during find()</td></tr>
 * <tr><td>-29</td><td>MangoDB error during save()</td></tr>
 * <tr><td>-31</td><td>Invalid ID</td></tr>
 * </table>
 * @memberof Survey
 * @param {Express.Request} req - request send
 * @param {String} [req.body.description] - new description
 * @param {String} [req.body.name] - new name
 * @param {Number} [req.body.state] - new state (0 : closed - 1 : opened)
 * @param {ObjectID} req.params.survey_id - ID of survey
 * @param {Express.Response} res - variable to send the response
 */
function editSurvey(req, res) {
  if (req.session.level == User.Level.Guest)
    Response.notLogged(res);
  else if (!isMongooseId(req.params.survey_id))
    Response.invalidID(res);
  else
    Survey.findById(req.params.survey_id,
      function afterSurveySearch(err, survey) {
        if (err) {
          Response.findError(res, err);
          return;
        }
        else if (survey == null) {
          Response.notFound(res, 'survey');
          return;
        }
        else if ((survey.author != req.session.userId) && (req.session.level < User.Level.Admin)) {
          Response.notOwner(res);
          return;
        }

        // Change values
        if ('description' in req.body) survey.description = req.body.description;
        if ('name' in req.body) survey.name = req.body.name;
        if ('state' in req.body) {
          if (state > 1) survey.state = 1;
          else if (state < 0) survey.state = 0;
          else survey.state = req.body.state;
        }

        survey.save(function afterSurveySearch(err) {
          if (err) Response.saveError(res, err);
          else {
            Response.success(res, "Survey updated", survey);
            Log.i("Survey \"" + survey.name + "\"(" + survey._id +
              ") edited by user " + req.session.userId);
          }
        });
      });
}

/**
 * Delete a survey<br>
 * <b>Level needed :</b> Owner | Admin<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-1</td><td>Not logged</td></tr>
 * <tr><td>-4</td><td>Not owner</td></tr>
 * <tr><td>-22</td><td>Survey not found</td></tr>
 * <tr><td>-27</td><td>MangoDB error during find()</td></tr>
 * <tr><td>-28</td><td>MangoDB error during remove()</td></tr>
 * <tr><td>-31</td><td>Invalid ID</td></tr>
 * </table>
 * @memberof Survey
 * @param {Express.Request} req - request send
 * @param {ObjectID} req.params.survey_id - ID of survey
 * @param {Express.Response} res - variable to send the response
 */
function deleteSurvey(req, res) {
  if (req.session.level == User.Level.Guest)
    Response.notLogged(res);
  else if (!isMongooseId(req.params.survey_id))
    Response.invalidID(res);
  else
    Survey.findById(req.params.survey_id,
      function afterSurveySearch(err, survey) {
        if (err) Response.findError(res, err);
        else if (survey == null) Response.notFound(res, 'survey');
        else if ((survey.author != req.session.userId) &&
          (req.session.level < User.Level.Admin))
          Response.notOwner(res);
        else
          Survey.remove({
            _id: req.params.survey_id
          }, function afterSurveyRemove(err, survey) {
            if (err) Response.removeError(res, err);
            else {
              Response.success(res, "Survey deleted", survey);
              Log.i("Survey \"" + survey.name + "\"(" + survey._id +
                ") deleted by user " + req.session.userId);
            }
          });
      });
}
