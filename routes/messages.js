/**
 * <h2>Model</h2>
 * <table>
 * <tr><td><b>Name</b></td><td><b>Type</b></td><td><b>Default Value</b></td></tr>
 * <tr><td>content</td><td>String</td></tr>
 * <tr><td>created</td><td>Date</td><td>Date.now</td></tr>
 * <tr><td>lastEdited</td><td>Date</td><td>Date.now</td></tr>
 * <tr><td>project</td><td>ObjectId</td></tr>
 * <tr><td>author</td><td>ObjectId</td></tr>
 * </table><br>
 * <h2>Routing Table</h2>
 * <table>
 * <tr><td>POST /messages/:project_id</td><td>{@link Message.createMessage}</td></tr>
 * <tr><td>GET /messages/:project_id</td><td>{@link Message.getMessages}</td></tr>
 * <tr><td>GET /messages/:message_id</td><td>{@link Message.getMessage}</td></tr>
 * <tr><td>PUT /messages/:message_id</td><td>{@link Message.editMessage}</td></tr>
 * <tr><td>DELETE /messages/:message_id</td><td>{@link Message.deleteMessage}</td></tr>
 * </table><br>
 * @namespace Message
 * @author Florian Kauder
 */

var Project = require('../models/project');
var User = require('../models/user');
var Message = require('../models/message');
var Response = require('../modules/response');
var Log = require('../modules/log');

var isMongooseId = require('mongoose').Types.ObjectId.isValid;

var express = require('express');
var async = require('async');
var calls = [];

var router = express.Router();

router.route('/messages/:project_id').post(createMessage);
router.route('/messages/:project_id').get(getMessages);
router.route('/message/:message_id').get(getMessage);
router.route('/message/:message_id').put(editMessage);
router.route('/message/:message_id').delete(deleteMessage);

module.exports = router;

/**
 * Create a new message<br>
 * <b>Level needed :</b> Member<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-1</td><td>Not logged</td></tr>
 * <tr><td>-3</td><td>Not at least a member</td></tr>
 * <tr><td>-11</td><td>Missing content</td></tr>
 * <tr><td>-22</td><td>Project not found</td></tr>
 * <tr><td>-29</td><td>MangoDB error during save()</td></tr>
 * <tr><td>-31</td><td>ID not valid</td></tr>
 * </table>
 * @memberof Message
 * @param {Express.Request} req - request send
 * @param {String} req.body.content - content of message
 * @param {String} req.body.authorUsername - username of author
 * @param {ObjectID} req.params.project_id - id of project
 * @param {Express.Response} res - variable to send the response
 */
