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
 * <b>Level needed :</b> Owner | Admin
 * @memberof SurveyItem
 * @param {Express.Request} req - request send
 * @param {String} req.body.name - name of the item
 * @param {ObjectId} req.params.survey_id - ID of survey
 * @param {Express.Response} res - variable to send the response
 */
function createSurveyItem(req, res) {
    if (req.session.level == User.Level.Guest) {
        Response(res, "Error : Not logged", null, 0);
        return;
    }

    // Check variables in req.body
    if (!('name' in req.body)) {
        Response(res, "Error : No name given", null, 0);
        return;
    }

    var surveyItem = new SurveyItem();
    var surveyFound = true;
    var survey = null;

    surveyItem.name = req.body.name;

    async.parallel([
        // Search Survey to check author
        function searchSurvey(callback) {
            Survey.findById(req.params.survey_id, function (err, s) {
                if (err || s == null) surveyFound = false;
                else surveyItem.survey = s._id;

                survey = s;
                callback();
            });
    }], function useResult() {
        if (!surveyFound) Response(res, "Error : Survey not found", null, 0);
        // Check if the logged client isn't survey's owner or an admin
        else if ((survey.author != req.session.userId) &&
            (req.session.level < User.Level.Admin))
            Response(res, "Error : You're not an admin", null, 0);
        else surveyItem.save(function (err) {
            if (err) Response(res, "Error", err, 0);
            else {
                Response(res, "SurveyItem created", surveyItem, 1);
                Log.i("SurveyItem \"" + surveyItem.name + "\"(" + surveyItem._id +
                      ") created by user " + req.session.userId);
            }
        });
    });
}

/**
 * Get all surveyItems of a survey<br>
 * <b>Level needed :</b> Guest
 * @memberof SurveyItem
 * @param {Express.Request} req - request send
 * @param {ObjectId} req.params.survey_id - ID of survey
 * @param {Express.Response} res - variable to send the response
 */
function getSurveyItems(req, res) {
    SurveyItem.find({
        survey: req.params.survey_id
    }, function (err, sis) {
        if (err) Response(res, "Error", err, 0);
        else Response(res, "SurveyItems found", sis, 1);
    });
}

/**
 * Get a specific surveyItem<br>
 * <b>Level needed :</b> Guest
 * @memberof SurveyItem
 * @param {Express.Request} req - request send
 * @param {ObjectId} req.params.surveyItem_id - ID of surveyItem
 * @param {Express.Response} res - variable to send the response
 */
function getSurveyItem(req, res) {
    SurveyItem.findById(req.params.surveyItem_id, function (err, si) {
        if (err) Response(res, "Error", err, 0);
        else if (si == null) Response(res, "Error : SurveyItem not found", null, 0);
        else Response(res, "SurveyItem found", si, 1);
    });
}

/**
 * Edit a surveyItem<br>
 * <b>Level needed :</b> Owner | Admin
 * @memberof SurveyItem
 * @param {Express.Request} req - request send
 * @param {String} [req.body.name] - new name
 * @param {ObjectId} req.params.surveyItem_id - ID of surveyItem
 * @param {Express.Response} res - variable to send the response
 */
function editSurveyItem(req, res) {
    if (req.session.level == User.Level.Guest) {
        Response(res, "Error : Not logged", null, 0);
        return;
    }

    // Get the surveyItem
    SurveyItem.findById(req.params.surveyItem_id, function (err, si) {
        if (err) {
            Response(res, "Error", err, 0);
            return;
        } else if (si == null) {
            Response(res, "Error : SurveyItem not found", null, 0);
            return;
        }

        // Get the survey of surveyItem
        Survey.findById(si.survey, function (err, s) {
            if (err || s == null) Response(res, "Error", err, 0);
            // Check if the logged client isn't survey's owner or an admin
            else if ((s.author != req.session.userId) &&
                (req.session.level < User.Level.Admin))
                Response(res, "Error : You're not an admin", null, 0);
            else {
                if ('name' in req.body) si.name = req.body.name;

                si.save(function (err) {
                    if (err) Response(res, "Error", err, 0);
                    else {
                        Response(res, "SurveyItem updated", si, 1);
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
 * <b>Level needed :</b> Owner | Admin
 * @memberof SurveyItem
 * @param {Express.Request} req - request send
 * @param {ObjectId} req.params.surveyItem_id - ID of surveyItem
 * @param {Express.Response} res - variable to send the response
 */
function deleteSurveyItem(req, res) {
    if (req.session.level == User.Level.Guest) {
        Response(res, "Error : Not logged", null, 0);
        return;
    }

    // Get the surveyItem
    SurveyItem.findById(req.params.surveyItem_id, function (err, si) {
        if (err) {
            Response(res, "Error", err, 0);
            return;
        } else if (si == null) {
            Response(res, "Error : SurveyItem not found", null, 0);
            return;
        }

        // Get the survey of surveyItem
        Survey.findById(si.survey, function (err, s) {
            if (err || s == null) Response(res, "Error", err, 0);
            // Check if the logged client isn't survey's owner or an admin
            else if ((s.author != req.session.userId) &&
                (req.session.level < User.Level.Admin))
                Response(res, "Error : You're not an admin", null, 0);
            else {
                SurveyItem.remove({
                    _id: req.params.surveyItem_id
                }, function (err, si) {
                    if (err) Response(res, "Error", err, 0);
                    else {
                        Response(res, "SurveyItem deleted", si, 1);
                        Log.i("SurveyItem \"" + si.name + "\"(" + si._id +
                              ") deleted by user " + req.session.userId);
                    }
                });
            }
        });
    });
}
