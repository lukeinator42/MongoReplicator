//includes
var http = require('http');
var through = require('through2');
var mongoose = require('mongoose');
var express = require('express');
var bodyParser = require('body-parser')
var app = express();

//app config
app.use( bodyParser.json() );  
app.use(bodyParser.urlencoded({
  extended: true
}));

//mongodb and schemas
mongoose.connect('mongodb://localhost/'+process.argv[2]);

var Note = mongoose.model('Note', { title: String, note: String });

var Log = mongoose.model('Log', {logId: Number,
								 objectId: String, 
								 eventType: String, 
								 timestamp: Date, 
								 version: Number, 
								 random: Number});

var SyncLog = mongoose.model('SyncLog', {serverId: String, maxLogId: Number});


//display servers docs on homepage
app.get('/', function (req, res) {

	Note.find().exec(function (err, note) {
		if (err) return handleError(err);
		  res.send(note);
	});
});

//get logs that are more recent than parameter id
app.get('/log/:id', function (req, res) {
Log.find({logId: { $gt: req.params.id } }).exec(function (err, log) {
		if (err) return handleError(err);
		  res.send(log);
	});
});

//display log
app.get('/log', function (req, res) {

	Log.find().exec(function (err, log) {
		if (err) return handleError(err);
		  res.send(log);
	});
});

app.get('/doc/:id', function (req, res) {
Note.find({_id: req.params.id }).exec(function (err, note) {
		if (err) return handleError(err);
		  res.send(note);
	});
});

//post a doc to the server
app.post('/doc', function(req, res) { 
	console.log(req.body);

	//post doc
	var note = new Note(req.body);
	note.save(function (err) {
	  if (err) // ...
	  	res.send('error:' + err);
	  else
		res.send("success!" + note);
	});

	Log.findOne()
	    .sort({logId: -1})
	    .exec(function(err, doc)
	    {

	    	var newLogId;
	    	if(doc!=null)
	    	 	newLogId = doc.logId+1;
	    	 else
	    	 	newLogId = 0;
	        // ...
	        console.log(newLogId);

			//log posted doc
			var log = new Log({logId: newLogId, 
							   objectId: note._id, 
							   eventType: "Insert", 
							   timestamp: new Date, 
							   version: 1, 
							   random: Math.random()});

			log.save(function (err) {
			  if (err) // ...
			  	console.log('error:' + err);
			  else
				console.log("save logged" + log);
			});
	    }
	);
});

//delete a doc from the server
app.delete('/doc/:id', function(req, res) { 
	console.log(req.body);

	//delete doc
	Note.remove({_id: req.params.id }, function(err) {
	if (err) // ...
	  	res.send('error:' + err);
	else
		res.send("success!");
	});

	Log.findOne()
	    .sort({logId: -1})
	    .exec(function(err, doc)
	    {

	    	var newLogId;
	    	if(doc!=null)
	    	 	newLogId = doc.logId+1;
	    	 else
	    	 	newLogId = 0;
	        // ...
	        console.log(newLogId);

			//log posted doc
			var log = new Log({logId: newLogId, 
							   objectId: req.params.id, 
							   eventType: "Delete", 
							   timestamp: new Date, 
							   version: 1, 
							   random: Math.random()});

			log.save(function (err) {
			  if (err) // ...
			  	console.log('error:' + err);
			  else
				console.log("Delete logged" + log);
			});
	    }
	);
});

app.get('/deleteAllLogs', function (req, res) {
	Log.remove({}, function(err) {
	if (err) // ...
	  	res.send('error:' + err);
	else
		res.send("success!");
	});
});

app.get('/deleteAllNotes', function (req, res) {
	Note.remove({}, function(err) {
	if (err) // ...
	  	res.send('error:' + err);
	else
		res.send("success!");
	});
});

//server config
var server = app.listen(process.argv[3], function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('ReplicatorServer lisening at %s', port);
});
