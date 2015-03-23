/**
 * {@link Vote.getVotes}, {@link Vote.getVote} and {@link Vote.deleteVote} need admin rights to protect anonymity of votes.<br>
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
 * <tr><td>DELETE /vote/:vote_id</td><td>{@link Vote.deleteVote}</td></tr>
 * <tr><td>GET /voteForProject/:project_id</td><td>{@link Vote.getSessionVote}</td></tr>
 * <tr><td>DELETE /voteForProject/:project_id</td><td>{@link Vote.deleteSessionVote}</td></tr>
 * <tr><td>GET /voteResult/:project_id</td><td>{@link Vote.getVoteResult}</td></tr>
 * </table><br></table><br>
 * <h2>Constants</h2>
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
router.route('/voteForProject/:project_id').get(getSessionVote);
router.route('/voteForProject/:project_id').delete(deleteSessionVote);
router.route('/voteResult/:project_id').get(getVoteResult);

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
    if (req.session.level == User.Level.Guest) {
        Response(res, "Error : Not logged", null, 0);
        return;
    }

    // Check variables in body
    if (!("value" in req.body)) {
        Response(res, "Error : No value given", null, 0);
        return;
    }

    var vote = new Vote();
    var projectFound = true;

    vote.author = req.session.userId;
    vote.value = req.body.value;

    async.parallel([
        // Check if project exist
        function searchProject(callback) {
            Project.findById(req.params.project_id, function (err, project) {
                if (err || project == null) projectFound = false;
                else vote.project = project._id;
                callback();
            });
    }], function useResult() {
        if (!projectFound) {
            Response(res, "Error : Project not found", null, 0);
            return;
        } else {
            // Check if there's already a vote
            Vote.findOne({
                    author: vote.author,
                    project: vote.project
                },
                function (err, v) {
                    // No vote found -> Creation of new vote
                    if (err || v == null) {
                        vote.value = req.body.value;
                        vote.save(function (err) {
                            if (err) Response(res, "Error", err, 0);
                            else Response(res, "Vote created", vote, 1);
                        });
                    } else { // Vote already exists -> Modify and save it
                        v.value = vote.value;
                        v.lastEdited = Date.now();
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
 * <b>Level needed :</b> Admin
 * @memberof Vote
 * @param {Express.Request} req - request send
 * @param {ObjectId} req.params.project_id - id of the project
 * @param {Express.Response} res - variable to send the response
 */
function getVotes(req, res) {
    if (req.session.level == User.Level.Guest) {
        Response(res, "Error : Not logged", null, 0);
        return;
    } else if (req.session.level < User.Level.Admin) {
        Response(res, "Error : You're not an admin", null, 0);
        return;
    }

    Vote.find({
        project: req.params.project_id
    }, function (err, votes) {
        if (err) Response(res, "Error", err, 0);
        else if (votes == null)
            Response(res, "Error : No votes found", null, 0);
        else Response(res, "Votes found", votes, 1);
    });
}

/**
 * Get a specific vote<br>
 * <b>Level needed :</b> Admin
 * @memberof Vote
 * @param {Express.Request} req - request send
 * @param {ObjectId} req.params.vote_id - id of the vote
 * @param {Express.Response} res - variable to send the response
 */
function getVote(req, res) {
    if (req.session.level == User.Level.Guest) {
        Response(res, "Error : Not logged", null, 0);
        return;
    } else if (req.session.level < User.Level.Admin) {
        Response(res, "Error : You're not an admin", null, 0);
        return;
    }

    Vote.findById(req.params.vote_id, function (err, vote) {
        if (err) Response(res, "Error", err, 0);
        else if (vote == null) Response(res, "Error : Vote not found", null, 0);
        else Response(res, "Vote found", vote, 1);
    });
}

