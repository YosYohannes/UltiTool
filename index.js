var express = require('express');
var socket = require('socket.io');

// App setup
var app = express();
var server = app.listen(8000, function(){
    console.log('listening for requests on port 8000,');
});

// Static files
app.use(express.static('public'));

// Socket setup & pass server
var io = socket(server);
var width = 1500;
var height = 555;
var players = {};
var ball = new Ball();
var keysDown = {};
var mousePos = {};
var mouseClick = {};
var team = {};

// Player class
function Player(name) {
    this.name = name;
    this.x = 0.5*width;
    this.y = 0.5*height;
    this.size = 10;
    this.possess = 0;
    this.throwing = 0;
    this.directionX = 0;
    this.directionY = -1;
    this.speed = 2.25;
}

Player.prototype.move = function (x, y) {
    this.x += x*this.speed;
    this.y += y*this.speed;
};

Player.prototype.update = function () {
    var movX = 0;
    var movY = 0;
    if (this.possess == 1){
        var tempX = mousePos[this.name].x - this.x;
        var tempY = mousePos[this.name].y - this.y;
        dirLength = Math.sqrt(tempX*tempX + tempY*tempY);
        this.directionX = tempX/dirLength;
        this.directionY = tempY/dirLength;
        if(mouseClick[this.name] == 1)this.throwing = 1; 
    } else {
        this.size = 10;
        var tempKeys = keysDown[this.name];
        for (var key in tempKeys) {
            var value = Number(key);
            if (value == 65) {
                movX = -1;
            } else if (value == 68) {
                movX = 1;
            } else if (value == 87) {
                movY = -1;
            } else if (value == 83) {
                movY = 1;
            }
        }
    }
    var dirLength = Math.sqrt(movX*movX + movY*movY);
    if(dirLength <= 0){
        dirLength = 1;
    }
    this.move(movX/dirLength,movY/dirLength);
};

// Ball class
function Ball() {
    this.x = 0.5*width;
    this.y = 0.4*height;
    this.x_speed = 0;
    this.y_speed = 0;
}

Ball.prototype.update = function () {
    this.x += this.x_speed;
    this.y += this.y_speed;
    var top_x = this.x - 4.5;
    var top_y = this.y - 4.5;
    var bottom_x = this.x + 4.5;
    var bottom_y = this.y + 4.5;

    if (top_x < 0) {
        this.x = 5;
        this.x_speed = 0;
        this.y_speed = 0;
    } else if (bottom_x > width) {
        this.x = width-5;
        this.x_speed = 0;
        this.y_speed = 0;
    }
    if (top_y < 0) {
        this.y = 5;
        this.y_speed = 0;
        this.x_speed = 0;
    } else if (bottom_y > height) {
        this.y = height-5;
        this.x_speed = 0;
        this.y_speed = 0;
    }

    for (var id in players){
        var p = players[id];
        var xDisp = p.directionX;
        var yDisp = p.directionY;
        if (p.throwing == 1){
            if (top_y < (p.y + 3*p.size) && bottom_y > (p.y - 3*p.size) && top_x < (p.x + 3*p.size) && bottom_x > (p.x - 3*p.size)){
                this.x_speed = xDisp * 4.5;
                this.y_speed = yDisp * 4.5;  
            } else {
                p.throwing = 0;
            }
        } else if (top_y < (p.y + p.size) && bottom_y > (p.y - p.size) && top_x < (p.x + p.size) && bottom_x > (p.x - p.size)) {
            this.x_speed = 0;
            this.y_speed = 0;
            p.possess = 1;
            this.x = p.x + p.size * xDisp;
            this.y = p.y + p.size * yDisp;
        } else {
            p.possess = 0;
        }
    }
};

var update = function () {
    for (var id in players) players[id].update();
    ball.update();
};

io.on('connection', (socket) => {
    console.log('made socket connection ', socket.id);

    socket.on('keyDown', function(data){
    	var tempKeys = keysDown[data.userName];
    	if(tempKeys) tempKeys[data.key] = 1;
    	keysDown[data.userName] = tempKeys;
    });

    socket.on('keyUp', function(data){
    	var tempKeys = keysDown[data.userName];
    	if(tempKeys) delete tempKeys[data.key];
    	keysDown[data.userName] = tempKeys;
    });

    socket.on('mousePos', function(data){
    	mousePos[data.userName] = data.pos;
    });

    socket.on('mouseDown', function(data){
    	mouseClick[data.userName] = 1;
    });

    socket.on('mouseUp', function(data){
    	mouseClick[data.userName] = 0;
    });

    socket.on('newPlayer', function(data){
    	players[socket.id] = new Player(data.userName);
    	keysDown[data.userName] = {};
    	team[data.userName] = 1;
    });

    socket.on('changeTeam', function(data){
    	team[data.userName] = 1 - team[data.userName];
    });

    socket.on('disconnect', () =>{
    	console.log('removed connection ', socket.id);
    	try {
    		delete keysDown[players[socket.id].name];
    		delete players[socket.id];
    	} catch(err){}
    });
});

setInterval(gameloop, 16);
function gameloop(){
	update();
	io.sockets.emit('players', players);
	io.sockets.emit('ball', ball);
	io.sockets.emit('team', team);
}