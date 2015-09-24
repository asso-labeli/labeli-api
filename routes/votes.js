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

var isMongooseId = require('mongoose').Types.ObjectId.isValid;

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
 * <b>Level needed :</b> Member<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-1</td><td>Not logged</td></tr>
 * <tr><td>-3</td><td>Access denied (not at least a member)</td></tr>
 * <tr><td>-11</td><td>Missing value</td></tr>
 * <tr><td>-22</td><td>Project not found</td></tr>
 * <tr><td>-29</td><td>MongoDB error during save()</td></tr>
 * </table>
 * @memberof Vote
 * @param {Express.Request} req - request send
 * @param {Number} req.body.value - value of the vote
 * @param {ObjectId} req.params.project_id - id of the project
 * @param {Express.Response} res - variable to send the response
 */
function createOrEditVote(req, res) {
  if (req.session.level == User.Level.Guest) {
    Response.notLogged(res);
    return;
  }
  else if (req.session.level < User.Level.Member) {
    Response.notMember(res);
    return;
  }

  // Check variables in body
  if (!("value" in req.body)) {
    Response.missing(res, 'value', -11);
    return;
  }

  var vote = new Vote();
  var projectFound = true;

  vote.author = req.session.userId;
  vote.value = req.body.value;

  async.parallel([
    // Check if project exist
    function searchProject(callback) {
      Project.findById(req.params.project_id, function(err, project) {
        if (err || project == null) projectFound = false;
        else vote.project = project._id;
        callback();
      });
    }
  ], function useResult() {
    if (!projectFound) Response.notFound(res, 'project');
    else {
      // Check if there's already a vote
      Vote.findOne({
          author: vote.author,
          project: vote.project
        },
        function afterVoteSearch(err, v) {
          // No vote found -> Creation of new vote
          if (err || v == null) {
            vote.value = req.body.value;
            vote.save(function afterVoteSave(err) {
              if (err) Response.saveError(res, err);
              else Response.success(res, "Vote created", vote);
            });
          }
          else { // Vote already exists -> Modify and save it
            v.value = vote.value;
            v.lastEdited = Date.now();
            v.save(function afterVoteSave(err) {
              if (err) Response.saveError(res, err);
              else Response.success(res, "Vote updated", v);
            });
          }
        });
    }
  });

}

/**
 * Get all votes of a project<br>
 * <b>Level needed :</b> Admin<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-1</td><td>Not logged</td></tr>
 * <tr><td>-2</td><td>Not admin</td></tr>
 * <tr><td>-22</td><td>No votes found</td></tr>
 * <tr><td>-27</td><td>MangoDB error during find()</td></tr>
 * </table>
 * @memberof Vote
 * @param {Express.Request} req - request send
 * @param {ObjectId} req.params.project_id - id of the project
 * @param {Express.Response} res - variable to send the response
 */
function getVotes(req, res) {
  if (req.session.level == User.Level.Guest) {
    Response.notLogged(res);
    return;
  }
  else if (req.session.level < User.Level.Admin) {
    Response.notAdmin(res);
    return;
  }

  Vote.find({
    project: req.params.project_id
  }, function afterVoteSearch(err, votes) {
    if (err) Response.findError(res, err);
    else if (typeof votes === 'undefined' ||  votes.length == 0)
      Response.notFound(res, 'vote');
    else Response.success(res, "Votes found", votes);
  });
}

/**
 * Get a specific vote<br>
 * <b>Level needed :</b> Admin<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-1</td><td>Not logged</td></tr>
 * <tr><td>-2</td><td>Not admin</td></tr>
 * <tr><td>-22</td><td>No vote found</td></tr>
 * <tr><td>-27</td><td>MangoDB error during find()</td></tr>
 * </table>
 * @memberof Vote
 * @param {Express.Request} req - request send
 * @param {ObjectId} req.params.vote_id - id of the vote
 * @param {Express.Response} res - variable to send the response
 */
