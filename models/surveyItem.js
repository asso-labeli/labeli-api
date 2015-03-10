var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var SurveyItemSchema   = new Schema(
{
    name : String,
    created : {type : Date, default : Date.now},
    lastEdited : {type : Date, default : Date.now},
    survey : {type: mongoose.Schema.Types.ObjectId, ref : "Survey"}
});

module.exports = mongoose.model('SurveyItem', SurveyItemSchema);
