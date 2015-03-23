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
var surveyItemTest = null;
var surveyItemTest2 = null;
var adminTest = null;
var userTest = null;
var user2Test = null;
var surveyVoteValue = null;
var surveyVoteTest = null;
var surveyVote2Test = null;

describe('SurveyVote', function(){
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
        
        it('must create two surveyItems', function(done){
            var req = request(apiUrl).post('/surveyItems/'+surveyTest);
            agent.attachCookies(req);
            req.send({name : "Option 1"})
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(1);
                surveyItemTest = res.body.data._id;
            });
            
            var req = request(apiUrl).post('/surveyItems/'+surveyTest);
            agent.attachCookies(req);
            req.send({name : "Option 2"})
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(1);
                surveyItemTest2 = res.body.data._id;
                done();
            });
        });
    });
    
    describe('.createSurveyItem()', function(){
        it('need to be logged', function(done){
            request(apiUrl)
            .post('/surveyVotes/42')
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(0);
                expect(res.body.message).to.equal("Error : Not logged");
                done();
            });
        });
        
        it('must need items (in array)', function(done){
            var req = request(apiUrl).post('/surveyVotes/42');
            agent.attachCookies(req);
            req.end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(0);
                expect(res.body.message).to.equal("Error : No items given");
                done();
            });
        });
        
        it('must check the survey', function(done){
            var req = request(apiUrl).post('/surveyVotes/42');
            agent.attachCookies(req);
            req.send({items : [1]})
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(0);
                expect(res.body.message).to.equal("Error : Survey not found");
                done();
            });
        });
        
        it('must check the surveyItem', function(done){
            var req = request(apiUrl).post('/surveyVotes/' + surveyTest);
            agent.attachCookies(req);
            req.send({items : [1]})
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(0);
                expect(res.body.message).to.equal("Error : One SurveyItem not exist");
                done();
            });
        });
        
        it('must add a new surveyVote', function(done){
            var req = request(apiUrl).post('/surveyVotes/' + surveyTest);
            agent.attachCookies(req);
            req.send({items : [surveyItemTest]})
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(1);
                expect(res.body.message).to.equal("SurveyVotes created");
                expect(res.body.data[0].value).to.equal(surveyItemTest);
                surveyVoteTest = res.body.data[0]._id;
                surveyVoteValue = res.body.data[0].value;
                done();
            });
        });
        
        it('simple member can add a new Vote', function(done){
            var req = request(apiUrl).post('/surveyVotes/' + surveyTest);
            agent2.attachCookies(req);
            req.send({items : [surveyItemTest2]})
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(1);
                expect(res.body.message).to.equal("SurveyVotes created");
                expect(res.body.data[0].value).to.equal(surveyItemTest2);
                surveyVote2Test = res.body.data[0]._id;
                done();
            });
        });
    });
    
    describe(".getSurveyVotes()", function(){
        it('guest cannot get votes', function (done) {
            request(apiUrl)
                .get("/surveyVotes/"+surveyTest)
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(0);
                    expect(res.body.message).to.equal("Error : Not logged");
                    done();
                });
        });

        it('member cannot get votes', function (done) {
            var req = request(apiUrl).get("/surveyVotes/"+surveyTest);
            agent.attachCookies(req);
            req.end(function (err, res) {
                if (err) return done(err);
                expect(res.body.success).to.equal(0);
                expect(res.body.message).to.equal("Error : You're not an admin");
                done();
            });
        });

        it('admin can get votes', function (done) {
            var req = request(apiUrl).get("/surveyVotes/"+surveyTest);
            agentAdmin.attachCookies(req);
            req.end(function (err, res) {
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                done();
            });
        });
    });
    
    describe(".getSurveyVote()", function(){
        it('guest cannot get specific vote', function (done) {
            request(apiUrl)
                .get("/surveyVote/"+surveyVoteTest)
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(0);
                    expect(res.body.message).to.equal("Error : Not logged");
                    done();
                });
        });

        it('member cannot get specific vote', function (done) {
            var req = request(apiUrl).get("/surveyVote/"+surveyVoteTest);
            agent.attachCookies(req);
            req.end(function (err, res) {
                if (err) return done(err);
                expect(res.body.success).to.equal(0);
                expect(res.body.message).to.equal("Error : You're not an admin");
                done();
            });
        });

        it('admin can get specific vote', function (done) {
            var req = request(apiUrl).get("/surveyVote/"+surveyVoteTest);
            agentAdmin.attachCookies(req);
            req.end(function (err, res) {
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                done();
            });
        });
    });
    
    describe('.getSessionSurveyVote()', function () {
        it('guest cannot get session surveyVote', function (done) {
            request(apiUrl)
                .get('/voteForSurvey/' + surveyTest)
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(0);
                    expect(res.body.message).to.equal("Error : Not logged");
                    done();
                });
        });

        it('member can get session vote', function (done) {
            var req = request(apiUrl).get('/voteForSurvey/' + surveyTest);
            agent.attachCookies(req);
            req.end(function (err, res) {
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                expect(res.body.data[0].value).to.equal(surveyVoteValue);
                done();
            });
        });
    });
    
    describe('.getSurveyVoteResult()', function(){
        it('guest cannot get result for a vote', function (done) {
            request(apiUrl)
                .get('/surveyVoteResult/' + surveyTest)
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(0);
                    expect(res.body.message).to.equal("Error : Not logged");
                    done();
                });
        });
        
        it('member can get result for a vote', function (done) {
            var req = request(apiUrl).get('/surveyVoteResult/' + surveyTest);
            agent.attachCookies(req);
            req.end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(1);
                    expect(res.body.data[surveyItemTest]).to.equal(1);
                    expect(res.body.data[surveyItemTest2]).to.equal(1);
                    expect(res.body.data.total).to.equal(2);
                    done();
                });
        });
    });
    
    describe(".deleteSurveyItem()", function(){
        it('admin can delete someone\'s testVote', function (done) {
            var req = request(apiUrl).delete("/surveyVote/"+surveyVoteTest);
            agentAdmin.attachCookies(req);
            req.end(function (err, res) {
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                done();
            });
        });

        it('must be deleted', function (done) {
            var req = request(apiUrl).get("/surveyVote/"+surveyVoteTest);
            agentAdmin.attachCookies(req);
            req.end(function (err, res) {
                if (err) return done(err);
                expect(res.body.success).to.equal(0);
                done();
            });
        });

        it('userTest cannot delete specific vote', function (done) {
            var req = request(apiUrl).delete("/surveyVote/"+surveyVote2Test);
            agent.attachCookies(req);
            req.end(function (err, res) {
                if (err) return done(err);
                expect(res.body.success).to.equal(0);
                expect(res.body.message).to.equal("Error : You're not an admin");
                done();
            });
        });
    });
    
    describe('.deleteSessionSurveyVote()', function () {
        it('guest cannot get session vote', function (done) {
            request(apiUrl)
                .delete('/voteForSurvey/' + surveyTest)
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(0);
                    expect(res.body.message).to.equal("Error : Not logged");
                    done();
                });
        });

        it('user2Test can delete his vote', function (done) {
            var req = request(apiUrl).delete('/voteForSurvey/' + surveyTest);
            agent2.attachCookies(req);
            req.end(function (err, res) {
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                done();
            });
        });
        
        it('user2Test cannot delete his vote a second time', function (done) {
            var req = request(apiUrl).delete('/voteForSurvey/' + surveyTest);
            agent2.attachCookies(req);
            req.end(function (err, res) {
                if (err) return done(err);
                expect(res.body.success).to.equal(0);
                expect(res.body.message).to.equal("Error : SurveyVote not found");
                done();
            });
        });
    });
    
    describe("End of test", function(){
        it('must delete the surveyItems test', function(done){
            var req = request(apiUrl).delete('/surveyItem/'+surveyItemTest);
            agent.attachCookies(req);
            req.end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(1);
            });
            
            var req = request(apiUrl).delete('/surveyItem/'+surveyItemTest2);
            agent.attachCookies(req);
            req.end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(1);
                done();
            });
        });
        
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