/**
 * <h2>Routing Table</h2>
 * <table>
 * <tr><td>POST /upload</td><td>{@link Upload.uploadPicture}</td></tr>
 * </table><br>
 * @namespace Upload
 * @author Florian Kauder
 */

var express = require('express'),
    async = require('async'),
    formidable = require('formidable'),
    util = require('util'),
    fs = require('fs-extra'),
    qt = require('quickthumb');
var Log = require('../modules/log');
var calls = [];

// Code orignal from http://tonyspiro.com/uploading-resizing-images-fly-node-js-express/

var router = express.Router();

router.route('/upload').post(uploadPicture);

module.exports = router;

/**
 * Upload a picture on the server<br>
 * <b>Level needed :</b> Member<br>
 * <h5>Return Table:</h5>
 * <table>
 * <tr><td><b>Code</b></td><td><b>Value</b></td></tr>
 * <tr><td>1</td><td>Success</td></tr>
 * <tr><td>-1</td><td>Not logged</td></tr>
 * <tr><td>-3</td><td>Not at least a member</td></tr>
 * </table>
 * @memberof Upload
 * @param {Express.Request} req - request send
 * @param {String} req.body.name - new name of file (with extension)
 * @param {File} req.body.image - image file
 * @param {Express.Response} res - variable to send the response
 */
function uploadPicture(req, res) {
    if (req.session.level == User.Level.Guest){
        Response.notLogged(res);
        return ;
    } else if (req.session.level < User.Level.Member){
        Response.notMember(res);
        return ;
    }

    var form = new formidable.IncomingForm();
    var file_name = "";

    form.parse(req, function afterParse(err, fields, files) {
        file_name = fields.name;
        Response.success(res, "Success", fields);
    });

    form.on('end', function (fields, files) {
        /* Temporary location of our uploaded file */
        var temp_path = this.openedFiles[0].path;
        /* The file name of the uploaded file */
        if (file_name == "")
            file_name = this.openedFiles[0].name;
        /* Location where we want to copy the uploaded file */
        var new_location = 'images/';

        fs.rename(temp_path, new_location + file_name, function (err) {
            if (err) {
                Log.e("Error during upload file : " + err);
            } else {
                Log.i("File " + file_name +
                      " uploaded by user " +
                      req.session.userId);
            }
        });
    });
};
