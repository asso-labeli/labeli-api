var expect = require('chai').expect,
    assert = require('chai').assert,
    should = require('chai').should();

var request = require('supertest');

var apiUrl = 'http://localhost:9010';

var surveyTest = null;
var surveyItemTest = null;
var surveyItemTest2 = null;
var userTest = null;
var surveyVoteValue = null;
var surveyVoteTest = null;

describe('SurveyVote', function(){
    describe('Preparation', function(){
        it('must create a new user', function(done){
            request(apiUrl)
            .post('/users')
            .send({firstName : 'surveyVoteTest',
                  lastName : 'surveyVoteTest',
                  email : 'something@email.com'})
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(1);
                userTest = res.body.data._id;
                done();
            });
        });
        
        it('must create a new survey', function(done){
            request(apiUrl)
            .post('/surveys')
            .send({name : "SurveyVote Test",
                   username : "surveyvotetest.surveyvotetest"})
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(1);
                surveyTest = res.body.data._id;
                done();
            });
        });
        
        it('must create two surveyItems', function(done){
            request(apiUrl)
            .post('/surveyItems/'+surveyTest)
            .send({name : "Option 1"})
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(1);
                surveyItemTest = res.body.data._id;
            });
            
            request(apiUrl)
            .post('/surveyItems/'+surveyTest)
            .send({name : "Option 2"})
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(1);
                surveyItemTest2 = res.body.data._id;
                done();
            });
        });
    });
    
    describe('.createSurveyItem()', function(){
        it('must need a username', function(done){
            request(apiUrl)
            .post('/surveyVotes/42')
            .send({items : [1]})
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(0);
                expect(res.body.message).to.equal("Error : No username given");
                done();
            });
        });
        
        it('must check the user', function(done){
            request(apiUrl)
            .post('/surveyVotes/42')
            .send({"items" : [1], "username" : 'aa'})
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(0);
                expect(res.body.message).to.equal("Error : User not found");
                done();
            });
        });
        
        it('must check the survey', function(done){
            request(apiUrl)
            .post('/surveyVotes/42')
            .send({items : [1], username : "surveyvotetest.surveyvotetest"})
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(0);
                expect(res.body.message).to.equal("Error : Survey not found");
                done();
            });
        });
        
        it('must check the surveyItem', function(done){
            request(apiUrl)
            .post('/surveyVotes/'+surveyTest)
            .send({items : [1], username : "surveyvotetest.surveyvotetest"})
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(0);
                expect(res.body.message).to.equal("Error : One SurveyItem not valid");
                done();
            });
        });
        
        it('must add a new surveyVote', function(done){
            request(apiUrl)
            .post('/surveyVotes/'+surveyTest)
            .send({items : [surveyItemTest], 
                   username : "surveyvotetest.surveyvotetest"})
            .end(function(err, res){
                if (err) return err;
                console.log(res.body);
                expect(res.body.success).to.equal(1);
                expect(res.body.message).to.equal("SurveyVotes created");
                expect(res.body.data[0].value).to.equal(surveyItemTest);
                surveyVoteTest = res.body.data[0]._id;
                surveyVoteValue = res.body.data[0].value;
                done();
            });
        });
    });
    
    describe(".getSurveyVotes()", function(){
        it('must return at least one survey vote', function(done){
            request(apiUrl)
            .get("/surveyVotes/"+surveyTest)
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(1);
                expect(res.body.data[0]).not.to.be.empty;
                done();
            });
        });
    });
    
    describe(".getSurveyVote()", function(){
        it('must return the survey vote', function(done){
           request(apiUrl)
           .get("/surveyVote/"+surveyVoteTest)
           .end(function(err, res){
               if (err) return err;
               expect(res.body.success).to.equal(1);
               expect(res.body.data.value).to.equal(surveyVoteValue);
               done();
           });
        });
    });
    
    describe(".deleteSurveyItem()", function(){
        it('must delete the survey vote', function(done){
            request(apiUrl)
           .delete("/surveyVote/"+surveyVoteTest)
           .end(function(err, res){
               if (err) return err;
               expect(res.body.success).to.equal(1);
               done();
           });
        });
        
        it('must have delete the survey vote', function(done){
            request(apiUrl)
           .get("/surveyVote/"+surveyVoteTest)
           .end(function(err, res){
               if (err) return err;
               expect(res.body.success).to.equal(0);
               done();
           });
        });
    });
    
    describe("End of test", function(){
        it('must delete the surveyItems test', function(done){
            request(apiUrl)
            .delete('/surveyItem/'+surveyItemTest)
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(1);
            });
            
            request(apiUrl)
            .delete('/surveyItem/'+surveyItemTest2)
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(1);
                done();
            });
        });
        it ('must delete the survey test', function(done){
            request(apiUrl)
            .delete('/surveys/'+surveyTest)
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(1);
                done();
            });
        });
        it ('must delete the user test', function(done){
            request(apiUrl)
            .delete('/users/'+userTest)
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(1);
                done();
            });
        });
    });
}); 