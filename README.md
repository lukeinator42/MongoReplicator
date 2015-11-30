# 4660 NoteSync App

This is a project for 4660. It is a node.js server that replicates mongodb databases in a peer-to-peer network. It provides an api for creating, updating, deleting and getting notes, as well as viewing the log of changes. 

## Installation

To use install node.js and dependencies found in server.js

## Usage

To start a server, pass three parameters like so:
node server.js <database_port> <node_port> <peer_node_port>

example starting 2 servers:
node server.js 27017 8080 8081
node server.js 27018 8081 8080

## Routes

- get '/': returns html of all the notes currently in the database, as well as a form to add new notes to the app.
- get '/docs': a route that returns all documents in the database in json format. 
- get '/log/:id': a route that returns all logs greater than the id parameter in the url. Also in json format.
- get '/viewLog': returns entire log formatted in html.
- get '/log': returns entire log in json format. 
- get '/doc/:id': returns the note specified by the id in url parameter as json document. 
- post '/doc': inserts new note into database. Takes note in json format as post data.
- delete '/doc/:id': deletes the note specified by the id url parameter from the database. 
- get '/sync': syncs the node with its peer node. 

### Credits
by Lukas Grasse for CPSC 4660. November 29, 2015
