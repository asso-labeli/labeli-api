/**
 * <h2>Model</h2>
 * <table>
 * <tr><td><b>Name</b></td><td><b>Type</b></td><td><b>Default Value</b></td></tr>
 * <tr><td>name</td><td>String</td></tr>
 * <tr><td>created</td><td>Date</td><td>Date.now</td></tr>
 * <tr><td>lastEdited</td><td>Date</td><td>Date.now</td></tr>
 * <tr><td>survey</td><td>ObjectId</td></tr>
 * </table><br>
 * <h2>Routing Table</h2>
 * <table>
 * <tr><td>POST /surveyItems/:survey_id</td><td>{@link SurveyItem.createSurveyItem}</td></tr>
 * <tr><td>GET /surveyItems/:survey_id</td><td>{@link SurveyItem.getSurveyItems}</td></tr>
 * <tr><td>GET /surveyItem/:surveyItem_id</td><td>{@link SurveyItem.getSurveyItem}</td></tr>
 * <tr><td>PUT /surveyItem/:surveyItem_id</td><td>{@link SurveyItem.editSurveyItem}</td></tr>
 * <tr><td>DELETE /surveyItem/:surveyItem_id</td><td>{@link SurveyItem.deleteSurveyItem}</td></tr></table><br>
 * @namespace SurveyItem
 * @author Florian Kauder
 */

var Survey = require('../models/survey');
var SurveyItem = require('../models/surveyItem');
var Response = require('../modules/response');
var User = require('../models/user');
var Log = require('../modules/log');

var isMongooseId = require('mongoose').Types.ObjectId.isValid;

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

/**
 * Create a new surveyItem<br>
 * <b>Level needed :</b> Owner | Admin<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-1</td><td>Not logged</td></tr>
 * <tr><td>-3</td><td>Not at least a member</td></tr>
 * <tr><td>-4</td><td>Not owner</td></tr>
 * <tr><td>-22</td><td>Survey not found</td></tr>
 * <tr><td>-29</td><td>MangoDB error during save()</td></tr>
 * <tr><td>-31</td><td>ID not valid</td></tr>
 * </table>
 * @memberof SurveyItem
 * @param {Express.Request} req - request send
 * @param {String} req.body.name - name of the item
 * @param {ObjectId} req.params.survey_id - ID of survey
 * @param {Express.Response} res - variable to send the response
 */
function createSurveyItem(req, res) {
  if (req.session.level == User.Level.Guest) {
    Response.notLogged(res);
    return;
  }
  else if (req.session.level < User.Level.Member) {
    Response.notMember(res);
    return;
  }
  else if (!isMongooseId(req.params.project_id)) {
    Response.invalidID(res);
    return;
  }

  // Check variables in req.body
  if (!('name' in req.body)) {
    Response.missing(res, 'name');
    return;
  }

  var surveyItem = new SurveyItem();
  var surveyFound = true;
  var survey = null;

  surveyItem.name = req.body.name;

  async.parallel([
    // Search Survey to check author
    function searchSurvey(callback) {
      Survey.findById(req.params.survey_id,
        function afterSurveySearch(err, s) {
          if (err || s == null) surveyFound = false;
          else surveyItem.survey = s._id;

          survey = s;
          callback();
        });
    }
  ], function useResult() {
    if (!surveyFound) Response.notFound(res, 'survey');
    // Check if the logged client isn't survey's owner or an admin
    else if ((survey.author != req.session.userId) &&
      (req.session.level < User.Level.Admin))
      Response.notOwner(res);
    else surveyItem.save(function afterSISave(err) {
      if (err) Response.saveError(res, err);
      else {
        Response.success(res, "SurveyItem created", surveyItem);
        Log.i("SurveyItem \"" + surveyItem.name + "\"(" + surveyItem._id +
          ") created by user " + req.session.userId);
      }
    });
  });
}

/**
 * Get all surveyItems of a survey<br>
 * <b>Level needed :</b> Guest<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-22</td><td>No surveyItem found</td></tr>
 * <tr><td>-27</td><td>MongoDB error during find()</td></tr>
 * <tr><td>-31</td><td>ID not valid</td></tr>
 * </table>
 * @memberof SurveyItem
 * @param {Express.Request} req - request send
 * @param {ObjectId} req.params.survey_id - ID of survey
 * @param {Express.Response} res - variable to send the response
 */
function getSurveyItems(req, res) {
  if (isMongooseId(req.params.survey_id))
    Response.invalidID(res);
  else
    SurveyItem.find({
      survey: req.params.survey_id
    }, function afterSIsearch(err, sis) {
      if (err) Response.findError(res, err);
      else if (typeof sis === 'undefined' ||  sis.length == 0)
        Response.notFound(res, 'surveyItem');
      else Response.success(res, "SurveyItems found", sis);
    });
}

