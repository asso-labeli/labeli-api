var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var UserSchema   = new Schema(
{
    lastName : String,
    firstName : String,
    username : String,
    passwordHash : String,
    privateKey : String,
    picture : String,
    level : String,
    description : String,
    created : Date,
    birthday : Date,
    universityGroup : String,
    website : String,
});

module.exports = mongoose.model('User', UserSchema);
