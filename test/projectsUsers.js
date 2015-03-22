var expect = require('chai').expect,
    assert = require('chai').assert,
    should = require('chai').should();

var request = require('supertest');
var superagent = require('superagent');
var agent = superagent.agent();
var agent2 = superagent.agent();
var agentAdmin = superagent.agent();

var apiUrl = 'http://localhost:9010';

var projectTest = null;
var userTest = null;
var user2Test = null;
var adminTest = null;
var projectUserTest = null;
var projectUserValue = null;
var projectUserTest2 = null;
var projectUserTest3 = null;
    
describe('ProjectUser', function(){
    describe('Preparation', function(){
        it('must create a new admin', function (done) {
            request(apiUrl)
                .post('/admin')
                .end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(1);
                    adminTest = res.body.data._id;
                    done();
                });
        });

        it('must logged the admin', function (done) {
            request(apiUrl)
                .post('/auth')
                .send({
                    username: "admintest.admintest",
                    password: '098f6bcd4621d373cade4e832627b4f6'
                })
                .end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(1);
                    expect(res.body.message).to.equal("Authentification successfull");
                    agentAdmin.saveCookies(res);
                    done();
                });
        });
        
        it('must create a new user', function(done){
            var req = request(apiUrl).post('/users');
            agentAdmin.attachCookies(req);
            req.send({firstName : 'projectUserTest',
                  lastName : 'projectUserTest',
                  email : 'something@email.com'})
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(1);
                userTest = res.body.data._id;
                done();
            });
        });
        
        it('must logged the test user', function (done) {
            request(apiUrl)
                .post('/auth')
                .send({
                    username: "projectusertest.projectusertest",
                    password: '098f6bcd4621d373cade4e832627b4f6'
                })
                .end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(1);
                    expect(res.body.message).to.equal("Authentification successfull");
                    agent.saveCookies(res);
                    done();
                });
        });
        
        it('must create a second new user', function(done){
            var req = request(apiUrl).post('/users');
            agentAdmin.attachCookies(req);
            req.send({firstName : 'projectUserTestSecond',
                  lastName : 'projectUserTestSecond',
                  email : 'something@email.com'})
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(1);
                userTest = res.body.data._id;
                done();
            });
        });
        
        it('must logged the second test user', function (done) {
            request(apiUrl)
                .post('/auth')
                .send({
                    username: "projectusertestsecond.projectusertestsecond",
                    password: '098f6bcd4621d373cade4e832627b4f6'
                })
                .end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(1);
                    expect(res.body.message).to.equal("Authentification successfull");
                    agent2.saveCookies(res);
                    done();
                });
        });

        it('must create a new project', function(done){
            var req = request(apiUrl).post('/projects');
            agentAdmin.attachCookies(req);
            req.send({name : "ProjectUser Module Test",
                   type : 0,
                   authorUsername : "projectUsertest.projectUsertest"})
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(1);
                projectTest = res.body.data._id;
                done();
            });
        });
    });
               
    describe('.createOrEditProjectUser()', function(){
        it('must need to be logged', function(done){
            request(apiUrl)
            .post('/projectUsers/42')
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.message).to.equal("Error : Not logged");
                expect(res.body.success).to.equal(0);
                done();
            });
        });
        
        it('must need a value', function(done){
            var req = request(apiUrl).post('/projectUsers/42');
            agent2.attachCookies(req);
            req.end(function(err, res){
                if (err) return done(err);
                expect(res.body.message).to.equal("Error : No value given");
                expect(res.body.success).to.equal(0);
                done();
            });
        });
        
        it ('simple member cannot add a new administrator to project', function(done){
            var req = request(apiUrl).post('/projectUsers/'+projectTest);
            agent2.attachCookies(req);
            req.send({value : 0, username : "admintest.admintest"})
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.success).to.equal(0);
                expect(res.body.message).to.equal("Error : You're not an admin");
                done();
            });
        });
        
        it ('must create a new ProjectUser with good informations', function(done){
            var req = request(apiUrl).post('/projectUsers/'+projectTest);
            agent2.attachCookies(req);
            req.send({value : 0})
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                expect(res.body.data.value).to.equal(1);
                expect(res.body.data.project).to.equal(projectTest);
                expect(res.body.data.author).to.equal(userTest);
                projectUserTest = res.body.data._id;
                projectUserValue = res.body.data.value;
                done();
            });
        });
        
        it('creator can add a new administrator to his project', function(done){
            var req = request(apiUrl).post('/projectUsers/'+projectTest);
            agent.attachCookies(req);
            req.send({value : 1, username : "projectUsertestsecond.projectUsertestsecond"})
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                expect(res.body.data.value).to.equal(1);
                expect(res.body.data.project).to.equal(projectTest);
                expect(res.body.data.author).to.equal(user2Test);
                projectUserTest2 = res.body.data._id;
                done();
            });
        });
        
        it('administrator can add a new administrator to his project', function(done){
            var req = request(apiUrl).post('/projectUsers/'+projectTest);
            agent2.attachCookies(req);
            req.send({value : 1, username : "admintest.admintest"})
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                expect(res.body.data.value).to.equal(1);
                expect(res.body.data.project).to.equal(projectTest);
                expect(res.body.data.author).to.equal(adminTest);
                projectUserTest2 = res.body.data._id;
                done();
            });
        });
    })
    
    describe('.getProjectUsers()', function(){        
        it('must have at least one projectUser', function(done){
            request(apiUrl)
            .get('/projectUsers/'+projectTest)
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                done();
            });
        });
    });

    describe('.getProjectUser()', function(){
        it('must return the projectUser (with id param)', function(done){
            request(apiUrl)
            .get('/projectUser/' + projectUserTest)
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                expect(res.body.data.value).to.equal(projectUserValue);
                done();
            });
        });
    });

    describe('.deleteProjectUser()', function(){
        it('administrator cannot kick the creator', function(done){
            var req = request(apiUrl).delete('/projectUser/' + projectUserTest);
            agent2.attachCookies(req);
            req.request(apiUrl)
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.success).to.equal(0);
                expect(res.body.message).to.equal("Error : You cannot kick the creator");
                done();
            });
        });
        
        it('administrator can kick an administrator and members', function(done){
            var req = request(apiUrl).delete('/projectUser/' + projectUserTest3);
            agent2.attachCookies(req);
            req.request(apiUrl)
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                expect(res.body.message).to.equal("ProjectUser deleted");
                done();
            });
        });
        
        it('creator can kick everyone', function(done){
            var req = request(apiUrl).delete('/projectUser/' + projectUserTest2);
            agent.attachCookies(req);
            req.request(apiUrl)
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                expect(res.body.message).to.equal("ProjectUser deleted");
                done();
            });
        });
        
        it('creator cannot kick himself', function(done){
            var req = request(apiUrl).delete('/projectUser/' + projectUserTest);
            agent.attachCookies(req);
            req.request(apiUrl)
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                expect(res.body.message).to.equal("ProjectUser deleted");
                done();
            });
        });
    });
    
    describe('End of test', function(){
        it('must logout the userTest', function (done) {
            var req = request(apiUrl).delete('/auth')
            agent.attachCookies(req);
            req.end(function (err, res) {
                if (err) return err;
                expect(res.body.success).to.equal(1);
                done();
            });
        });

        it('must delete the test user', function (done) {
            var req = request(apiUrl)
                .delete('/users/' + userTest);
            agentAdmin.attachCookies(req);
            req.end(function (err, res) {
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                done();
            });
        });

        it('must logout the user2Test', function (done) {
            var req = request(apiUrl).delete('/auth')
            agent2.attachCookies(req);
            req.end(function (err, res) {
                if (err) return err;
                expect(res.body.success).to.equal(1);
                done();
            });
        });

        it('must delete the user2Test', function (done) {
            var req = request(apiUrl)
                .delete('/users/' + user2Test);
            agentAdmin.attachCookies(req);
            req.end(function (err, res) {
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                done();
            });
        });

        it('must delete the adminTest', function (done) {
            var req = request(apiUrl)
                .delete('/users/' + adminTest);
            agentAdmin.attachCookies(req);
            req.end(function (err, res) {
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                done();
            });
        });

        it('must logout the adminTest', function (done) {
            var req = request(apiUrl).delete('/auth')
            agentAdmin.attachCookies(req);
            req.end(function (err, res) {
                if (err) return err;
                expect(res.body.success).to.equal(1);
                done();
            });
        });
        
        it ('must delete the project test', function(done){
            var req = request(apiUrl).delete('/projects/'+projectTest);
            agentAdmin.attachCookies(req);
            req.end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(1);
                done();
            });
        });
        
        it('must be deleted', function(done){
            request(apiUrl)
            .get('/projectUser/' + projectUserTest)
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.success).to.equal(0);
                done();
            });
        });
    });

});