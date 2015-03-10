var expect = require('chai').expect,
    assert = require('chai').assert,
    should = require('chai').should();

var request = require('supertest');

var apiUrl = 'http://localhost:9010';

var projectTest = null;
var userTest = null;
var messageTest = null;
var messageContent = null;
    
describe('Message', function(){
    describe('Preparation', function(){
        it('must create a new user', function(done){
            request(apiUrl)
            .post('/users')
            .send({firstName : 'messageTest',
                  lastName : 'messageTest',
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
            .send({name : "Message Module Test",
                   type : 0,
                   authorUsername : "messagetest.messagetest"})
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(1);
                projectTest = res.body.data._id;
                done();
            });
        });
    });
               
    describe('.createMessage()', function(){
        it('must need a content', function(done){
            request(apiUrl)
            .post('/messages/42')
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.message).to.equal("Error : No content given");
                expect(res.body.success).to.equal(0);
                done();
            });
        });
        
        it('must need an author username', function(done){
            request(apiUrl)
            .post('/messages/42')
            .send({content : "No"})
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.message).to.equal("Error : No authorUsername given");
                expect(res.body.success).to.equal(0);
                done();
            });
        });
        
        it('must check the project given', function(done){
            request(apiUrl)
            .post('/messages/42')
            .send({content : "No", authorUsername : "a"})
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.success).to.equal(0);
                expect(res.body.message).to.equal("Error : Project not found");
                done();
            });
        });
        
        it('must check the user given', function(done){
            request(apiUrl)
            .post('/messages/'+projectTest)
            .send({content : "No", authorUsername : "a"})
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.success).to.equal(0);
                expect(res.body.message).to.equal("Error : User not found");
                done();
            });
        });
        
        it ('must create a new Message with good informations', function(done){
            request(apiUrl)
            .post('/messages/'+projectTest)
            .send({content : "No", authorUsername : "messagetest.messagetest"})
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                expect(res.body.data.content).to.equal('No');
                expect(res.body.data.project).to.equal(projectTest);
                expect(res.body.data.author).to.equal(userTest);
                messageTest = res.body.data._id;
                messageContent = res.body.data.content;
                done();
            });
        });
    })
    
    describe('.getMessages()', function(){        
        it('must have at least one message', function(done){
            request(apiUrl)
            .get('/messages/'+projectTest)
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                done();
            });
        });
    });

    describe('.getMessage()', function(){
        it('must return the message (with id param)', function(done){
            request(apiUrl)
            .get('/message/' + messageTest)
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                expect(res.body.data.content).to.equal(messageContent);
                done();
            });
        });
    });

    describe('.editMessage()', function(){
        it('must edit the content', function(done){
            request(apiUrl)
            .put('/message/' + messageTest)
            .send({content : "Coucou"})
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.data.content).to.equal("Coucou");
                done();
            });
        });
    });

    
    describe('.deleteMessage()', function(){
        it('must delete the testMessage', function(done){
            request(apiUrl)
            .delete('/message/' + messageTest)
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                done();
            });
        });

        it('must be deleted', function(done){
            request(apiUrl)
            .get('/message/' + messageTest)
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