/**
 * Get vote of logged client on a project<br>
 * <b>Level needed :</b> Member
 * @memberof Vote
 * @param {Express.Request} req - request send
 * @param {ObjectId} req.params.project_id - id of the project
 * @param {Express.Response} res - variable to send the response
 */
function getSessionVote(req, res) {
    if (req.session.level == User.Level.Guest) {
        Response(res, "Error : Not logged", null, 0);
        return;
    }

    // Search vote of logged client
    Vote.findOne({
            author: req.session.userId,
            project: req.params.project_id
        },
        function (err, vote) {
            if (err) Response(res, "Error", err, 0);
            else if (vote == null) Response(res, "Error : Vote not found", null, 0);
            else Response(res, "Vote found", vote, 1);
        });
}

/**
 * Delete a specific vote<br>
 * <b>Level needed :</b> Admin
 * @memberof Vote
 * @param {Express.Request} req - request send
 * @param {ObjectId} req.params.vote_id - id of the vote to delete
 * @param {Express.Response} res - variable to send the response
 */
function deleteVote(req, res) {
    if (req.session.level == User.Level.Guest) {
        Response(res, "Error : Not logged", null, 0);
        return;
    } else if (req.session.level < User.Level.Admin) {
        Response(res, "Error : You're not an admin", null, 0);
        return;
    }

    Vote.remove({
        _id: req.params.vote_id
    }, function (err, vote) {
        if (err) Response(res, "Error", err, 0);
        else Response(res, 'Vote deleted', vote, 1);
    });
}

/**
 * Delete vote of logged client on a project<br>
 * <b>Level needed :</b> Member
 * @memberof Vote
 * @param {Express.Request} req - request send
 * @param {ObjectId} req.params.project_id - id of the project
 * @param {Express.Response} res - variable to send the response
 */
function deleteSessionVote(req, res) {
    if (req.session.level == User.Level.Guest) {
        Response(res, "Error : Not logged", null, 0);
        return;
    }

    // Search vote of logged client
    Vote.findOne({
            author: req.session.userId,
            project: req.params.project_id
        },
        function (err, vote) {
            if (err) Response(res, "Error", err, 0);
            else if (vote == null) Response(res, "Error : Vote not found", null, 0);
            else Vote.remove({
                _id: vote._id
            }, function (err, vote) {
                if (err) Response(res, "Error", err, 0);
                else Response(res, 'Vote deleted', vote, 1);
            });
        });


}

/**
 * Get result votes for a specific project<br>
 * Result is an associative array with :<br>
 * - data.negative for number of negative votes<br>
 * - data.neutral for number of neutral votes<br>
 * - data.positive for number of positive votes<br>
 * - data.total for total score<br>
 * <b>Level needed :</b> Member
 * @memberof Vote
 * @param {Express.Request} req - request send
 * @param {ObjectId} req.params.project_id - id of the project
 * @param {Express.Response} res - variable to send the response
 */
function getVoteResult(req, res) {
    if (req.session.level == User.Level.Guest) {
        Response(res, "Error : Not logged", null, 0);
        return;
    }

    // Search all votes for this project
    Vote.find({
            project: req.params.project_id
        },
        function (err, votes) {
            if (err) Response(res, "Error", err, 0);
            // If not found, send a empty data array
            else if (votes == null) Response(res, "Error : Votes not found", {
                negative: 0,
                neutral: 0,
                positive: 0,
                total: 0
            }, 0);
            else {
                var data = {
                    negative: 0,
                    neutral: 0,
                    positive: 0,
                    total: 0
                };
                
                // Interpret each vote found to create data array
                for (var i = 0; i < votes.length; i++) {
                    switch (votes[i].value) {
                    case -1:
                        data.negative++;
                        data.total--;
                        break;
                    case 0:
                        data.neutral++;
                        break;
                    case 1:
                        data.positive++;
                        data.total++;
                        break;
                    }
                }

                // Send data array
                Response(res, "Votes found", data, 1);
            }
        });
}