var expect = require('chai').expect,
    assert = require('chai').assert,
    should = require('chai').should();

var request = require('supertest');
var superagent = require('superagent');
var agent = superagent.agent();
var agentAdmin = superagent.agent();

var apiUrl = 'http://localhost:9010';

var projectTest = null;
var userTest = null;
var adminTest = null;
var messageTest = null;
var message2Test = null;
var messageContent = null;
var message2Content = null;

describe('Message', function () {
    describe('Preparation', function () {
        it('must create a new user', function (done) {
            request(apiUrl)
                .post('/users')
                .send({
                    firstName: 'messageTest',
                    lastName: 'messageTest',
                    email: 'something@email.com'
                })
                .end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(1);
                    userTest = res.body.data._id;
                    done();
                });
        });

        it('must logged the user', function (done) {
            request(apiUrl)
                .post('/auth')
                .send({
                    username: "messagetest.messagetest",
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

        it('must create a new project', function (done) {
            request(apiUrl)
                .post('/projects')
                .send({
                    name: "Message Module Test",
                    type: 0,
                    authorUsername: "messagetest.messagetest"
                })
                .end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(1);
                    projectTest = res.body.data._id;
                    done();
                });
        });
    });

    describe('.createMessage()', function () {
        it('must need a content', function (done) {
            request(apiUrl)
                .post('/messages/42')
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.message).to.equal("Error : No content given");
                    expect(res.body.success).to.equal(0);
                    done();
                });
        });

        it('must need to be logged', function (done) {
            request(apiUrl)
                .post('/messages/42')
                .send({
                    content: "No"
                })
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.message).to.equal("Error : Not logged");
                    expect(res.body.success).to.equal(0);
                    done();
                });
        });

        it('must check the project given', function (done) {
            var req = request(apiUrl)
                .post('/messages/42');
            agent.attachCookies(req);
            req.send({
                content: "No",
            }).end(function (err, res) {
                if (err) return done(err);
                expect(res.body.success).to.equal(0);
                expect(res.body.message).to.equal("Error : Project not found");
                done();
            });
        });

        it('must create a new Message with good informations with user', function (done) {
            var req = request(apiUrl)
                .post('/messages/' + projectTest);
            agent.attachCookies(req);
            req.send({
                content: "No",
            }).end(function (err, res) {
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

        it('must create a new Message with good informations with admin', function (done) {
            var req = request(apiUrl)
                .post('/messages/' + projectTest);
            agentAdmin.attachCookies(req);
            req.send({
                content: "No by admin",
            }).end(function (err, res) {
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                expect(res.body.data.content).to.equal('No by admin');
                expect(res.body.data.project).to.equal(projectTest);
                expect(res.body.data.author).to.equal(adminTest);
                message2Test = res.body.data._id;
                message2Content = res.body.data.content;
                done();
            });
        });
    })

    describe('.getMessages()', function () {
        it('must get messages with not-registered rights', function (done) {
            request(apiUrl)
                .get('/messages/' + projectTest)
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(1);
                    done();
                });
        });
    });

    describe('.getMessage()', function () {
        it('must return the message (with id param) with not-registered rights', function (done) {
            request(apiUrl)
                .get('/message/' + messageTest)
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(1);
                    expect(res.body.data.content).to.equal(messageContent);
                    done();
                });
        });
    });
    describe('.editMessage()', function () {
        it('guest cannot edit a message', function (done) {
            request(apiUrl)
                .put('/message/' + messageTest)
                .send({
                    content: "Coucou"
                })
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(0);
                    expect(res.body.message).to.equal("Error : You're not the owner of this message");
                    done();
                });
        });

        it('user can edit his message', function (done) {
            var req = request(apiUrl)
                .put('/message/' + messageTest);
            agent.attachCookies(req);
            req.send({
                content: "Coucou"
            }).end(function (err, res) {
                if (err) return done(err);
                expect(res.body.data.content).to.equal("Coucou");
                done();
            });
        });

        it('user cannot edit someone\'s message', function (done) {
            var req = request(apiUrl)
                .put('/message/' + message2Test);
            agent.attachCookies(req);
            req.send({
                content: "Coucou"
            }).end(function (err, res) {
                if (err) return done(err);
                expect(res.body.success).to.equal(0);
                expect(res.body.message).to.equal("Error : You're not the owner of this message");
                done();
            });
        });

        it('admin can edit user\'s message', function (done) {
            var req = request(apiUrl)
                .put('/message/' + messageTest);
            agentAdmin.attachCookies(req);
            req.send({
                content: "Cool"
            }).end(function (err, res) {
                if (err) return done(err);
                expect(res.body.data.content).to.equal("Cool");
                done();
            });
        });
    });


    describe('.deleteMessage()', function () {
        it('guest cannot delete a message', function (done) {
            request(apiUrl)
                .delete('/message/' + messageTest)
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(0);
                    expect(res.body.message).to.equal("Error : You're not the owner of this message");
                    done();
                });
        });

        it('user can delete his message', function (done) {
            var req = request(apiUrl)
                .delete('/message/' + messageTest);
            agent.attachCookies(req);
            req.end(function (err, res) {
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                done();
            });
        });

        it('user cannot delete someone\'s message', function (done) {
            var req = request(apiUrl)
                .delete('/message/' + message2Test);
            agent.attachCookies(req);
            req.end(function (err, res) {
                if (err) return done(err);
                expect(res.body.success).to.equal(0);
                expect(res.body.message).to.equal("Error : You're not the owner of this message");
                done();
            });
        });
        
        it('admin can delete messages', function (done) {
            var req = request(apiUrl)
                .delete('/message/' + message2Test);
            agentAdmin.attachCookies(req);
            req.end(function (err, res) {
                if (err) return done(err);
                expect(res.body.success).to.equal(1);
                done();
            });
        });

        it('must be deleted', function (done) {
            request(apiUrl)
                .get('/message/' + messageTest)
                .end(function (err, res) {
                    if (err) return done(err);
                    expect(res.body.success).to.equal(0);
                    done();
                });
        });
    });

    describe('End of test', function () {
        it('must logout the current user', function (done) {
            var req = request(apiUrl).delete('/auth')
            agent.attachCookies(req);
            req.end(function (err, res) {
                if (err) return err;
                expect(res.body.success).to.equal(1);
                done();
            });
        });

        it('must delete the user test', function (done) {
            request(apiUrl)
                .delete('/users/' + userTest)
                .end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(1);
                    done();
                });
        });
        
        it('must logout the current admin', function (done) {
            var req = request(apiUrl).delete('/auth')
            agentAdmin.attachCookies(req);
            req.end(function (err, res) {
                if (err) return err;
                expect(res.body.success).to.equal(1);
                done();
            });
        });

        it('must delete the admin test', function (done) {
            request(apiUrl)
                .delete('/users/' + adminTest)
                .end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(1);
                    done();
                });
        });

        it('must delete the project test', function (done) {
            request(apiUrl)
                .delete('/projects/' + projectTest)
                .end(function (err, res) {
                    if (err) return err;
                    expect(res.body.success).to.equal(1);
                    done();
                });
        });
    });

});