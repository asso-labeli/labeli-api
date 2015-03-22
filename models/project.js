var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var ProjectSchema   = new Schema(
{
    name : String,
    picture : {type : String, default : null},
    type : {type : Number, default : 0},
    description : {type : String, default : ''},
    created : {type : Date, default : Date.now},
    lastEdited : {type : Date, default : Date.now},
    status : {type : Number, default : 0},
    author : {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
});

module.exports = mongoose.model('Project', ProjectSchema);

module.exports.Type = {};
module.exports.Type.Project = 0;
module.exports.Type.Event = 1;
module.exports.Type.Team = 2;

module.exports.Status = {};
module.exports.Status.Preparation = 0;
module.exports.Status.Vote = 1;
module.exports.Status.Working = 2;
module.exports.Status.Archived = 3;