function getVote(req, res) {
  if (req.session.level == User.Level.Guest) {
    Response.notLogged(res);
    return;
  }
  else if (req.session.level < User.Level.Admin) {
    Response.notAdmin(res);
    return;
  }

  Vote.findById(req.params.vote_id, function afterVoteSearch(err, vote) {
    if (err) Response.findError(res, err);
    else if (vote == null) Response.notFound(res, 'vote');
    else Response.success(res, "Vote found", vote);
  });
}

/**
 * Get vote of logged client on a project<br>
 * <b>Level needed :</b> Member<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-1</td><td>Not logged</td></tr>
 * <tr><td>-3</td><td>Not at least a member</td></tr>
 * <tr><td>-22</td><td>No vote found</td></tr>
 * <tr><td>-27</td><td>MangoDB error during find()</td></tr>
 * </table>
 * @memberof Vote
 * @param {Express.Request} req - request send
 * @param {ObjectId} req.params.project_id - id of the project
 * @param {Express.Response} res - variable to send the response
 */
function getSessionVote(req, res) {
  if (req.session.level == User.Level.Guest) {
    Response.notLogged(res);
    return;
  }
  else if (req.session.level < User.Level.Member) {
    Response.notMember(res);
    return;
  }

  // Search vote of logged client
  Vote.findOne({
      author: req.session.userId,
      project: req.params.project_id
    },
    function afterVoteSearch(err, vote) {
      if (err) Response.findError(res, err);
      else if (vote == null) Response.notFound(res, 'vote');
      else Response.success(res, "Vote found", vote);
    });
}

/**
 * Delete a specific vote<br>
 * <b>Level needed :</b> Admin<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-1</td><td>Not logged</td></tr>
 * <tr><td>-2</td><td>Not admin</td></tr>
 * <tr><td>-28</td><td>MangoDB error during remove()</td></tr>
 * </table>
 * @memberof Vote
 * @param {Express.Request} req - request send
 * @param {ObjectId} req.params.vote_id - id of the vote to delete
 * @param {Express.Response} res - variable to send the response
 */
function deleteVote(req, res) {
  if (req.session.level == User.Level.Guest) {
    Response.notLogged(res);
    return;
  }
  else if (req.session.level < User.Level.Admin) {
    Response.notAdmin(res);
    return;
  }

  Vote.remove({
    _id: req.params.vote_id
  }, function afterVoteRemove(err, vote) {
    if (err) Response.removeError(res, err);
    else Response.success(res, 'Vote deleted', vote);
  });
}

/**
 * Delete vote of logged client on a project<br>
 * <b>Level needed :</b> Member<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-1</td><td>Not logged</td></tr>
 * <tr><td>-3</td><td>Not at least a member</td></tr>
 * <tr><td>-27</td><td>MangoDB error during find()</td></tr>
 * <tr><td>-28</td><td>MangoDB error during remove()</td></tr>
 * </table>
 * @memberof Vote
 * @param {Express.Request} req - request send
 * @param {ObjectId} req.params.project_id - id of the project
 * @param {Express.Response} res - variable to send the response
 */function deleteSessionVote(req, res) {
  if (req.session.level == User.Level.Guest) {
    Response.notLogged(res);
    return;
  }

  // Search vote of logged client
  Vote.findOne({
      author: req.session.userId,
      project: req.params.project_id
    },
    function afterSearchVote(err, vote) {
      if (err) Response.findError(res, err);
      else if (vote == null) Response.notFound(res, 'vote');
      else Vote.remove({
        _id: vote._id
      }, function afterRemoveVote(err, vote) {
        if (err) Response.saveError(res, err);
        else Response.success(res, 'Vote deleted', vote);
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
    function(err, votes) {
      if (err) Response(res, "Error", err, 0);
      // If not found, send a empty data array
      else if (votes == null || votes == []) Response(res, "Error : Votes not found", {
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
