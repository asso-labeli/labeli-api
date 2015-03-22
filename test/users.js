var expect = require('chai').expect,
    assert = require('chai').assert,
    should = require('chai').should();

var request = require('supertest');
var superagent = require('superagent');
var agent = superagent.agent();
var agent2 = superagent.agent();
var agentAdmin = superagent.agent();

var apiUrl = 'http://localhost:9010';
var userTest = null;
var user2Test = null;
var username = null;
var adminTest = null;

describe('User', function () {
    describe('Preparation', function () {
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
    });

    describe('.createUser()', function () {
        it('must need to be logged', function (done) {
            request(apiUrl)
                .post('/users')
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.message).to.equal("Error : Not logged");
                    done();
                });
        });

        it('must need a firstName', function (done) {
            var req = request(apiUrl).post('/users');
            agentAdmin.attachCookies(req);
            req.end(function (err, res) {
                if (err) return done(err);
                expect(res.body.message).to.equal("Error : No firstName given");
                done();
            });
        });

        it('must need a lastName', function (done) {
            var req = request(apiUrl).post('/users');
            agentAdmin.attachCookies(req);
            req.send({
                    firstName: 'testFirstName'
                })
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.message).to.equal("Error : No lastName given");
                    done();
                });
        });

        it('must need a email', function (done) {
            var req = request(apiUrl).post('/users');
            agentAdmin.attachCookies(req);
            req.send({
                    firstName: 'testFirstName',
                    lastName: 'testLastName'
                })
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.message).to.equal("Error : No email given");
                    done();
                });
        });

        it('must create a new User with good informations', function (done) {
            var req = request(apiUrl).post('/users');
            agentAdmin.attachCookies(req);
            req.send({
                    firstName: 'testFirstName',
                    lastName: 'testLastName',
                    email: 'test@test.com'
                })
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(1);
                    userTest = res.body.data._id;
                    username = res.body.data.username;
                    done();
                });
        });

        it('must logged the user', function (done) {
            request(apiUrl)
                .post('/auth')
                .send({
                    username: "testfirstname.testlastname",
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

        it('must need admin rights', function (done) {
            var req = request(apiUrl).post('/users');
            agent.attachCookies(req);
            req.send({
                    firstName: 'testFirstName2',
                    lastName: 'testLastName2',
                    email: 'test2@test.com'
                })
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(0);
                    expect(res.body.message).to.equal("Error : You're not an admin");
                    done();
                });
        });

        it('must create a second new User with good informations', function (done) {
            var req = request(apiUrl).post('/users');
            agentAdmin.attachCookies(req);
            req.send({
                    firstName: 'testFirstNameSecond',
                    lastName: 'testLastNameSecond',
                    email: 'test@test.com'
                })
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(1);
                    user2Test = res.body.data._id;
                    done();
                });
        });

        it('must logged the second user', function (done) {
            request(apiUrl)
                .post('/auth')
                .send({
                    username: "testfirstnamesecond.testlastnamesecond",
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
    })

    describe('.getUsers()', function () {
        it('must have at least a user', function (done) {
            request(apiUrl)
                .get('/users')
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(1);
                    done();
                });
        });
    });

    describe('.getUser()', function () {
        it('must return the user (with id)', function (done) {
            request(apiUrl)
                .get('/users/' + userTest)
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.data.firstName).to.equal('testFirstName');
                    done();
                });
        });

        it('must return the user (with username)', function (done) {
            request(apiUrl)
                .get('/users/' + username)
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.data.firstName).to.equal('testFirstName');
                    done();
                });
        });
    });

    describe('.editUser()', function () {
        editUser('firstName', "Bob");
        editUser('lastName', "Eponge");
        editUser('email', "bob.eponge@email.com");
        editUser('website', "bob.eponge.com");
        editUser('universityGroup', "notFound");
        editUserDate('birthday', "02-02-2015");
        editUser('description', "MyDescription");
        editUser('picture', "picture.png");

        it('admin can edit user\'s information', function (done) {
            var req = request(apiUrl)
                .put('/users/' + userTest);
            agentAdmin.attachCookies(req);
            req.send({
                    firstName: "Bobby"
                })
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.data.firstName).to.equal("Bobby");
                    done();
                });
        });

        it('user cannot edit other user\s informations', function (done) {
            var req = request(apiUrl)
                .put('/users/' + userTest);
            agent2.attachCookies(req);
            req.send({
                    firstName: "Loki"
                })
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(0);
                    expect(res.body.message).to.equal("Error : You're not an admin");
                    done();
                });
        });

        it('guest cannot edit other user\s informations', function (done) {
            var req = request(apiUrl)
                .put('/users/' + userTest);
            req.send({
                    firstName: "Loki"
                })
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(0);
                    expect(res.body.message).to.equal("Error : You're not an admin");
                    done();
                });
        });

    });

    describe('.deleteUser()', function () {
        it('must logout the current userTest', function (done) {
            var req = request(apiUrl).delete('/auth')
            agent.attachCookies(req);
            req.end(function (err, res) {
                if (err) return err;
                expect(res.body.success).to.equal(1);
                done();
            });
        });

        it('guest cannot delete a user', function (done) {
            request(apiUrl)
                .delete('/users/' + userTest)
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(0);
                    expect(res.body.message).to.equal("Error : You're not an admin");
                    done();
                });
        });

        it('user cannot delete himself', function (done) {
            var req = request(apiUrl)
                .delete('/users/' + user2Test);
            agent2.attachCookies(req);
            req.end(function (err, res) {
                if (err) return done(err);
                expect(res.body.success).to.equal(0);
                expect(res.body.message).to.equal("Error : You're not an admin");
                done();
            });
        });

        it('admin can delete user', function (done) {
            var req = request(apiUrl)
                .delete('/users/' + userTest);
            agentAdmin.attachCookies(req);
            req.end(function (err, res) {
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                done();
            });
        });

        it('must be deleted', function (done) {
            request(apiUrl)
                .get('/users/' + userTest)
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(0);
                    done();
                });
        });
    });

    describe('End of test', function () {
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

})

function editUser(type, value) {
    it('must edit the ' + type, function (done) {
        var params = {}
        params[type] = value;

        var req = request(apiUrl)
            .put('/users/' + userTest);
        agent.attachCookies(req);
        req.send(params)
            .end(function (err, res) {
                if (err) return done(err);
                expect(res.body.data[type]).to.equal(value);
                done();
            });
    });
}

function editUserDate(type, value) {
    it('must edit the ' + type, function (done) {
        var params = {}
        params[type] = value;

        var req = request(apiUrl)
            .put('/users/' + userTest);
        agent.attachCookies(req);
        req.send(params)
            .end(function (err, res) {
                if (err) return done(err);
                expect(new Date(res.body.data[type]).toDateString()).to.equal(new Date(value).toDateString());
                done();
            });
    });
}