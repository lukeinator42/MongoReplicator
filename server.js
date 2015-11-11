var http = require('http');
var through = require('through2');

  var express = require('express');
    var app = express();
    
 function write (buffer, encoding, next) {
    this.push(buffer.toString().toUpperCase());
    next();
}

var stream = through(write);

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.post('/home', function(req, res) { 
        req.pipe(stream).pipe(res);
});

var server = app.listen(process.argv[2], function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at %s', port);
});