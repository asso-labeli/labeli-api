var expect = require('chai').expect,
    assert = require('chai').assert,
    should = require('chai').should();

var request = require('supertest');

var apiUrl = 'http://localhost:8080';

var projectTest = null;
var projectName = null;
var userTest = null;
    
describe('Project', function(){
    describe('Preparation', function(){
        it ('must create a new test user', function(done){
            request(apiUrl)
            .post('/users')
            .send({firstName : 'Bob', 
                   lastName : 'Eponge', 
                   email : 'bob.eponge@email.com'})
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                userTest = res.body.data._id;
                done();
            });
        });
    });
    
    describe('.createProject()', function(){
        it('must need a name', function(done){
            request(apiUrl)
            .post('/projects')
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.message).to.equal("Error : No name given");
                expect(res.body.success).to.equal(0);
                done();
            });
        });
        
        it('must need a type', function(done){
            request(apiUrl)
            .post('/projects')
            .send({name : 'ProjetTest'})
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.message).to.equal("Error : No type given");
                expect(res.body.success).to.equal(0);
                done();
            });
        });
        
        it('must need an author username', function(done){
            request(apiUrl)
            .post('/projects')
            .send({name : 'ProjetTest', type : 1})
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.message).to.equal("Error : No authorUsername given");
                expect(res.body.success).to.equal(0);
                done();
            });
        });
        
        it('must test the author username', function(done){
            request(apiUrl)
            .post('/projects')
            .send({name : 'ProjetTest', type : 1, authorUsername : "impossible"})
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.message).to.equal("Error : authorUsername not found");
                expect(res.body.success).to.equal(0);
                done();
            });
        });
        
        it ('must create a new Project with good informations', function(done){
            request(apiUrl)
            .post('/projects')
            .send({name : 'ProjetTest', type : 1, authorUsername : 'bob.eponge'})
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                expect(res.body.data.name).to.equal('ProjetTest');
                expect(res.body.data.type).to.equal(1);
                expect(res.body.data.author.username).to.equal('bob.eponge');
                projectTest = res.body.data._id;
                projectName = res.body.data.name;
                done();
            });
        });
    })
    
    describe('.getProjects()', function(){        
        it('must have at least one project', function(done){
            request(apiUrl)
            .get('/projects')
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                done();
            });
        });
    });

    describe('.getProject()', function(){
        it('must return the project (with id param)', function(done){
            request(apiUrl)
            .get('/projects/' + projectTest)
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                expect(res.body.data.name).to.equal(projectName);
                done();
            });
        });
    });

    describe('.editProject()', function(){
        editProject('name', "NewName");
        editProject('status', 1);
        editProject('description', "Un Super projet");
        editProject('type', 2);
    });

    
    describe('.deleteProject()', function(){
        it('must delete the testProject', function(done){
            request(apiUrl)
            .delete('/projects/' + projectTest)
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                done();
            });
        });

        it('must be deleted', function(done){
            request(apiUrl)
            .get('/projects/' + projectTest)
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.success).to.equal(0);
                done();
            });
        });
    });
    
    describe('End of test', function(){
        it('must delete the test user', function(done){
            request(apiUrl)
            .delete('/users/' + userTest)
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                done();
            });
        });
    });
});

function editProject(type, value){
    it('must edit the ' + type, function(done){
        var params = {}
        params[type] = value;
        
        request(apiUrl)
        .put('/projects/' + projectTest)
        .send(params)
        .end(function(err, res){
            if (err) return done(err);
            expect(res.body.data[type]).to.equal(value);
            done();
        });
    });
}