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
var surveyName = null;
var adminTest = null;
var userTest = null;
var user2Test = null;

describe('Survey', function () {
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
                    firstName: 'surveyTest',
                    lastName: 'surveyTest',
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
                    username: "surveytest.surveytest",
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
                    firstName: 'surveyTest2',
                    lastName: 'surveyTest2',
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
                    username: "surveytest2.surveytest2",
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
    });

    describe('.createSurvey()', function () {
        it('must to be logged', function (done) {
            request(apiUrl)
                .post('/surveys')
                .end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(0);
                    expect(res.body.message).to.equal("Error : Not logged");
                    done();
                });
        });

        it('must need a name', function (done) {
            var req = request(apiUrl).post('/surveys');
            agent.attachCookies(req);
            req.end(function (err, res) {
                if (err) return err;
                expect(res.body.success).to.equal(0);
                expect(res.body.message).to.equal("Error : No name given");
                done();
            });
        });

        it('must create a new Survey', function (done) {
            var req = request(apiUrl).post('/surveys');
            agent.attachCookies(req);
            req.send({
                    name: "Mon Sondage Test"
                })
                .end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(1);
                    expect(res.body.data.name).to.equal("Mon Sondage Test");
                    expect(res.body.data.author).to.equal(userTest);
                    surveyTest = res.body.data._id;
                    surveyName = res.body.data.name;
                    done();
                });
        });

        it('must check if name\'s survey already exists', function (done) {
            var req = request(apiUrl).post('/surveys');
            agent.attachCookies(req);
            req.send({
                    name: "Mon Sondage Test"
                })
                .end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(0);
                    expect(res.body.message).to.equal("Error : Survey's name already exists");
                    done();
                });
        });
    });

    describe(".getSurveys()", function () {
        it('must return at least one survey', function (done) {
            request(apiUrl)
                .get("/surveys")
                .end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(1);
                    expect(res.body.data).not.to.be.empty;
                    done();
                });
        });
    });

    describe(".getSurvey()", function () {
        it('must return the survey', function (done) {
            request(apiUrl)
                .get("/surveys/" + surveyTest)
                .end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(1);
                    expect(res.body.data.name).to.equal(surveyName);
                    done();
                });
        });
    });

    describe(".editSurvey()", function () {
        editSurvey("name", "SuperSondage");
        editSurvey("description", "Pour ou contre le Super Sondage ?");

        it("admin can edit a survey", function (done) {
            var req = request(apiUrl).put('/surveys/' + surveyTest);
            agentAdmin.attachCookies(req);
            req.send({
                    name: "AdminSondage"
                })
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(1);
                    expect(res.body.data.name).to.equal("AdminSondage");
                    done();
                });
        });

        it("other user cannot edit a survey", function (done) {
            var req = request(apiUrl).put('/surveys/' + surveyTest);
            agent2.attachCookies(req);
            req.send({
                    name: "AdminSondage"
                })
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(0);
                    expect(res.body.message).to.equal("Error : You're not an admin");
                    done();
                });
        });
    });

    describe(".deleteSurvey()", function () {
        it("other user cannot delete a survey", function (done) {
            var req = request(apiUrl).delete("/surveys/" + surveyTest);
            agent2.attachCookies(req);
            req.end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(0);
                    expect(res.body.message).to.equal("Error : You're not an admin");
                    done();
                });
        });
        
        it('user can delete the survey', function (done) {
            var req = request(apiUrl).delete("/surveys/" + surveyTest);
            agent.attachCookies(req);
            req.end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(1);
                    done();
                });
        });

        it('must have delete the survey', function (done) {
            request(apiUrl)
                .get("/surveys/" + surveyTest)
                .end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(0);
                    done();
                });
        });

        it('must have delete the survey items', function (done) {
            request(apiUrl)
                .get("/surveyItems/" + surveyTest)
                .end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(1);
                    expect(res.body.data).to.be.empty;
                    done();
                });
        });

        it('must have delete the survey votes', function (done) {
            request(apiUrl)
                .get("/surveyVotes/" + surveyTest)
                .end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(1);
                    expect(res.body.data).to.be.empty;
                    done();
                });
        });
    });

    describe("End of test", function () {
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


function editSurvey(type, value) {
    it('must edit the ' + type, function (done) {
        var params = {}
        params[type] = value;

        var req = request(apiUrl).put('/surveys/' + surveyTest);
        agent.attachCookies(req);
        req.send(params)
            .end(function (err, res) {
                if (err) return done(err);
                expect(res.body.data[type]).to.equal(value);
                done();
            });
    });
}