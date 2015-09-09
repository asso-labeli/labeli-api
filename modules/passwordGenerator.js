/**
 * @namespace PasswordGenerator
 * @author Florian Kauder
 */

var crypto = require('crypto');
var apiConf = require('../modules/apiConf');

module.exports.generateRandomString = generateRandomString;
module.exports.encryptPassword = encryptPassword;

/**
 * Encrypt the password<br>
 * <b>[Private Function]</b>
 * @memberof PasswordGenerator
 * @param {Express.Request} password - the password to encrypt
 * @param {Express.Response} privateKey - the key to use
 * @param {Function} usePassword - the function which will use the encrypted password
 */
function encryptPassword(password, privateKey, usePassword) {
    var passwordHash = undefined;

    crypto.pbkdf2(password, privateKey, apiConf.cryptIterations, apiConf.cryptLen, function (err, key) {
        if (!err) passwordHash = key.toString("base64");
        usePassword(passwordHash);
    });
}

/**
 * Generate a random string<br>
 * <b>[Private Function]</b>
 * @memberof PasswordGenerator
 * @param {Number} length - Length of the generated string
 * @return {String} the random String
 */
function generateRandomString(length) {
    var result = "";
    var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < length; i++)
        result += charset.charAt(Math.floor(Math.random() * charset.length));
    return result;
}
