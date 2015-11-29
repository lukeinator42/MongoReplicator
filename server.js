//includes
var http = require('http');
var through = require('through2');
var mongoose = require('mongoose');
var express = require('express');
var bodyParser = require('body-parser');
 var request = require('request');
var app = express();

//app config
app.use( bodyParser.json() );  
app.use(bodyParser.urlencoded({
  extended: true
}));
app.set('views', './views');
app.set('view engine', 'jade');

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


app.get('/', function (req, res) {
	Note.find().sort({title: 1}).exec(function (err, note) {
			if (err) return handleError(err);
			  res.render('index', { title: 'All Notes', docs: note });
		});
});

//display servers docs on homepage
app.get('/docs', function (req, res) {

	Note.find().exec(function (err, note) {
		if (err) return handleError(err);
		  res.json(note);
	});
});

//get logs that are more recent than parameter id
app.get('/log/:id', function (req, res) {
Log.find({logId: { $gt: req.params.id } }).exec(function (err, log) {
		if (err) return handleError(err);
		  res.json(log);
	});
});

//display log
app.get('/viewLog', function (req, res) {

	Log.find().exec(function (err, log) {
		if (err) return handleError(err);
		  res.render('log', { title: 'Log', logs: log });
	});
});

//display log
app.get('/log', function (req, res) {

	Log.find().exec(function (err, log) {
		if (err) return handleError(err);
		  res.json(log);
	});
});

app.get('/doc/:id', function (req, res) {
Note.find({_id: req.params.id }).exec(function (err, note) {
		if (err) return handleError(err);
		  res.json(note);
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

app.get('/sync', function (req, res) {
  	var syncIndex=-1;
  	var newMaxLogId=0;
  	SyncLog.findOne({serverId: process.argv[4]})
    .sort({maxLogId: -1})
    .exec(function(err, doc) { 
    	if(doc!=null)
    		syncIndex = doc.maxLogId;


    console.log("sync index: " + syncIndex);
	request.get('http://localhost:'+process.argv[4]+'/log/'+syncIndex, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
	    


	    var bodyObject = JSON.parse(body);
		res.render('log', { title: 'Log', logs: bodyObject });

	    bodyObject.forEach(function(item) {	
	    	newMaxLogId = Math.max(newMaxLogId, item.logId);

		    Log.findOne({_id: item.objectId})
		    .sort({logId: -1})
		    .exec(function(err, doc) {
			    //console.log(item);
			    //console.log(doc);
			    if(doc==null
			    	||(item.timestamp>doc.timestamp)
			    	||(item.timestamp==doc.timestamp&&item.version>doc.item)
			    	||(item.timestamp==doc.timestamp&&item.version==doc.item&&item.random>doc.random)) {
			    	request.get('http://localhost:'+process.argv[4]+'/doc/'+item.objectId, function (error, response, body) {
			    		body = body.replace('[','');
			    		body = body.replace(']','');
			    		
			    		

			    		if((item.eventType=="Insert" || item.eventType=="Sync") && body.length>2) {
			    			var insertObject = JSON.parse(body);
			    			var id = insertObject._id;
			    			delete insertObject._id;

			    			if (id) {
    							Note.update({_id: id}, insertObject, {upsert: true}, function (err) {console.log(err);});
							} else {
								var note = new Note(insertObject);
								note.save(function (err) {
								  if (err) // ...
								  	res.send('error:' + err);
								  else
									res.send("success!" + note);
								});
							}

			    		} else if(item.eventType=="Delete" && body.length>2) {
			    			var insertObject = JSON.parse(body);
			    			var id = insertObject._id;

			    			if(id) {
			    				Note.remove({ _id: id }, function(err) {
								    if(err)
								    	console.log(err);
								});
			    			}
			    		}
			    	});
			    	
			    	//add log of sync action
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
												   objectId: item.objectId, 
												   eventType: "Sync", 
												   timestamp: item.timestamp, 
												   version: 1, 
												   random: Math.random()});

								log.save(function (err) {
								  if (err) // ...
								  	console.log('error:' + err);
								  else
									console.log("Sync logged" + log);
								});
						    }
						);
			    }	
		    });
	  	});
		var syncLog = new SyncLog({serverId: process.argv[4], maxLogId: newMaxLogId});
		syncLog.save(function (err) {
		  if (err) // ...
		  	console.log(err);
		  else
			console.log("new log id: " + newMaxLogId);
		});

	  }
	});
  });
});

app.get('/deleteAllLogs', function (req, res) {
	Log.remove({}, function(err) {
	if (err) // ...
	  	console.log(err);	
	});
	SyncLog.remove({}, function(err) {
	if (err) // ...
		console.log(err);
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
