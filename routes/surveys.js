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
 * <b>Level needed :</b> Member
 * @memberof Survey
 * @param {Express.Request} req - request send
 * @param {String} req.body.name - name of the survey
 * @param {String} [req.body.description] - description of the survey
 * @param {Number} [req.body.state] - new state (0 : closed - 1 : opened)
 * @param {Express.Response} res - variable to send the response
 */
function createSurvey(req, res) {
    if (req.session.level == User.Level.Guest) {
        Response(res, "Error : Not logged", null, 0);
        return;
    } else if (req.session.level < User.Level.OldMember) {
        Response(res, "Error : You're not a member", null, 0);
        return;
    }

    var survey = new Survey();
    var surveyNameFound = false;

    // Check variables in req.body
    if (!('name' in req.body)) {
        Response(res, "Error : No name given", null, 0);
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
            }, function (err, s) {
                if (err || s == null) surveyNameFound = false;
                else surveyNameFound = true;
                callback();
            });
    }], function () {
        if (surveyNameFound)
            Response(res, "Error : Survey's name already exists", null, 0);
        else
            survey.save(function (err) {
                if (err) Response(res, "Error", err, 0);
                else Response(res, "Survey created", survey, 1);
            });
    });
}

/**
 * Get all surveys<br>
 * <b>Level needed :</b> Guest
 * @memberof Survey
 * @param {Express.Request} req - request send
 * @param {Express.Response} res - variable to send the response
 */
function getSurveys(req, res) {
    Survey.find(function (err, surveys) {
        if (err) Response(res, "Error", err, 0);
        else Response(res, "Surveys found", surveys, 1);
    });
}

/**
 * Get a specific survey<br>
 * <b>Level needed :</b> Guest
 * @memberof Survey
 * @param {Express.Request} req - request send
 * @param {ObjectID} req.params.survey_id - ID of survey
 * @param {Express.Response} res - variable to send the response
 */
function getSurvey(req, res) {
    Survey.findById(req.params.survey_id, function (err, survey) {
        if (err)
            Response(res, "Error", err, 0);
        else if (survey == null)
            Response(res, "Error : Survey not found", null, 0);
        else
            Response(res, "Survey found", survey, 1);
    });
}

/**
 * Edit a survey<br>
 * <b>Level needed :</b> Owner | Admin
 * @memberof Survey
 * @param {Express.Request} req - request send
 * @param {String} [req.body.description] - new description
 * @param {String} [req.body.name] - new name
 * @param {Number} [req.body.state] - new state (0 : closed - 1 : opened)
 * @param {ObjectID} req.params.survey_id - ID of survey
 * @param {Express.Response} res - variable to send the response
 */
function editSurvey(req, res) {
    if (req.session.level == User.Level.Guest) {
        Response(res, "Error : Not logged", null, 0);
        return;
    }

    Survey.findById(req.params.survey_id, function (err, survey) {
        if (err) {
            Response(res, "Error", err, 0);
            return;
        } else if (survey == null) {
            Response(res, "Error : Survey not found", null, 0);
            return;
        } else if ((survey.author != req.session.userId) && (req.session.level < User.Level.Admin)) {
            Response(res, "Error : You're not an admin", null, 0);
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

        survey.save(function (err) {
            if (err) Response(res, "Error", err, 0);
            else Response(res, "Survey updated", survey, 1);
        });
    });
}

/**
 * Delete a survey<br>
 * <b>Level needed :</b> Owner | Admin
 * @memberof Survey
 * @param {Express.Request} req - request send
 * @param {ObjectID} req.params.survey_id - ID of survey
 * @param {Express.Response} res - variable to send the response
 */
function deleteSurvey(req, res) {
    if (req.session.level == User.Level.Guest) {
        Response(res, "Error : Not logged", null, 0);
        return;
    }

    Survey.findById(req.params.survey_id, function (err, survey) {
        if (err) {
            Response(res, "Error", err, 0);
            return;
        } else if (survey == null) {
            Response(res, "Error : Survey not found", null, 0);
            return;
        } else if ((survey.author != req.session.userId) && (req.session.level < User.Level.Admin)) {
            Response(res, "Error : You're not an admin", null, 0);
            return;
        }

        Survey.remove({
            _id: req.params.survey_id
        }, function (err, survey) {
            if (err) Response(res, "Error", err, 0);
            else Response(res, "Survey deleted", survey, 1);
        });
    });

}