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

module.exports.Value = {};
module.exports.Value.Negative = -1;
module.exports.Value.Neutral = 0;
module.exports.Value.Positive = 1;
