var expect = require('chai').expect,
    assert = require('chai').assert,
    should = require('chai').should();

var request = require('supertest');
var superagent = require('superagent');
var agent = superagent.agent();

var apiUrl = 'http://localhost:9010';

var userTest = null;
    
describe('Authentification', function(){
    describe('Preparation', function(){
        it('must create a new user', function(done){
            request(apiUrl)
            .post('/users')
            .send({firstName : 'authTest',
                  lastName : 'authTest',
                  email : 'something@email.com'})
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(1);
                userTest = res.body.data._id;
                done();
            });
        });
    });
    
    describe(".login()", function(){
        it('must need a username', function(done){
            request(apiUrl)
            .post('/auth')
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(0);
                expect(res.body.message).to.equal("Error : No username given");
                done();
            });
        });
        
        it('must need a password', function(done){
            request(apiUrl)
            .post('/auth')
            .send({username : "a"})
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(0);
                expect(res.body.message).to.equal("Error : No password given");
                done();
            });
        });
        
        it('must check the username', function(done){
            request(apiUrl)
            .post('/auth')
            .send({username : "a", password : "x"})
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(0);
                expect(res.body.message).to.equal("Error : User not found");
                done();
            });
        });
        
        it('must check the password', function(done){
            request(apiUrl)
            .post('/auth')
            .send({username : "authtest.authtest", password : "x"})
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(0);
                expect(res.body.message).to.equal("Error : Bad combinaison username/password");
                done();
            });
        });
        
        it('must log the user', function(done){
            request(apiUrl)
            .post('/auth')
            .send({username : "authtest.authtest", password : '098f6bcd4621d373cade4e832627b4f6'})
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(1);
                expect(res.body.message).to.equal("Authentification successfull");
                expect(res.body.data._id).to.equal(userTest);
                agent.saveCookies(res);
                done();
            });
        });
    });
    
    describe(".getSession()", function(){
        it('must return an opened session', function(done){
            var req = request(apiUrl).get('/auth');
            agent.attachCookies(req);
            req.end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(1);
                expect(res.body.data._id).to.equal(userTest);
                done();
            });
        });
    });
    
    describe(".logout()", function(){
        it('must logout the current user', function(done){
            var req = request(apiUrl).delete('/auth')
            agent.attachCookies(req);
            req.end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(1);
                done();
            });
        });
        
        it('must have logout the current user', function(done){
            var req = request(apiUrl).get('/auth')
            agent.attachCookies(req);
            req.end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(0);
                done();
            });
        });
    });
    
    describe("End of test", function(){
        it ('must delete the test user', function(done){
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