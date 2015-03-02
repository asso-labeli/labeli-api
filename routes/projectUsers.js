var Project = require('../models/project');
var User = require('../models/user');
var express = require('express');
var async = require('async');
var calls = [];

var router = express.Router();

router.route('/projectUsers/:project_id').post(createProjectUser);
router.route('/projectUsers/:project_id').get(getProjectUsers);
router.route('/projectUser/:projectUser_id').get(getProjectUser);
router.route('/projectUser/:projectUser_id').put(editProjectUser);
router.route('/projectUser/:projectUser_id').delete(deleteProjectUser);

module.exports = router;

function createProjectUser(req, res){
    
}

function getProjectUsers(req, res){
    
}

function getProjectUser(req, res){
    
}

function editProjectUser(req, res){
    
}

function deleteProjectUser(req, res){
    
}
