var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

/**
* Level
* 0 : Membre
* 1 : Administrateur
* 2 : Créateur
**/

var ProjectUserSchema   = new Schema(
{
    created : {type : Date, default : Date.now},
    value : {type : Number, default : 0},
    author : {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    thread : {type : mongoose.Schema.Types.ObjectId, ref: 'Project'}
});

module.exports = mongoose.model('ProjectUser', ProjectUserSchema);
