var expect = require('chai').expect,
    assert = require('chai').assert,
    should = require('chai').should();

var request = require('supertest');

var apiUrl = 'http://localhost:8080';

describe('User', function(){
    var userTest = null;
    var username = null;
    
    describe('.createUser()', function(){
        it('must need a firstName', function(done){
            request(apiUrl)
            .post('/users')
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.message).to.equal("Error : No firstName given !");
                done();
            });
        });
        
        it('must need a lastName', function(done){
            request(apiUrl)
            .post('/users')
            .send({firstName : 'test'})
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.message).to.equal("Error : No lastName given !");
                done();
            });
        });
        
        it('must need a email', function(done){
            request(apiUrl)
            .post('/users')
            .send({firstName : 'test', lastName : 'test'})
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.message).to.equal("Error : No email given !");
                done();
            });
        });
        
        it ('must create a new User with good informations', function(done){
            request(apiUrl)
            .post('/users')
            .send({firstName : 'test', lastName : 'test', email : 'test@test.com'})
            .end(function(err, res){
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                userTest = res.body.data._id;
                username = res.body.data.username;
                done();
            });
        });
    })
    
    after(function(){
        if (userTest != null){
            describe('.getUsers()', function(){        
                it('must have at least a user', function(done){
                    request(apiUrl)
                    .get('/users')
                    .end(function(err, res){
                        if (err) return done(err);
                        expect(res.body.success).to.equal(1);
                        done();
                    });
                });
            });

            describe('.getUser()', function(){
                it('must return the user (with id)', function(done){
                    request(apiUrl)
                    .get('/users/' + userTest)
                    .end(function(err, res){
                        if (err) return done(err);
                        expect(res.body.data.firstName).to.equal('test');
                        done();
                    });
                });
                
                it('must return the user (with username)', function(done){
                    request(apiUrl)
                    .get('/users/' + username)
                    .end(function(err, res){
                        if (err) return done(err);
                        expect(res.body.data.firstName).to.equal('test');
                        done();
                    });
                });
            });
            
            describe('.editUser()', function(){
                editUser(userTest, 'firstName', "Bob");
                editUser(userTest, 'lastName', "Eponge");
                editUser(userTest, 'email', "bob.eponge@email.com");
                editUser(userTest, 'website', "bob.eponge.com");
                editUser(userTest, 'universityGroup', "notFound");
                editUserDate(userTest, 'birthday', "02-02-2015");
                editUser(userTest, 'description', "MyDescription");
                editUser(userTest, 'picture', "picture.png");
            });

            describe('.deleteUser()', function(){
                it('must delete the testUser', function(done){
                    request(apiUrl)
                    .delete('/users/' + userTest)
                    .end(function(err, res){
                        if (err) return done(err);
                        expect(res.body.success).to.equal(1);
                        done();
                    });
                });
                
                it('must be deleted', function(done){
                    request(apiUrl)
                    .get('/users/' + userTest)
                    .end(function(err, res){
                        if (err) return done(err);
                        expect(res.body.success).to.equal(0);
                        done();
                    });
                });
            });
        }
    });
})

function editUser(user_id, type, value){
    it('must edit the ' + type, function(done){
        var params = {}
        params[type] = value;
        
        request(apiUrl)
        .put('/users/' + user_id)
        .send(params)
        .end(function(err, res){
            if (err) return done(err);
            expect(res.body.data[type]).to.equal(value);
            done();
        });
    });
}

function editUserDate(user_id, type, value){
    it('must edit the ' + type, function(done){
        var params = {}
        params[type] = value;
        
        request(apiUrl)
        .put('/users/' + user_id)
        .send(params)
        .end(function(err, res){
            if (err) return done(err);
            expect(new Date(res.body.data[type]).toDateString()).to.equal(new Date(value).toDateString());
            done();
        });
    });
}