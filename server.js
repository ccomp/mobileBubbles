// HTTP PORTION

var http = require('http');
var fs = require('fs');
var httpServer = http.createServer(requestHandler);
var url = require('url');
httpServer.listen(8080);

function requestHandler(req, res) {

	var parsedUrl = url.parse(req.url);
	console.log("The Request is: " + parsedUrl.pathname);
		
	fs.readFile(__dirname + parsedUrl.pathname, 
		function (err, data) {
			if (err) {
				res.writeHead(500);
				return res.end('Error loading ' + parsedUrl.pathname);
			}
			res.writeHead(200);
			res.end(data);
  		}
  	);
  	
}


// WEBSOCKET PORTION

var io = require('socket.io').listen(httpServer);

io.on('connection', 

	function (socket) {
	
		console.log("We have a new client: " + socket.id);
		
		socket.on('playerJoin', function(data) {
			socket.broadcast.emit('otherPlayerJoin', data)
		});

		socket.on('disconnect', function() {
			console.log("Client has disconnected " + socket.id);
		});

		socket.on('playerState', function(player) {
			socket.broadcast.emit('playerUpdate', player);
		});

		socket.on('ellipseMake', function(data) {
			socket.broadcast.emit('otherEllipse', data);
		});
	}
);