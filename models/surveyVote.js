var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var SurveyVoteSchema   = new Schema(
{
    created : {type : Date, default : Date.now},
    lastEdited : {type : Date, default : Date.now},
    value : {type: mongoose.Schema.Types.ObjectId, ref : "SurveyItem"},
    user : {type: mongoose.Schema.Types.ObjectId, ref : "User"}
});

module.exports = mongoose.model('SurveyVote', SurveyVoteSchema);
