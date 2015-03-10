var expect = require('chai').expect,
    assert = require('chai').assert,
    should = require('chai').should();

var request = require('supertest');

var apiUrl = 'http://localhost:9010';

var surveyTest = null;
var userTest = null;
var surveyItemName = null;
var surveyItemTest = null;

describe('SurveyItem', function(){
    describe('Preparation', function(){
        it('must create a new user', function(done){
            request(apiUrl)
            .post('/users')
            .send({firstName : 'surveyItemTest',
                  lastName : 'surveyItemTest',
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
            .send({name : "SurveyItem Test",
                   username : "surveyitemtest.surveyitemtest"})
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(1);
                surveyTest = res.body.data._id;
                done();
            });
        });
    });
    
    describe('.createSurveyItem()', function(){
        it('must need a name', function(done){
            request(apiUrl)
            .post('/surveyItems/42')
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(0);
                expect(res.body.message).to.equal("Error : No name given");
                done();
            });
        });
        
        it('must check the survey', function(done){
            request(apiUrl)
            .post('/surveyItems/42')
            .send({name : "Mon Item"})
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(0);
                expect(res.body.message).to.equal("Error : Survey not found");
                done();
            });
        });
        
        it('must add a new surveyItem', function(done){
            request(apiUrl)
            .post('/surveyItems/'+surveyTest)
            .send({name : "Mon Item"})
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(1);
                expect(res.body.message).to.equal("SurveyItem created");
                expect(res.body.data.name).to.equal("Mon Item");
                surveyItemTest = res.body.data._id;
                surveyItemName = res.body.data.name;
                done();
            });
        });
    });
    
    describe(".getSurveyItems()", function(){
        it('must return at least one survey', function(done){
            request(apiUrl)
            .get("/surveyItems/"+surveyTest)
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(1);
                expect(res.body.data).not.to.be.empty;
                done();
            });
        });
    });
    
    describe(".getSurveyItem()", function(){
        it('must return the survey', function(done){
           request(apiUrl)
           .get("/surveyItem/"+surveyItemTest)
           .end(function(err, res){
               if (err) return err;
               expect(res.body.success).to.equal(1);
               expect(res.body.data.name).to.equal(surveyItemName);
               done();
           });
        });
    });
    
    describe(".editSurveyItem()", function(){
        it('must edit the name', function(done){
            request(apiUrl)
            .put("/surveyItem/"+surveyItemTest)
            .send({name : "Super Item"})
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(1);
                expect(res.body.data.name).to.equal("Super Item");
                done();
            });
        });
    });
    
    describe(".deleteSurveyItem()", function(){
        it('must delete the survey', function(done){
            request(apiUrl)
           .delete("/surveyItem/"+surveyItemTest)
           .end(function(err, res){
               if (err) return err;
               expect(res.body.success).to.equal(1);
               done();
           });
        });
        
        it('must have delete the survey', function(done){
            request(apiUrl)
           .get("/surveyItem/"+surveyItemTest)
           .end(function(err, res){
               if (err) return err;
               expect(res.body.success).to.equal(0);
               done();
           });
        });
    });
    
    describe("End of test", function(){
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