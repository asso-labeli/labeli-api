var expect = require('chai').expect,
    assert = require('chai').assert,
    should = require('chai').should();

var request = require('supertest');

var apiUrl = 'http://localhost:9010';

var projectTest = null;
var userTest = null;
var voteTest = null;
var voteValue = null;
    
describe('Vote', function(){
    describe('Preparation', function(){
        it('must create a new user', function(done){
            request(apiUrl)
            .post('/users')
            .send({firstName : 'voteTest',
                  lastName : 'voteTest',
                  email : 'something@email.com'})
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(1);
                userTest = res.body.data._id;
                done();
            });
        });

        it('must create a new project', function(done){
            request(apiUrl)
            .post('/projects')
            .send({name : "Vote Module Test",
                   type : 0,
                   authorUsername : "votetest.votetest"})
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(1);
                projectTest = res.body.data._id;
                done();
            });
        });
    });
               
    describe('.createOrEditVote()', function(){
        it('must need a value', function(done){
            request(apiUrl)
            .post('/votes/42')
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.message).to.equal("Error : No value given");
                expect(res.body.success).to.equal(0);
                done();
            });
        });
        
        it('must need an author username', function(done){
            request(apiUrl)
            .post('/votes/42')
            .send({value : 1})
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.message).to.equal("Error : No authorUsername given");
                expect(res.body.success).to.equal(0);
                done();
            });
        });
        
        it('must check the project given', function(done){
            request(apiUrl)
            .post('/votes/42')
            .send({value : 1, authorUsername : "a"})
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.success).to.equal(0);
                expect(res.body.message).to.equal("Error : Project not found");
                done();
            });
        });
        
        it('must check the user given', function(done){
            request(apiUrl)
            .post('/votes/'+projectTest)
            .send({value : 1, authorUsername : "a"})
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.success).to.equal(0);
                expect(res.body.message).to.equal("Error : User not found");
                done();
            });
        });
        
        it ('must create a new Vote with good informations', function(done){
            request(apiUrl)
            .post('/votes/'+projectTest)
            .send({value : 1, authorUsername : "votetest.votetest"})
            .end(function(err, res){
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
        
        it('must edit the value', function(done){
            request(apiUrl)
            .post('/votes/'+projectTest)
            .send({value : -1, authorUsername : "votetest.votetest"})
            .end(function(err, res){
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
    })
    
    describe('.getVotes()', function(){        
        it('must have at least one vote', function(done){
            request(apiUrl)
            .get('/votes/'+projectTest)
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                done();
            });
        });
    });

    describe('.getVote()', function(){
        it('must return the vote (with id param)', function(done){
            request(apiUrl)
            .get('/vote/' + voteTest)
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                expect(res.body.data.value).to.equal(voteValue);
                done();
            });
        });
    });

    describe('.deleteVote()', function(){
        it('must delete the testVote', function(done){
            request(apiUrl)
            .delete('/vote/' + voteTest)
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                done();
            });
        });

        it('must be deleted', function(done){
            request(apiUrl)
            .get('/vote/' + voteTest)
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.success).to.equal(0);
                done();
            });
        });
    });
    
    describe('End of test', function(){
        it ('must delete the user test', function(done){
            request(apiUrl)
            .delete('/users/'+userTest)
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(1);
                done();
            });
        });
        
        it ('must delete the project test', function(done){
            request(apiUrl)
            .delete('/projects/'+projectTest)
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(1);
                done();
            });
        });
    });

});