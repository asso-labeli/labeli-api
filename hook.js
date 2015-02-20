var gith = require('gith').create(9001);

var execFile = require('child_process').execFile;

gith({
	repo: 'asso-labeli/labeli-api'
}).on('all', function(payload){
    if(payload.branch === 'master')
        execFile('./hook.sh');
});