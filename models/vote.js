var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var VoteSchema   = new Schema(
{
    value : Number,
    created : {type : Date, default : Date.now},
    lastEdited : {type : Date, default : Date.now},
    project : {type: mongoose.Schema.Types.ObjectId, ref: 'Project'},
    author : {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
});

module.exports = mongoose.model('Vote', VoteSchema);
