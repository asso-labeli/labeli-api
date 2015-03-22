/**
 * <table><tr>
 * <td>POST /messages/:project_id</td><td>{@link Message.createMessage}</td></tr>
 * <td>GET /messages/:project_id</td><td>{@link Message.getMessages}</td></tr>
 * <td>GET /messages/:message_id</td><td>{@link Message.getMessage}</td></tr>
 * <td>PUT /messages/:message_id</td><td>{@link Message.editMessage}</td></tr>
 * <td>DELETE /messages/:message_id</td><td>{@link Message.deleteMessage}</td></tr>
 * </table>
 * @namespace Message
 * @author Florian Kauder
 */

var Project = require('../models/project');
var User = require('../models/user');
var Message = require('../models/message');
var Response = require('../modules/response');

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
 * Create a new message
 * @memberof Message
 * @param {Express.Request} req - request send
 * @param {String} req.body.content - content of message
 * @param {String} req.body.authorUsername - username of author
 * @param {ObjectID} req.params.project_id - id of project
 * @param {Express.Response} res - variable to send the response
 */
function createMessage(req, res) {
    var message = new Message();

    var projectFound = true;
    var userFound = true;

    // Check if variables are send
    if (!("content" in req.body)) {
        Response(res, "Error : No content given", null, 0);
        return;
    } else if (!("authorUsername" in req.body)) {
        Response(res, "Error : No authorUsername given", null, 0);
        return;
    }

    // Setting message fields
    message.content = req.body.content;

    calls.push(function getProject(callback) {
        Project.findById(req.params.project_id, function (err, project) {
            if (err || project == null) projectFound = false;
            else message.project = project._id;
            callback();
        });
    });

    calls.push(function getUserWithUsername(callback) {
        User.findOne({
                username: req.body.authorUsername.toLowerCase()
            },
            function (err, user) {
                if (err || user == null) userFound = false;
                else message.author = user._id;
                callback();
            });
    });

    // Wait response, and send result
    async.parallel(calls, function () {
        if (!projectFound) Response(res, "Error : Project not found", null, 0);
        else if (!userFound) Response(res, "Error : User not found", null, 0);
        else {
            message.save(function (err) {
                if (err)
                    Response(res, "Error", err, 0);
                else Response(res, 'Message created', message, 1);
            });
        }
    });
}


/**
 * Get all messages from a project
 * @memberof Message
 * @param {Express.Request} req - request send
 * @param {ObjectID} req.params.project_id - id of project
 * @param {Express.Response} res - variable to send the response
 */
function getMessages(req, res) {
    Message.find({
        thread: req.params.project_id
    }, function (err, messages) {
        if (err) Response(res, "Error", err, 0);
        else Response(res, "Messages found", messages, 1);
    });
}

/**
 * Get a specific message
 * @memberof Message
 * @param {Express.Request} req - request send
 * @param {ObjectID} req.params.message_id - id of message
 * @param {Express.Response} res - variable to send the response
 */
function getMessage(req, res) {
    Message.findById(req.params.message_id, function (err, message) {
        if (err) Response(res, "Error", err, 0);
        else if (message == null)
            Response(res, "Error : Message not found", message, 0);
        else Response(res, "Message found", message, 1);
    });
}

/**
 * Edit a message
 * @memberof Message
 * @param {Express.Request} req - request send
 * @param {ObjectID} req.params.message_id - id of message
 * @param {String} [req.body.content] - new content
 * @param {Express.Response} res - variable to send the response
 */
function editMessage(req, res) {
    Message.findById(req.params.message_id, function (err, message) {
        if (err) {
            Response(res, "Error", err, 0);
            return;
        }
        
        // Edit content if exists in request
        if ("content" in req.body) message.content = req.body.content;
        // Edit the lastEdited time
        message.lastEdited = Date.now();

        message.save(function (err) {
            if (err) Response(res, "Error", err, 0);
            else Response(res, 'Message edited', message, 1);
        });

    });
}

/**
 * Delete a message
 * @memberof Message
 * @param {Express.Request} req - request send
 * @param {ObjectID} req.params.message_id - id of message
 * @param {Express.Response} res - variable to send the response
 */
function deleteMessage(req, res) {
    Message.remove({
        _id: req.params.message_id
    }, function (err, obj) {
        if (err) Response(res, "Error", err, 0);
        else Response(res, 'Message deleted', obj, 1);
    });
}