/**
 * Get a specific surveyItem<br>
 * <b>Level needed :</b> Guest<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-22</td><td>No surveyItem found</td></tr>
 * <tr><td>-27</td><td>MongoDB error during find()</td></tr>
 * <tr><td>-31</td><td>ID not valid</td></tr>
 * </table>
 * @memberof SurveyItem
 * @param {Express.Request} req - request send
 * @param {ObjectId} req.params.surveyItem_id - ID of surveyItem
 * @param {Express.Response} res - variable to send the response
 */
function getSurveyItem(req, res) {
  if (isMongooseId(req.params.surveyItem_id))
    Response.invalidID(res);
  else
    SurveyItem.findById(req.params.surveyItem_id,
      function afterSISearch(err, si) {
        if (err) Response.findError(res, err);
        else if (si == null) Response.notFound(res, 'surveyItem');
        else Response.success(res, "SurveyItem found", si);
      });
}

/**
 * Edit a surveyItem<br>
 * <b>Level needed :</b> Owner | Admin<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-4</td><td>Not owner of survey</td></tr>
 * <tr><td>-22</td><td>No surveyItem found</td></tr>
 * <tr><td>-27</td><td>MongoDB error during find()</td></tr>
 * <tr><td>-31</td><td>ID not valid</td></tr>
 * </table>
 * @memberof SurveyItem
 * @param {Express.Request} req - request send
 * @param {String} [req.body.name] - new name
 * @param {ObjectId} req.params.surveyItem_id - ID of surveyItem
 * @param {Express.Response} res - variable to send the response
 */
function editSurveyItem(req, res) {
  if (req.session.level == User.Level.Guest)
    Response.notLogged();
  else if (isMongooseId(req.params.surveyItem_id))
    Response.invalidID(res);
  else // Get the surveyItem
    SurveyItem.findById(req.params.surveyItem_id,
    function afterFindSearch(err, si) {
      if (err) Response.findError(res, err);
      else if (si == null) Response.notFound(res, 'surveyItem');
      else // Get the survey of surveyItem
        Survey.findById(si.survey,
        function afterSurveySearch(err, s) {
          if (err || s == null) Response.findError(res, err);
          // Check if the logged client isn't survey's owner or an admin
          else if ((s.author != req.session.userId) &&
            (req.session.level < User.Level.Admin))
            Response.notOwner(res);
          else {
            if ('name' in req.body) si.name = req.body.name;

            si.save(function afterSISave(err) {
              if (err) Response.saveError(res, err);
              else {
                Response.success(res, "SurveyItem updated", si);
                Log.i("SurveyItem \"" + si.name + "\"(" + si._id +
                  ") updated by user " + req.session.userId);
              }
            });
          }
        });
    });
}

/**
 * Delete a surveyItem<br>
 * <b>Level needed :</b> Owner | Admin<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-4</td><td>Not owner of survey</td></tr>
 * <tr><td>-22</td><td>No surveyItem/survey found</td></tr>
 * <tr><td>-27</td><td>MongoDB error during find()</td></tr>
 * <tr><td>-28</td><td>MongoDB error during remove()</td></tr>
 * <tr><td>-31</td><td>ID not valid</td></tr>
 * </table>
 * @memberof SurveyItem
 * @param {Express.Request} req - request send
 * @param {ObjectId} req.params.surveyItem_id - ID of surveyItem
 * @param {Express.Response} res - variable to send the response
 */
function deleteSurveyItem(req, res) {
  if (req.session.level == User.Level.Guest)
    Response.notLogged(res);
  else if (isMongooseId(req.params.surveyItem_id))
    Response.invalidID(res);
  else
  // Get the surveyItem
    SurveyItem.findById(req.params.surveyItem_id, function(err, si) {
    if (err) Response.findError(res, err);
    else if (si == null) Response.notFound(res, 'surveyItem');
    else // Get the survey of surveyItem
      Survey.findById(si.survey,
      function afterSurveySearch(err, s) {
        if (err) Response.findError(res, err);
        else if (s == null) Response.notFound(res, 'survey');
        // Check if the logged client isn't survey's owner or an admin
        else if ((s.author != req.session.userId) &&
          (req.session.level < User.Level.Admin))
          Response.notOwner(res);
        else {
          SurveyItem.remove({
            _id: req.params.surveyItem_id
          }, function afterSurveyRemove(err, si) {
            if (err) Response.removeError(res, err);
            else {
              Response.success(res, "SurveyItem deleted", si);
              Log.i("SurveyItem \"" + si.name + "\"(" + si._id +
                ") deleted by user " + req.session.userId);
            }
          });
        }
      });
  });
}
