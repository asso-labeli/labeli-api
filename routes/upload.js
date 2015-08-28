var express = require('express'),
    async = require('async'),
    formidable = require('formidable'),
    util = require('util'),
    fs = require('fs-extra'),
    qt = require('quickthumb');
var calls = [];

// Code from http://tonyspiro.com/uploading-resizing-images-fly-node-js-express/

var router = express.Router();

router.route('/upload').post(uploadPicture);

module.exports = router;

function uploadPicture(req, res) {
    var form = new formidable.IncomingForm();
    var file_name = "";

    form.parse(req, function (err, fields, files) {
        file_name = fields.name;

        res.writeHead(200, {
            'content-type': 'text/plain'
        });
        res.write('Upload successfull !\n\n');
        res.end(util.inspect({
            fields: fields,
            files: files
        }));
    });

    form.on('end', function (fields, files) {
        /* Temporary location of our uploaded file */
        console.log(fields);
        console.log(this.openedFiles);
        var temp_path = this.openedFiles[0].path;
        /* The file name of the uploaded file */
        if (file_name == "")
            file_name = this.openedFiles[0].name;
        /* Location where we want to copy the uploaded file */
        var new_location = 'images/';

        fs.copy(temp_path, new_location + file_name, function (err) {
            if (err) {
                console.error(err);
            } else {
                console.log("Success !")
            }
        });
    });
};
