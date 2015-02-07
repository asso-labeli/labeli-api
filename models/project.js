var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var ProjectSchema   = new Schema(
{
    name : String,
    id : String,
    picture : String,
    type : String,
    description : String,
    created : Date,
});

module.exports = mongoose.model('Project', ProjectSchema);