function createMessage(req, res) {
  if (req.session.userId == undefined) {
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
  // Check if variables are send
  else if (!("content" in req.body)) {
    Response.missing(res, 'content', -11);
    return;
  }

  var message = new Message();

  var projectFound = true;

  // Setting message fields
  message.content = req.body.content;
  message.author = req.session.userId;

  calls.push(function checkProject(callback) {
    Project.findById(req.params.project_id, function useResult(err, project) {
      if (err || project == null) projectFound = false;
      else message.project = project._id;
      callback();
    });
  });

  // Wait response, and send result
  async.parallel(calls, function useProjectFound() {
    if (!projectFound) Response.notFound(res, 'project');
    else {
      message.save(function useResult(err) {
        if (err)
          Response.saveError(res, err);
        else {
          Response.success(res, 'Message created', message);
          Log.i("Message \"" + message.content + "\"(" + message._id +
            ") created by user " + req.session.userId);
        }
      });
    }
  });
}

/**
 * Get all messages from a project<br>
 * <b>Level needed :</b> Guest<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-22</td><td>No project found</td></tr>
 * <tr><td>-27</td><td>MongoDB error during find()</td></tr>
 * <tr><td>-31</td><td>ID not valid</td></tr>
 * </table>
 * @memberof Message
 * @param {Express.Request} req - request send
 * @param {ObjectID} req.params.project_id - id of project
 * @param {Express.Response} res - variable to send the response
 */
function getMessages(req, res) {
  if (!isMongooseId(req.params.project_id))
    Response.invalidID(res);
  else
    Message.find({
      project: req.params.project_id
    }, function useResult(err, messages) {
      if (err) Response.findError(res, err);
      else if (typeof messages === null ||  messages.length == 0)
        Response.notFound(res, 'message');
      else Response.success(res, "Messages found", messages);
    });
}

/**
 * Get a specific message<br>
 * <b>Level needed :</b> Guest<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-22</td><td>No project found</td></tr>
 * <tr><td>-27</td><td>MongoDB error during find()</td></tr>
 * <tr><td>-31</td><td>ID not valid</td></tr>
 * </table>
 * @memberof Message
 * @param {Express.Request} req - request send
 * @param {ObjectID} req.params.message_id - id of message
 * @param {Express.Response} res - variable to send the response
 */
function getMessage(req, res) {
  if (!isMongooseId(req.params.message_id))
    Response.invalidID(res);
  else
    Message.findById(req.params.message_id, function useResult(err, message) {
      if (err) Response.findError(res, err);
      else if (message == null)
        Response.notFound(res, message);
      else Response.success(res, "Message found", message);
    });
}

/**
 * Edit a message<br>
 * <b>Level needed :</b> Owner | Admin<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-1</td><td>Not logged</td></tr>
 * <tr><td>-4</td><td>Not the owner</td></tr>
 * <tr><td>-22</td><td>Message not found</td></tr>
 * <tr><td>-27</td><td>MangoDB error during find()</td></tr>
 * <tr><td>-29</td><td>MangoDB error during save()</td></tr>
 * <tr><td>-31</td><td>ID not valid</td></tr>
 * </table>
 * @memberof Message
 * @param {Express.Request} req - request send
 * @param {ObjectID} req.params.message_id - id of message
 * @param {String} [req.body.content] - new content
 * @param {Express.Response} res - variable to send the response
 */
function editMessage(req, res) {
  if (req.session.level < User.Level.OldMember)
    Response.notLogged(res);
  else if (!isMongooseId(req.params.message_id))
    Response.invalidID(res);
  else
    Message.findById(req.params.message_id, function(err, message) {
      if (err) {
        Response.findError(res, err);
        return;
      }
      else if (message == null) {
        Response.notFound(res, 'message');
        return;
      }
      else if ((message.author != req.session.userId) && (req.session.level < 3)) {
        Response.notAdmin(res);
        return;
      }

      // Edit content if exists in request
      if ("content" in req.body) message.content = req.body.content;
      // Edit the lastEdited time
      message.lastEdited = Date.now();

      message.save(function useResult(err) {
        if (err) Response.saveError(res, err);
        else {
          Response.success(res, 'Message edited', message);
          Log.i("Message \"" + message.content + "\"(" + message._id +
            ") edited by user " + req.session.userId);
        }
      });
    });
}

/**
 * Delete a message<br>
 * <b>Level needed :</b> Owner | Admin<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-1</td><td>Not logged</td></tr>
 * <tr><td>-4</td><td>Not the owner</td></tr>
 * <tr><td>-21</td><td>Message not found</td></tr>
 * <tr><td>-27</td><td>MangoDB error during find()</td></tr>
 * <tr><td>-28</td><td>MangoDB error during remove()</td></tr>
 * </table>
 * @memberof Message
 * @param {Express.Request} req - request send
 * @param {ObjectID} req.params.message_id - id of message
 * @param {Express.Response} res - variable to send the response
 */
function deleteMessage(req, res) {
  if (req.session.level < User.Level.OldMember)
    Response.notLogged(res);
  else
    Message.findById(req.params.message_id, function useResult(err, message) {
      if (err) {
        Response.findError(res, err);
        return;
      }
      else if (message == null) {
        Response.notFound(res, 'message');
        return;
      }
      else if ((message.author != req.session.userId) && (req.session.level < 3)) {
        Response.notOwner(res);
        return;
      }

      Message.remove({
        _id: req.params.message_id
      }, function useResult(err, obj) {
        if (err) Response.removeError(res, err);
        else {
          Response.success(res, 'Message deleted', obj);
          Log.i("Message \"" + message.content + "\"(" + message._id +
            ") deleted by user " + req.session.userId);
        }
      });
    });
}
