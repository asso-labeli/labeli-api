var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport(smtpTransport({
    host: 'ssl0.ovh.net',
    port: 587,
    auth: {
        user: 'testweb@labeli.org',
        pass: 'PPcsuqHBTnmg3t2c'
    }
}));

function sendInscriptionMail(email, login, password){
    var mailOptionsForInscriptionMail = {
        from: 'Label[i] - Inscription <contact@labeli.org>', // sender address
        to: email, // list of receivers
        subject: 'Identifiants de connexion', // Subject line
        text: 'Bonjour, \n\nVoici vos identifiants :\n - Login : ' + login + '\n - Password : ' + password + '\n\nNous vous invitons à changer votre mot de passe à votre première connexion.\nPour vous connecter, rendez-vous sur la page de connexion de notre site (http://labeli.org/login).\n\nA bientôt !', // plaintext body
        html: 'Bonjour, <br><br>Voici vos identifiants :<br> - Login : ' + login + '<br> - Password : ' + password + '<br><br><b>Nous vous invitons à changer votre mot de passe à votre première connexion.</b><br>Pour vous connecter, rendez-vous sur <a href="http://labeli.org/login">la page de connexion de notre site</a>.<br><br>A bientôt !' // html body
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptionsForInscriptionMail, function(error, info){
        if(error){
            return console.log(error);
        }
        console.log('Inscription message sent: ' + info.response);

    });
}

function sendPasswordResetMail(email, login, password){
    var mailOptionsForInscriptionMail = {
        from: 'Label[i] - Récupération d\'identifiants <contact@labeli.org>',
        to: email,
        subject: 'Réinitialisation du mot de passe',
        text: 'Bonjour, \n\nVotre mot de passe a été réinitialisé par un administrateur.\n\nVoici donc vos nouveaux identifiants :\n - Login : ' + login + '\n - Password : ' + password + '\n\nNous vous invitons à changer votre mot de passe à votre prochaine connexion.\nPour vous connecter, rendez-vous sur la page de connexion de notre site (http://labeli.org/login).\n\nA bientôt !',
        html: 'Bonjour, <br><br>Votre mot de passe a été réinitialisé par un administrateur.<br><br>Voici donc vos nouveaux identifiants :<br> - Login : ' + login + '<br> - Password : ' + password + '<br><br><b>Nous vous invitons à changer votre mot de passe à votre prochaine connexion.</b><br>Pour vous connecter, rendez-vous sur <a href="http://labeli.org/login">la page de connexion de notre site</a>.<br><br>A bientôt !'
    };

    // send mail with defined transport object
    transporter.sendMail(mailOptionsForInscriptionMail, function(error, info){
        if(error){
            return console.log(error);
        }
        console.log('Message sent: ' + info.response);

    });
}

module.exports.sendInscriptionMail = sendInscriptionMail;
module.exports.sendPasswordResetMail = sendPasswordResetMail;
