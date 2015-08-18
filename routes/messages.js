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
 * <b>Level needed :</b> Member
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

    // Check if variables are send
    if (!("content" in req.body)) {
        Response(res, "Error : No content given", null, 0);
        return;
    } else if (req.session.userId == undefined) {
        Response(res, "Error : Not logged", null, 0);
        return;
    } else if (req.session.level < 1) {
        Response(res, "Error : You don't have rights to create message", null, 0);
        return;
    }

    // Setting message fields
    message.content = req.body.content;
    message.author = req.session.userId;

    calls.push(function checkProject(callback) {
        Project.findById(req.params.project_id, function (err, project) {
            if (err || project == null) projectFound = false;
            else message.project = project._id;
            callback();
        });
    });

    // Wait response, and send result
    async.parallel(calls, function () {
        if (!projectFound) Response(res, "Error : Project not found", null, 0);
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
 * Get all messages from a project<br>
 * <b>Level needed :</b> Guest
 * @memberof Message
 * @param {Express.Request} req - request send
 * @param {ObjectID} req.params.project_id - id of project
 * @param {Express.Response} res - variable to send the response
 */
function getMessages(req, res) {
    Message.find({
        project: req.params.project_id
    }, function (err, messages) {
        if (err) Response(res, "Error", err, 0);
        else if (messages == null)
            Response(res, "Error : No messages found", messages, 0);
        else Response(res, "Messages found", messages, 1);
    });
}

/**
 * Get a specific message<br>
 * <b>Level needed :</b> Guest
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
 * Edit a message<br>
 * <b>Level needed :</b> Owner | Admin
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
        } else if (message == null) {
            Response(res, "Error : Message not found", message, 0);
            return;
        } else if ((message.author != req.session.userId) && (req.session.level < 3)) {
            Response(res, "Error : You're not the owner of this message", null, 0);
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
 * Delete a message<br>
 * <b>Level needed :</b> Owner | Admin
 * @memberof Message
 * @param {Express.Request} req - request send
 * @param {ObjectID} req.params.message_id - id of message
 * @param {Express.Response} res - variable to send the response
 */
function deleteMessage(req, res) {
    Message.findById(req.params.message_id, function (err, message) {
        if (err) {
            Response(res, "Error", err, 0);
            return;
        } else if (message == null) {
            Response(res, "Error : Message not found", message, 0);
            return;
        } else if ((message.author != req.session.userId) && (req.session.level < 3)) {
            Response(res, "Error : You're not the owner of this message", null, 0);
            return;
        }

        Message.remove({
            _id: req.params.message_id
        }, function (err, obj) {
            if (err) Response(res, "Error", err, 0);
            else Response(res, 'Message deleted', obj, 1);
        });
    });
}
