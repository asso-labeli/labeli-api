var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var SurveySchema   = new Schema(
{
    description : String,
    name : String,
    created : {type : Date, default : Date.now},
    lastEdited : {type : Date, default : Date.now},
    author : {type: mongoose.Schema.Types.ObjectId, ref : "User"}
});

module.exports = mongoose.model('Survey', MessageSchema);
