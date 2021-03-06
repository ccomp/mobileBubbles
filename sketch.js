// P5 STUFF
var socket = io.connect();
var game;
var player = null;

// we gotta think about broadphase collision
// to-do for tomorrow:
// generate orb goodies to collect and test player pickups
// server stuff:
// draw other players
// do this by sending player data to socket upon player creation
// or maybe by sending the entire instance to the server
// regardless, check pongish for how to do this
// then find a way to deal with particle list server-wide

function setup() {
	game = new instance(600, 480);
	canvas = createCanvas(game.screenWidth, game.screenHeight);
	canvas.parent("canvas");
}

function draw() {
	var hit = false;
	background("white");
	game.package = game.unpackager(game.package);

	if (keyIsDown(LEFT_ARROW) && (player.x - 10 >= 0)) {
		player.x -= 10;
	}

	if (keyIsDown(RIGHT_ARROW) && (player.x + 10 < 600)) {
		player.x += 10;
	}

	if (keyIsDown(UP_ARROW) && (player.y - 10 >= 0)) {
		player.y -= 10;
	}

	if (keyIsDown(DOWN_ARROW) && (player.y + 10 < 480)) {
		player.y += 10;
	}

	for (var i = 0; i < game.playerList.length; i++) {
		// for (var x = 0; x < game.playerList.length; x++) {
		// 	if (game.playerList[x] != game.playerList[i]) {
		// 	    hit = collideCircleCircle(game.playerList[i].x, game.playerList[i].y , game.playerList[i].size, game.playerList[x].x, game.playerList[x].y , game.playerList[x].size);
		// 	    // if (hit) {


		// 	    // 	// if (game.playerList[i].size >= game.playerList[x].size) {

		// 	    // 	// 	// game.playerList[i].eatPlayer(game.playerList[x].size, game.playerList[x].points);
		// 		   //  // 	// game.playerList.splice(x, 1);
		// 	    // 	// }
		// 	    // }
		// 	}
		// }
		game.playerList[i].display();
	}
	socket.emit('playerState', player);
}


function randomWholeNum(range) {
	return Math.floor(Math.random() * range);
}

function init() {

	function handleOrientation(event) {
		alpha = Math.floor(event.alpha);
		beta = Math.floor(event.beta);
		gamma = Math.floor(event.gamma);

		// send values to the DOM so that we can see them
		// document.getElementById('alpha').innerHTML = alpha;
		// document.getElementById('beta').innerHTML = beta;
		// document.getElementById('gamma').innerHTML = gamma;

		game.zOrientation = alpha;
		game.yOrientation = beta;
		game.xOrientation = gamma;

		if (player != null) player.update(game.xOrientation, game.yOrientation, 600, 480);

	}
	window.addEventListener("deviceorientation", handleOrientation, true);

	window.addEventListener("touchstart", function(){
		if (player != null) {
			var colour = getRandomColor();
			fill(colour);
			ellipse(player.x, player.y, player.size, player.size);
			var json = {
				'x': player.x,
				'y': player.y,
				'size': player.size,
				'color': colour
			};
			socket.emit('ellipseMake', json);
			player.size += 10;
		}
	}, true);
}

function keyPressed() {
	if (keyCode === 32) {
		if (player != null) {
			var colour = getRandomColor();
			fill("green");
			ellipse(player.x, player.y, player.size, player.size);
			var json = {
				'x': player.x,
				'y': player.y,
				'size': player.size,
				'color': colour
			};
			socket.emit('ellipseMake', json);
			player.size += 10;
		}
	}
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function Player(x, y, color)
{
	this.id = "";
	this.x = x;
	this.y = y;
	this.size = 50;
	this.color = color;
	this.points = 0;

	this.eatPlayer = function(size, points)
	{
		this.size += size;
		this.points += points;
	}

	this.eatOrb = function()
	{
		this.size += 10;
		this.points += 10;
	}

	this.update = function(xO, yO, sWidth, sHeight)
	{
		if (xO > 90) xO = 90;
		else if (xO < -90) xO = -90;
		else if (yO > 90) yO = 90;
		else if (yO < -90) yO = -90;

		var xx = Math.floor(xO/5);
		var yy = Math.floor(yO/2);

		if (this.x + xx > sWidth || 
			this.x + xx < 0) {
			return;
		} else this.x += xx;

		if (this.y + yy > sHeight || this.y + yy < 0) return;
		else this.y += yy;
	}

	this.display = function()
	{
		fill(this.color);
		ellipse(this.x, this.y, this.size, this.size);
	}
}

function Orb(x, y) 
{
	this.x = x;
	this.y = y;
	this.size = 20;
	this.color = "yellow";
}

function instance(screenWidth, screenHeight) {
	this.zOrientation = 0;
	this.xOrientation = 0;
	this.yOrientation = 0;
	this.screenHeight = screenHeight;
	this.screenWidth = screenWidth;

	this.orbList = [];
	this.playerList = [];
	this.package = null;

	this.unpackager = function(data)
	{
		if (data != null) 
		{
			var newPlayer = new Player(data.x, data.y, data.color);
			newPlayer.size = data.size;
			newPlayer.color = "red";
			newPlayer.points = data.points;
			newPlayer.id = data.id;
			this.playerList.push(newPlayer);
			console.log(this.playerList);
		}
		return null;
	}

}

socket.on('connect', function() {
	console.log("Connected");
	var x = randomWholeNum(width);
	var y = randomWholeNum(height);
	player = new Player(x, y, "blue");
	player.id = socket.id;
	game.playerList.push(player);

	socket.emit('playerJoin', player);
});

socket.on('otherPlayerJoin', function(data) {
	console.log('new player');
	game.package = data;
});

socket.on('playerUpdate', function(data) {
	if (data == null) return;
	var finder = false;
	var otherPlayer = data;
	for (var i = 0; i < game.playerList.length; i++) {
		if (game.playerList[i].id == otherPlayer.id && player.id != otherPlayer.id){
			finder = true;
			game.playerList[i].x = otherPlayer.x;
			game.playerList[i].y = otherPlayer.y;
			game.playerList[i].size = otherPlayer.size;
			game.playerList[i].points = otherPlayer.points;
		}
	}
	if (!finder && player.id != otherPlayer.id) game.package = otherPlayer;
});

socket.on('otherEllipse', function(data) {
	fill(data.color);
	ellipse(data.x, data.y, data.size, data.size);
});


window.addEventListener('load', init);