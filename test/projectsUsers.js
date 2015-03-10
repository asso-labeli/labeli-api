var expect = require('chai').expect,
    assert = require('chai').assert,
    should = require('chai').should();

var request = require('supertest');

var apiUrl = 'http://localhost:9010';

var projectTest = null;
var userTest = null;
var projectUserTest = null;
var projectUserValue = null;
    
describe('ProjectUser', function(){
    describe('Preparation', function(){
        it('must create a new user', function(done){
            request(apiUrl)
            .post('/users')
            .send({firstName : 'projectUserTest',
                  lastName : 'projectUserTest',
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
            .send({name : "ProjectUser Module Test",
                   type : 0,
                   authorUsername : "projectUsertest.projectUsertest"})
            .end(function(err, res){
                if (err) return err;
                expect(res.body.success).to.equal(1);
                projectTest = res.body.data._id;
                done();
            });
        });
    });
               
    describe('.createOrEditProjectUser()', function(){
        it('must need a value', function(done){
            request(apiUrl)
            .post('/projectUsers/42')
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.message).to.equal("Error : No value given");
                expect(res.body.success).to.equal(0);
                done();
            });
        });
        
        it('must need an author username', function(done){
            request(apiUrl)
            .post('/projectUsers/42')
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
            .post('/projectUsers/42')
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
            .post('/projectUsers/'+projectTest)
            .send({value : 1, authorUsername : "a"})
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.success).to.equal(0);
                expect(res.body.message).to.equal("Error : User not found");
                done();
            });
        });
        
        it ('must create a new ProjectUser with good informations', function(done){
            request(apiUrl)
            .post('/projectUsers/'+projectTest)
            .send({value : 1, authorUsername : "projectUsertest.projectUsertest"})
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                expect(res.body.data.value).to.equal(1);
                expect(res.body.data.project).to.equal(projectTest);
                expect(res.body.data.author).to.equal(userTest);
                projectUserTest = res.body.data._id;
                projectUserValue = res.body.data.value;
                done();
            });
        });
        
        it('must edit the value', function(done){
            request(apiUrl)
            .post('/projectUsers/'+projectTest)
            .send({value : -1, authorUsername : "projectUsertest.projectUsertest"})
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                expect(res.body.data.value).to.equal(-1);
                expect(res.body.data.project).to.equal(projectTest);
                expect(res.body.data.author).to.equal(userTest);
                projectUserTest = res.body.data._id;
                projectUserValue = res.body.data.value;
                done();
            });
        });
    })
    
    describe('.getProjectUsers()', function(){        
        it('must have at least one projectUser', function(done){
            request(apiUrl)
            .get('/projectUsers/'+projectTest)
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                done();
            });
        });
    });

    describe('.getProjectUser()', function(){
        it('must return the projectUser (with id param)', function(done){
            request(apiUrl)
            .get('/projectUser/' + projectUserTest)
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                expect(res.body.data.value).to.equal(projectUserValue);
                done();
            });
        });
    });

    describe('.deleteProjectUser()', function(){
        it('must delete the testProjectUser', function(done){
            request(apiUrl)
            .delete('/projectUser/' + projectUserTest)
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                done();
            });
        });

        it('must be deleted', function(done){
            request(apiUrl)
            .get('/projectUser/' + projectUserTest)
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