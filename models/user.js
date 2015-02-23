var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

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
