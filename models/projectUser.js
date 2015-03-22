var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

/**
* Level
* 0 : Member
* 1 : Administrator
* 2 : Creator
**/

var ProjectUserSchema   = new Schema(
{
    created : {type : Date, default : Date.now},
    level : {type : Number, default : 0},
    author : {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    project : {type : mongoose.Schema.Types.ObjectId, ref: 'Project'}
});

module.exports = mongoose.model('ProjectUser', ProjectUserSchema);

module.exports.Level = {};
module.exports.Level.Member = 0;
module.exports.Level.Admin = 1;
module.exports.Level.Creator = 2;