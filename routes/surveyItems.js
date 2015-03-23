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

/**
 * Get all surveyItems of a survey<br>
 * <b>Level needed :</b> Guest
 * @memberof SurveyItem
 * @param {Express.Request} req - request send
 * @param {ObjectId} req.params.survey_id - ID of survey
 * @param {Express.Response} res - variable to send the response
 */
function getSurveyItems(req, res){
    SurveyItem.find({survey : req.params.survey_id}, function(err, sis){
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
function getSurveyItem(req, res){
    SurveyItem.findById(req.params.surveyItem_id, function(err, si){
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

/**
 * Delete a surveyItem<br>
 * <b>Level needed :</b> Owner | Admin
 * @memberof SurveyItem
 * @param {Express.Request} req - request send
 * @param {ObjectId} req.params.surveyItem_id - ID of surveyItem
 * @param {Express.Response} res - variable to send the response
 */
function deleteSurveyItem(req, res){
    SurveyItem.remove({_id : req.params.surveyItem_id}, function(err, si){
        if (err) Response(res, "Error", err, 0);
        else Response(res, "SurveyItem deleted", si, 1);
    });
}
