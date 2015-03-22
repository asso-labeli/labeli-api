var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

/** Level
* -1 : Guest
* 0 : Old Member
* 1 : Member
* 2 : 
* 3 : Administrator
* 4 : 
**/

var UserSchema   = new Schema(
{
    lastName : String,
    firstName : String,
    username : String,
    email : String,
    passwordHash : String,
    privateKey : String,
    picture : {type : String, default : null},
    level : {type : Number, default : 1},
    description : {type : String, default : ''},
    created : {type : Date, default : Date.now},
    birthday : {type : Date, default : new Date('01.01.1970T01:00')},
    universityGroup : {type : String, default : 'Inconnu'},
    website : {type : String, default : null}
});

module.exports = mongoose.model('User', UserSchema);

module.exports.Level = {};
module.exports.Level.Guest = -1;
module.exports.Level.OldMember = 0;
module.exports.Level.Member = 1;
module.exports.Level.Admin = 3;