var expect = require('chai').expect,
    assert = require('chai').assert,
    should = require('chai').should();

var request = require('supertest');
var superagent = require('superagent');
var agent = superagent.agent();
var agent2 = superagent.agent();
var agentAdmin = superagent.agent();

var apiUrl = 'http://localhost:9010';

var surveyTest = null;
var adminTest = null;
var userTest = null;
var user2Test = null;
var surveyItemName = null;
var surveyItemTest = null;

describe('SurveyItem', function () {
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
                    firstName: 'surveyItemTest',
                    lastName: 'surveyItemTest',
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
                    username: "surveyitemtest.surveyitemtest",
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
                    firstName: 'surveyItemTest2',
                    lastName: 'surveyItemTest2',
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
                    username: "surveyitemtest2.surveyitemtest2",
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

        it('must create a new survey', function (done) {
            var req = request(apiUrl).post('/surveys');
            agent.attachCookies(req);
            req.send({
                    name: "SurveyTest"
                })
                .end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(1);
                    surveyTest = res.body.data._id;
                    done();
                });
        });
    });

    describe('.createSurveyItem()', function () {
        it('need to be logged', function (done) {
            request(apiUrl)
                .post('/surveyItems/42')
                .end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(0);
                    expect(res.body.message).to.equal("Error : Not logged");
                    done();
                });
        });

        it('must need a name', function (done) {
            var req = request(apiUrl).post('/surveyItems/42');
            agent.attachCookies(req);
            req.end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(0);
                    expect(res.body.message).to.equal("Error : No name given");
                    done();
                });
        });

        it('must check the survey', function (done) {
            var req = request(apiUrl).post('/surveyItems/42');
            agent.attachCookies(req);
            req.send({
                    name: "Mon Item"
                })
                .end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(0);
                    expect(res.body.message).to.equal("Error : Survey not found");
                    done();
                });
        });

        it('survey\'s admin can add a new surveyItem', function (done) {
            var req = request(apiUrl).post('/surveyItems/' + surveyTest);
            agent.attachCookies(req);
            req.send({
                    name: "Mon Item"
                })
                .end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(1);
                    expect(res.body.message).to.equal("SurveyItem created");
                    expect(res.body.data.name).to.equal("Mon Item");
                    surveyItemTest = res.body.data._id;
                    surveyItemName = res.body.data.name;
                    done();
                });
        });
        
        it('simple member cannot add a new surveyItem', function (done) {
            var req = request(apiUrl).post('/surveyItems/' + surveyTest);
            agent2.attachCookies(req);
            req.send({
                    name: "Mon Item2"
                })
                .end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(0);
                    expect(res.body.message).to.equal("Error : You're not an admin");
                    done();
                });
        });
    });

    describe(".getSurveyItems()", function () {
        it('must return at least one survey', function (done) {
            request(apiUrl)
                .get("/surveyItems/" + surveyTest)
                .end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(1);
                    expect(res.body.data[0]).not.to.be.empty;
                    done();
                });
        });
    });

    describe(".getSurveyItem()", function () {
        it('must return the survey', function (done) {
            request(apiUrl)
                .get("/surveyItem/" + surveyItemTest)
                .end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(1);
                    expect(res.body.data.name).to.equal(surveyItemName);
                    done();
                });
        });
    });

    describe(".editSurveyItem()", function () {
        it('need to be logged', function (done) {
            request(apiUrl)
                .put("/surveyItem/" + surveyItemTest)
                .send({
                    name: "Super Item"
                })
                .end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(0);
                    expect(res.body.message).to.equal("Error : Not logged");
                    done();
                });
        });
        
        it('survey\'s admin can edit the name', function (done) {
            var req = request(apiUrl).put("/surveyItem/" + surveyItemTest);
            agent.attachCookies(req);
            req.send({
                    name: "Super Item"
                })
                .end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(1);
                    expect(res.body.data.name).to.equal("Super Item");
                    done();
                });
        });
        
        it('admin can edit the name', function (done) {
            var req = request(apiUrl).put("/surveyItem/" + surveyItemTest);
            agentAdmin.attachCookies(req);
            req.send({
                    name: "Admin Item"
                })
                .end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(1);
                    expect(res.body.data.name).to.equal("Admin Item");
                    done();
                });
        });
        
        it('member cannot edit the name', function (done) {
            var req = request(apiUrl).put("/surveyItem/" + surveyItemTest);
            agent2.attachCookies(req);
            req.send({
                    name: "My Item"
                })
                .end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(0);
                    expect(res.body.message).to.equal("Error : You're not an admin");
                    done();
                });
        });
    });

    describe(".deleteSurveyItem()", function () {
        it('need to be logged', function (done) {
            request(apiUrl)
                .delete("/surveyItem/" + surveyItemTest)
                .end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(0);
                    expect(res.body.message).to.equal("Error : Not logged");
                    done();
                });
        });
        
        it('member cannot delete the item', function (done) {
            var req = request(apiUrl).delete("/surveyItem/" + surveyItemTest);
            agent2.attachCookies(req);
            req.end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(0);
                    expect(res.body.message).to.equal("Error : You're not an admin");
                    done();
                });
        });
        
        it('survey\'s admin can delete the item', function (done) {
            var req = request(apiUrl).delete("/surveyItem/" + surveyItemTest);
            agent.attachCookies(req);
            req.end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(1);
                    done();
                });
        });

        it('must have delete the survey', function (done) {
            request(apiUrl)
                .get("/surveyItem/" + surveyItemTest)
                .end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(0);
                    done();
                });
        });
    });

    describe("End of test", function () {
        it('must delete the survey test', function (done) {
            var req = request(apiUrl).delete('/surveys/' + surveyTest);
            agent.attachCookies(req);
            req.end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(1);
                    done();
                });
        });
        
        it('must logout the userTest', function (done) {
            var req = request(apiUrl).delete('/auth')
            agent.attachCookies(req);
            req.end(function (err, res) {
                if (err) return err;
                expect(res.body.success).to.equal(1);
                done();
            });
        });

        it('must delete the userTest', function (done) {
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
    });
});