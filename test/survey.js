var expect = require('chai').expect,
    assert = require('chai').assert,
    should = require('chai').should();

var request = require('supertest');

var apiUrl = 'http://localhost:9010';

var surveyTest = null;
var surveyName = null;
var userTest = null;

describe('Survey', function(){
    describe('Preparation', function(){
        it('must create a new user', function(done){
            request(apiUrl)
            .post('/users')
            .send({firstName : 'surveyTest',
                  lastName : 'surveyTest',
                  email : 'something@email.com'})
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(1);
                userTest = res.body.data._id;
                done();
            });
        });
    });
    
    describe('.createSurvey()', function(){
        it('must need a name', function(done){
            request(apiUrl)
            .post('/surveys')
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(0);
                expect(res.body.message).to.equal("Error : No name given");
                done();
            });
        });
        
        it('must need a username', function(done){
            request(apiUrl)
            .post('/surveys')
            .send({name : "Mon Sondage Test"})
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(0);
                expect(res.body.message).to.equal("Error : No username given");
                done();
            });
        });
        
        it('must check the username', function(done){
            request(apiUrl)
            .post('/surveys')
            .send({name : "Mon Sondage Test", username : "a"})
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(0);
                expect(res.body.message).to.equal("Error : User not found");
                done();
            });
        });
        
        it('must create a new Survey', function(done){
            request(apiUrl)
            .post('/surveys')
            .send({name : "Mon Sondage Test", username : "surveytest.surveytest"})
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(1);
                expect(res.body.data.name).to.equal("Mon Sondage Test");
                expect(res.body.data.author).to.equal(userTest);
                surveyTest = res.body.data._id;
                surveyName = res.body.data.name;
                done();
            });
        });
        
        it ('must check if name\'s survey already exists', function(done){
            request(apiUrl)
            .post('/surveys')
            .send({name : "Mon Sondage Test", username : "surveytest.surveytest"})
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(0);
                expect(res.body.message).to.equal("Error : Survey's name already exists");
                done();
            });
        });
    });
    
    describe(".getSurveys()", function(){
        it('must return at least one survey', function(done){
            request(apiUrl)
            .get("/surveys")
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(1);
                expect(res.body.data).not.to.be.empty();
                done();
            });
        });
    });
    
    describe(".getSurvey()", function(){
        it('must return the survey', function(done){
           request(apiUrl)
           .get("/surveys/"+surveyTest)
           .end(function(err, res){
               if (err) return err;
               expect(res.body.success).to.equal(1);
               expect(res.body.data.name).to.equal(surveyName);
               done();
           });
        });
    });
    
    describe(".editSurvey()", function(){
        editSurvey("name", "SuperSodage");
        editSurvey("description", "Pour ou contre le Super Sondage ?");
    });
    
    describe(".deleteSurvey()", function(){
        it('must delete the survey', function(done){
            request(apiUrl)
           .delete("/surveys/"+surveyTest)
           .end(function(err, res){
               if (err) return err;
               expect(res.body.success).to.equal(1);
               done();
           });
        });
        
        it('must have delete the survey', function(done){
            request(apiUrl)
           .get("/surveys/"+surveyTest)
           .end(function(err, res){
               if (err) return err;
               expect(res.body.success).to.equal(0);
               done();
           });
        });
        
        it('must have delete the survey items', function(done){
            request(apiUrl)
           .get("/surveyItems/"+surveyTest)
           .end(function(err, res){
               if (err) return err;
               expect(res.body.success).to.equal(0);
               done();
           });
        });
        
        it('must have delete the survey votes', function(done){
            request(apiUrl)
           .get("/surveyVotes/"+surveyTest)
           .end(function(err, res){
               if (err) return err;
               expect(res.body.success).to.equal(0);
               done();
           });
        });
    });
    
    describe("End of test", function(){
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
        
        
function editSurvey(type, value){
    it('must edit the ' + type, function(done){
        var params = {}
        params[type] = value;
        
        request(apiUrl)
        .put('/surveys/' + surveyTest)
        .send(params)
        .end(function(err, res){
            if (err) return done(err);
            expect(res.body.data[type]).to.equal(value);
            done();
        });
    });
}
        