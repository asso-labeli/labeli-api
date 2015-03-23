var expect = require('chai').expect,
    assert = require('chai').assert,
    should = require('chai').should();

var request = require('supertest');

var apiUrl = 'http://localhost:9010';
var superagent = require('superagent');
var agent = superagent.agent();
var agent2 = superagent.agent();
var agentAdmin = superagent.agent();

var projectTest = null;
var adminTest = null;
var userTest = null;
var user2Test = null;
var voteTest = null;
var vote2Test = null;
var voteValue = null;

describe('Vote', function () {
    describe('Preparation', function () {
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

        it('must create a new test user', function (done) {
            var req = request(apiUrl).post('/users');
            agentAdmin.attachCookies(req);
            req.send({
                    firstName: 'voteTest',
                    lastName: 'voteTest',
                    email: 'something@email.com'
                })
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(1);
                    userTest = res.body.data._id;
                    done();
                });
        });

        it('must logged the test user', function (done) {
            request(apiUrl)
                .post('/auth')
                .send({
                    username: "votetest.votetest",
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

        it('must create a second new test user', function (done) {
            var req = request(apiUrl).post('/users');
            agentAdmin.attachCookies(req);
            req.send({
                    firstName: 'voteTestSecond',
                    lastName: 'voteTestSecond',
                    email: 'something@email.com'
                })
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(1);
                    user2Test = res.body.data._id;
                    done();
                });
        });

        it('must logged the second test user', function (done) {
            request(apiUrl)
                .post('/auth')
                .send({
                    username: "votetestsecond.votetestsecond",
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

        it('must create a new project', function (done) {
            var req = request(apiUrl).post('/projects');
            agentAdmin.attachCookies(req);
            req.send({
                    name: "Vote Module Test",
                    type: 0,
                    authorUsername: "votetest.votetest"
                })
                .end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(1);
                    projectTest = res.body.data._id;
                    done();
                });
        });
    });

    describe('.createOrEditVote()', function () {
        it('must need to be logged', function (done) {
            request(apiUrl)
                .post('/votes/42')
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.message).to.equal("Error : Not logged");
                    expect(res.body.success).to.equal(0);
                    done();
                });
        });

        it('must need a value', function (done) {
            var req = request(apiUrl).post('/votes/42');
            agent.attachCookies(req);
            req.end(function (err, res) {
                if (err) return done(err);
                expect(res.body.message).to.equal("Error : No value given");
                expect(res.body.success).to.equal(0);
                done();
            });
        });

        it('must check the project given', function (done) {
            var req = request(apiUrl).post('/votes/42');
            agent.attachCookies(req);
            req.send({
                    value: 1
                })
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(0);
                    expect(res.body.message).to.equal("Error : Project not found");
                    done();
                });
        });

        it('must create a new Vote for userTest', function (done) {
            var req = request(apiUrl).post('/votes/' + projectTest);
            agent.attachCookies(req);
            req.send({
                    value: 1
                })
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(1);
                    expect(res.body.data.value).to.equal(1);
                    expect(res.body.data.project).to.equal(projectTest);
                    expect(res.body.data.author).to.equal(userTest);
                    voteTest = res.body.data._id;
                    voteValue = res.body.data.value;
                    done();
                });
        });

        it('must edit the Vote of userTest', function (done) {
            var req = request(apiUrl).post('/votes/' + projectTest);
            agent.attachCookies(req);
            req.send({
                    value: -1;
                })
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(1);
                    expect(res.body.data.value).to.equal(-1);
                    expect(res.body.data.project).to.equal(projectTest);
                    expect(res.body.data.author).to.equal(userTest);
                    voteTest = res.body.data._id;
                    voteValue = res.body.data.value;
                    done();
                });
        });
        
        it('user2Test can vote for project', function(done){
            var req = request(apiUrl).post('/votes/' + projectTest);
            agent2.attachCookies(req);
            req.send({
                    value: 1
                })
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(1);
                    expect(res.body.data.value).to.equal(1);
                    expect(res.body.data.project).to.equal(projectTest);
                    expect(res.body.data.author).to.equal(user2Test);
                    vote2Test = res.body.data._id;
                    done();
                });
        });
    });

    describe('.getVotes()', function () {
        it('must have at least one vote', function (done) {
            request(apiUrl)
                .get('/votes/' + projectTest)
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(1);
                    done();
                });
        });
    });

    describe('.getVote()', function () {
        it('must return the vote (with id param)', function (done) {
            request(apiUrl)
                .get('/vote/' + voteTest)
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(1);
                    expect(res.body.data.value).to.equal(voteValue);
                    done();
                });
        });
    });

    describe('.deleteVote()', function () {    
        it('admin cannot delete someone\'s testVote', function (done) {
            var req = request(apiUrl).delete('/votes/' + voteTest);
            agentAdmin.attachCookies(req);
            req.end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(0);
                    expect(res.body.message).to.equal("Error : You cannot change vote"
                    done();
                });
        });
        
        it('userTest can delete his testVote', function (done) {
            var req = request(apiUrl).delete('/votes/' + voteTest);
            agent.attachCookies(req);
            req.end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(1);
                    done();
                });
        });

        it('must be deleted', function (done) {
            request(apiUrl)
                .get('/vote/' + voteTest)
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(0);
                    done();
                });
        });
        
        it('user2Test can delete his testVote', function (done) {
            var req = request(apiUrl).delete('/votes/' + vote2Test);
            agent2.attachCookies(req);
            req.end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(1);
                    done();
                });
        });
    });

    describe('End of test', function () {
        it('must delete the project test', function (done) {
            var req = request(apiUrl).delete('/projects/' + projectTest);
            agentAdmin.attachCookies(req);
            req.end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(1);
                    done();
                });
        });
        
        it('must logout the current user2Test', function (done) {
            var req = request(apiUrl).delete('/auth')
            agent2.attachCookies(req);
            req.end(function (err, res) {
                if (err) return err;
                expect(res.body.success).to.equal(1);
                done();
            });
        });

        it('must delete the user2Test', function (done) {
            var req = request(apiUrl).delete('/users/' + user2Test);
            agentAdmin.attachCookies(req);
            req.end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(1);
                    done();
                });
        });
        
        it('must logout the current userTest', function (done) {
            var req = request(apiUrl).delete('/auth')
            agent.attachCookies(req);
            req.end(function (err, res) {
                if (err) return err;
                expect(res.body.success).to.equal(1);
                done();
            });
        });

        it('must delete the userTest', function (done) {
            var req = request(apiUrl).delete('/users/' + userTest);
            agentAdmin.attachCookies(req);
            req.end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(1);
                    done();
                });
        });
        
        it('must delete the adminTest', function (done) {
            var req = request(apiUrl).delete('/users/' + adminTest);
            agentAdmin.attachCookies(req);
            req.end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(1);
                    done();
                });
        });

        it('must logout the current adminTest', function (done) {
            var req = request(apiUrl).delete('/auth')
            agentAdmin.attachCookies(req);
            req.end(function (err, res) {
                if (err) return err;
                expect(res.body.success).to.equal(1);
                done();
            });
        });
    });

});