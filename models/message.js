var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var MessageSchema   = new Schema(
{
    content : {type : String, default : ''},
    created : {type : Date, default : Date.now},
    thread : {type: mongoose.Schema.Types.ObjectId, ref: 'Project'},
    author : {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
});

module.exports = mongoose.model('Message', ProjectSchema);
