var expect = require('chai').expect,
    assert = require('chai').assert,
    should = require('chai').should();

var request = require('supertest');
var superagent = require('superagent');
var agent = superagent.agent();
var agent2 = superagent.agent();
var agentAdmin = superagent.agent();

var apiUrl = 'http://localhost:9010';

var projectTest = null;
var projectName = null;
var projectUserTest = null;
var adminTest = null;
var userTest = null;
var user2Test = null;

describe('Project', function () {
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

        it('must create a new test user', function (done) {
            var req = request(apiUrl).post('/users');
            agentAdmin.attachCookies(req);
            req.send({
                    firstName: 'projectTest',
                    lastName: 'projectTest',
                    email: 'something@email.com'
                })
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(1);
                    userTest = res.body.data._id;
                    done();
                });
        });

        it('must logged the test user', function (done) {
            request(apiUrl)
                .post('/auth')
                .send({
                    username: "projecttest.projecttest",
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

        it('must create a second new test user', function (done) {
            var req = request(apiUrl).post('/users');
            agentAdmin.attachCookies(req);
            req.send({
                    firstName: 'projectTest2',
                    lastName: 'projectTest2',
                    email: 'something@email.com'
                })
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(1);
                    user2Test = res.body.data._id;
                    done();
                });
        });

        it('must logged the second test user', function (done) {
            request(apiUrl)
                .post('/auth')
                .send({
                    username: "projecttest2.projecttest2",
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
    });

    describe('.createProject()', function () {
        it('must need to be logged', function (done) {
            request(apiUrl)
                .post('/projects')
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.message).to.equal("Error : Not logged");
                    expect(res.body.success).to.equal(0);
                    done();
                });
        });

        it('must need to be admin', function (done) {
            var req = request(apiUrl).post('/projects');
            agent.attachCookies(req);
            req.end(function (err, res) {
                if (err) return done(err);
                expect(res.body.message).to.equal("Error : You're not an admin");
                expect(res.body.success).to.equal(0);
                done();
            });
        });

        it('must need a name', function (done) {
            var req = request(apiUrl).post('/projects');
            agentAdmin.attachCookies(req);
            req.end(function (err, res) {
                if (err) return done(err);
                expect(res.body.message).to.equal("Error : No name given");
                expect(res.body.success).to.equal(0);
                done();
            });
        });

        it('must need a type', function (done) {
            var req = request(apiUrl).post('/projects');
            agentAdmin.attachCookies(req);
            req.send({
                    name: 'ProjetTest'
                })
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.message).to.equal("Error : No type given");
                    expect(res.body.success).to.equal(0);
                    done();
                });
        });

        it('must need an author username', function (done) {
            var req = request(apiUrl).post('/projects');
            agentAdmin.attachCookies(req);
            req.send({
                    name: 'ProjetTest',
                    type: 1
                })
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.message).to.equal("Error : No authorUsername given");
                    expect(res.body.success).to.equal(0);
                    done();
                });
        });

        it('must test the author username', function (done) {
            var req = request(apiUrl).post('/projects');
            agentAdmin.attachCookies(req);
            req.send({
                    name: 'ProjetTest',
                    type: 1,
                    authorUsername: "impossible"
                })
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.message).to.equal("Error : authorUsername not found");
                    expect(res.body.success).to.equal(0);
                    done();
                });
        });

        it('must create a new Project with good informations', function (done) {
            var req = request(apiUrl).post('/projects');
            agentAdmin.attachCookies(req);
            req.send({
                    name: 'ProjetTest',
                    type: 1,
                    authorUsername: 'projecttest.projecttest'
                })
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(1);
                    expect(res.body.data.name).to.equal('ProjetTest');
                    expect(res.body.data.type).to.equal(1);
                    expect(res.body.data.author).to.equal(userTest);
                    projectTest = res.body.data._id;
                    projectName = res.body.data.name;
                    done();
                });
        });

        it('must have create a new ProjectUser with project and author', function (done) {
            request(apiUrl)
                .get('/projectUsers/' + projectTest)
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(1);
                    expect(res.body.data[0].author).to.equal(userTest);
                    expect(res.body.data[0].level).to.equal(2);
                    projectUserTest = res.body.data._id;
                    done();
                });
        });
    })

    describe('.getProjects()', function () {
        it('must have at least one project', function (done) {
            request(apiUrl)
                .get('/projects')
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(1);
                    done();
                });
        });
    });

    describe('.getProject()', function () {
        it('must return the project (with id param)', function (done) {
            request(apiUrl)
                .get('/projects/' + projectTest)
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(1);
                    expect(res.body.data.name).to.equal(projectName);
                    done();
                });
        });
    });

    describe('.editProject()', function () {
        editProject('name', "NewName");
        editProject('status', 1);
        editProject('description', "Un Super projet");
        editProject('type', 2);

        it('admin can edit project\'s informations', function (done) {
            var req = request(apiUrl).put('/projects/' + projectTest);
            agentAdmin.attachCookies(req);
            req.send({
                    name: "AdminProject"
                })
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.data.name).to.equal("AdminProject");
                    done();
                });
        });

        it('user cannot edit someone\'s project\'s informations', function (done) {
            var req = request(apiUrl).put('/projects/' + projectTest);
            agent2.attachCookies(req);
            req.send({
                    name: "MyProject"
                })
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(0);
                    expect(res.body.message).to.equal("Error : You're not an admin");
                    done();
                });
        });

        it('guest cannot edit project\'s informations', function (done) {
            var req = request(apiUrl).put('/projects/' + projectTest);
            req.send({
                    name: "AProject"
                })
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(0);
                    expect(res.body.message).to.equal("Error : You're not an admin");
                    done();
                });
        });
    });


    describe('.deleteProject()', function () {
        it('guest cannot delete a project', function (done) {
            request(apiUrl)
                .delete('/projects/' + projectTest)
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(0);
                    expect(res.body.message).to.equal("Error : You're not an admin");
                    done();
                });
        });

        it('user cannot delete a project', function (done) {
            var req = request(apiUrl).delete('/projects/' + projectTest);
            agent.attachCookies(req);
            req.end(function (err, res) {
                if (err) return done(err);
                expect(res.body.success).to.equal(0);
                expect(res.body.message).to.equal("Error : You're not an admin");
                done();
            });
        });

        it('admin can delete the testProject', function (done) {
            var req = request(apiUrl).delete('/projects/' + projectTest);
            agentAdmin.attachCookies(req);
            req.end(function (err, res) {
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                done();
            });
        });

        it('must be deleted', function (done) {
            request(apiUrl)
                .get('/projects/' + projectTest)
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(0);
                    done();
                });
        });

        it('must have delete all ProjectUsers for this Project', function (done) {
            request(apiUrl)
                .get('/projectUsers/' + projectTest)
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.data).to.be.empty;
                    done();
                });
        });

        it('must have delete all Votes for this Project', function (done) {
            request(apiUrl)
                .get('/votes/' + projectTest)
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.data).to.be.empty;
                    done();
                });
        });

        it('must have delete all Messages for this Project', function (done) {
            request(apiUrl)
                .get('/messages/' + projectTest)
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.data).to.be.empty;
                    done();
                });
        });
    });

    describe('End of test', function () {
        it('must logout the userTest', function (done) {
            var req = request(apiUrl).delete('/auth')
            agent.attachCookies(req);
            req.end(function (err, res) {
                if (err) return err;
                expect(res.body.success).to.equal(1);
                done();
            });
        });

        it('must delete the test user', function (done) {
            var req = request(apiUrl)
                .delete('/users/' + userTest);
            agentAdmin.attachCookies(req);
            req.end(function (err, res) {
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                done();
            });
        });

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
});

function editProject(type, value) {
    it('must edit the ' + type, function (done) {
        var params = {}
        params[type] = value;

        var req = request(apiUrl).put('/projects/' + projectTest);
        agent.attachCookies(req);
        req.send(params)
            .end(function (err, res) {
                if (err) return done(err);
                expect(res.body.data[type]).to.equal(value);
                done();
            });
    });
}