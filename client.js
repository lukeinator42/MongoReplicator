 var request = require('request');
 var r = request.post('http://localhost:'+process.argv[2]+'/home');

 process.stdin.pipe(r).pipe(process.stdout);
