var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var SurveySchema   = new Schema(
{
    description : String,
    name : String,
    state : {type : Number, default : 1},
    numberChoices : {type : Number, default : 1},
    created : {type : Date, default : Date.now},
    lastEdited : {type : Date, default : Date.now},
    author : {type: mongoose.Schema.Types.ObjectId, ref : "User"}
});

module.exports = mongoose.model('Survey', SurveySchema);

module.exports.State = {};
module.exports.State.IsOpened = 1;
module.exports.State.IsClosed = 0;

