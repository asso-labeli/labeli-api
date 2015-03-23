var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var SurveyVoteSchema   = new Schema(
{
    created : {type : Date, default : Date.now},
    lastEdited : {type : Date, default : Date.now},
    survey : {type: mongoose.Schema.Types.ObjectId, ref : "Survey"},
    // Value is equal to surveyItem concerned
    value : {type: mongoose.Schema.Types.ObjectId, ref : "SurveyItem"},
    author : {type: mongoose.Schema.Types.ObjectId, ref : "User"}
});

module.exports = mongoose.model('SurveyVote', SurveyVoteSchema);
