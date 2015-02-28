var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var MessageSchema   = new Schema(
{
    content : String,
    created : {type : Date, default : Date.now},
    lastEdited : {type : Date, default : Date.now},
    thread : {type: mongoose.Schema.Types.ObjectId, ref: 'Project'},
    author : {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
});

module.exports = mongoose.model('Message', MessageSchema);
