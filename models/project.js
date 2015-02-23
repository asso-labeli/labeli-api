var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var ProjectSchema   = new Schema(
{
    name : String,
    picture : {type : String, default : null},
    type : {type : Number, default : 0},
    description : {type : String, default : ''},
    created : {type : Date, default : Date.now},
    status : {type : Number, default : 0},
    author : {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
});

module.exports = mongoose.model('Project', ProjectSchema);
