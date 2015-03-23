/**
 * <h2>Model</h2>
 * <table>
 * <tr><td><b>Name</b></td><td><b>Type</b></td><td><b>Default Value</b></td></tr>
 * <tr><td>value</td><td>Number</td></tr>
 * <tr><td>created</td><td>Date</td><td>Date.now</td></tr>
 * <tr><td>lastEdited</td><td>Date</td><td>Date.now</td></tr>
 * <tr><td>project</td><td>ObjectId</td></tr>
 * <tr><td>author</td><td>ObjectId</td></tr>
 * </table><br>
 * <h2>Routing Table</h2>
 * <table>
 * <tr><td>POST /votes/:project_id</td><td>{@link Vote.createOrEditVote}</td></tr>
 * <tr><td>GET /votes/:project_id</td><td>{@link Vote.getVotes}</td></tr>
 * <tr><td>GET /vote/:vote_id</td><td>{@link Vote.getVote}</td></tr>
 * <tr><td>DELETE /vote/:vote_id</td><td>{@link Vote.deleteVote}</td></tr></table><br></table><br>
 * <h2>Constants</h2>
 * <h5>Project.Type</h5>
 * <table>
 * <tr><td>Project</td><td>0</td></tr>
 * <tr><td>Event</td><td>1</td></tr>
 * <tr><td>Team</td><td>2</td></tr></table>
 * <h5>Vote.Value</h5>
 * <table>
 * <tr><td>Negative</td><td>-1</td></tr>
 * <tr><td>Neutral</td><td>0</td></tr>
 * <tr><td>Positive</td><td>1</td></tr></table>
 * @namespace Vote
 * @author Florian Kauder
 */

var Project = require('../models/project');
var User = require('../models/user');
var Vote = require('../models/vote');
var Response = require('../modules/response');

var express = require('express');
var async = require('async');
var calls = [];

var router = express.Router();

router.route('/votes/:project_id').post(createOrEditVote);
router.route('/votes/:project_id').get(getVotes);
router.route('/vote/:vote_id').get(getVote);
router.route('/vote/:vote_id').delete(deleteVote);

module.exports = router;

/**
 * Create or edit a vote on project<br>
 * <b>Level needed :</b> Member
 * @memberof Vote
 * @param {Express.Request} req - request send
 * @param {Number} req.body.value - value of the vote
 * @param {ObjectId} req.params.project_id - id of the project
 * @param {Express.Response} res - variable to send the response
 */
function createOrEditVote(req, res) {
    var vote = new Vote();

    var userFound = true;
    var projectFound = true;

    if (!("value" in req.body)) {
        Response(res, "Error : No value given", null, 0);
        return;
    } else
        vote.value = req.body.value;

    if (!("authorUsername" in req.body)) {
        Response(res, "Error : No authorUsername given", null, 0);
        return;
    } else {
        calls.push(function (callback) {
            User.findOne({
                    username: req.body.authorUsername.toLowerCase()
                },
                function (err, user) {
                    if (err || user == null) userFound = false;
                    else vote.author = user._id;
                    callback();
                });
        });
    }

    calls.push(function (callback) {
        Project.findById(req.params.project_id, function (err, project) {
            if (err || project == null) projectFound = false;
            else vote.project = project._id;
            callback();
        });
    });

    async.parallel(calls, function () {
        if (!projectFound) {
            Response(res, "Error : Project not found", null, 0);
            return;
        } else if (!userFound) {
            Response(res, "Error : User not found", null, 0);
            return;
        } else {
            Vote.findOne({
                    author: vote.author,
                    project: vote.project
                },
                function (err, v) {
                    if (err || v == null) {
                        vote.save(function (err) {
                            if (err) Response(res, "Error", err, 0);
                            else Response(res, "Vote created", vote, 1);
                        });
                    } else { // Vote already exists
                        v.value = vote.value;
                        v.save(function (err) {
                            if (err) Response(res, "Error", err, 0);
                            else Response(res, "Vote updated", v, 1);
                        });
                    }
                });
        }
    });

}

/**
 * Get all votes of a project<br>
 * <b>Level needed :</b> Member
 * @memberof Vote
 * @param {Express.Request} req - request send
 * @param {ObjectId} req.params.project_id - id of the project
 * @param {Express.Response} res - variable to send the response
 */
function getVotes(req, res) {
    Vote.find({
        project: req.params.project_id
    }, function (err, votes) {
        if (err) Response(res, "Error", err, 0);
        else Response(res, "Votes found", votes, 1);
    });
}

/**
 * Get a specific vote<br>
 * <b>Level needed :</b> Member
 * @memberof Vote
 * @param {Express.Request} req - request send
 * @param {ObjectId} req.params.vote_id - id of the vote
 * @param {Express.Response} res - variable to send the response
 */
function getVote(req, res) {
    Vote.findById(req.params.vote_id, function (err, vote) {
        if (err) Response(res, "Error", err, 0);
        else if (vote == null) Response(res, "Error : Vote not found", null, 0);
        else Response(res, "Vote found", vote, 1);
    });
}

/**
 * Delete a specific vote<br>
 * <b>Level needed :</b> Owner
 * @memberof Vote
 * @param {Express.Request} req - request send
 * @param {ObjectId} req.params.vote_id - id of the vote to delete
 * @param {Express.Response} res - variable to send the response
 */
function deleteVote(req, res) {
    Vote.remove({
        _id: req.params.vote_id
    }, function (err, vote) {
        if (err) Response(res, "Error", err, 0);
        else Response(res, 'Vote deleted', vote, 1);
    });
}