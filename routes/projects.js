var Project = require('../models/project');
var User = require('../models/user');
var express = require('express');
var router = express.Router();

router.route('/projects').post(createProject);
router.route('/projects').get(getProjects);
router.route('/projects/:project_id').get(getProject);
router.route('/projects/:project_id').put(editProject);
router.route('/projects/:project_id').delete(deleteProject);

module.exports = router;

function createProject(req, res)
{        
    var project = new Project();
    
    if (!("name" in req.body)){
        res.json({message : "Error : No name given !"});
        return ;
    } else
        project.name = req.body.name;
    
    if (!("type" in req.body)){
        res.json({message : "Error : No type given !"});
        return ;
    } else
        project.type = req.body.type;
    
    if (!("author_id" in req.body)){
        res.json({message : "Error : No author_id given !"});
        return ;
    }
    else {
        User.findOne({username : req.body.author_id}, function(err, user){
            if (err) {
                res.send(err);
            } else if (user === null){
                res.send({message : "Error : author_id not found !"});
            } else {
                project.author = user;
                project.save(function(err){
                    if (err) res.send(err);
                    res.json({ message: 'Project created !' });
                });
            }
        });
    }
}

function getProjects(req, res)
{
    Project.find(function(err, projects)
    {
        if (err) res.send(err);
        res.json(projects);
    });
}

function getProject(req, res)
{
    Project.findById(req.params.project_id, function(err, project)
    {
        if (err) res.send(err);
        res.json(project);
    });
}

function editProject(req, res)
{
    // use our bear model to find the bear we want
    Project.findById(req.params.project_id, function(err, project)
    {
        if (err) res.send(err);
        project.name = req.body.name;  // update the bears info

        // save the bear
        project.save(function(err)
        {
            if (err) res.send(err);
            res.json({ message: 'Project updated!' });
        });

    });
}
function deleteProject(req, res)
{
    Project.remove({_id: req.params.project_id}, function(err, project)
    {
        if (err) res.send(err);
        res.json({ message: 'Project deleted!' });
    });
}