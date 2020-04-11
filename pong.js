var animate = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function (callback) {
        window.setTimeout(callback, 1000 / 120)
    };
var canvas = document.createElement("canvas");
var width = 1000;
var height = 370;
canvas.width = width;
canvas.height = height;
var context = canvas.getContext('2d');
var player = new Player(0.18*width, 0.5*height, 10);
var defender = new Player(0.25*width,0.5*height, 10);
var ball = new Ball(0.2*width, 0.5*height);

var keysDown = {};
var mousePos = {x: 0, y: 0};
var mouseClick = 0;

var render = function () {
    context.fillStyle = "green";
    context.fillRect(0, 0, width, height);
    player.render();
    ball.render();
    defender.render();
};

var update = function () {
    player.update();
    ball.update(player);
    defender.update();
};

var step = function () {
    update();
    render();
    animate(step);
};

function getMousePos(canvas, event){
    var rect = canvas.getBoundingClientRect();
    return{
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
    };
}

function Player(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.possess = 0;
    this.throwing = 0;
    this.directionX = 0;
    this.directionY = -1;
    this.speed = 1.5;
}

Player.prototype.render = function () {
    context.beginPath();
    context.arc(this.x, this.y, this.size, 2 * Math.PI, false);
    context.fillStyle = "red";
    context.fill();
};

Player.prototype.move = function (x, y) {
    this.x += x*this.speed;
    this.y += y*this.speed;
};

Player.prototype.update = function () {
    var tempX = 0;
    var tempY = 0;
    if (this.possess == 1){
        this.size = 15;
        if(mouseClick == 1){
            this.throwing = 1;
        }
    } else {
        this.size = 10;
        for (var key in keysDown) {
            var value = Number(key);
            if (value == 65) {
                tempX = -1;
            } else if (value == 68) {
                tempX = 1;
            } else if (value == 87) {
                tempY = -1;
            } else if (value == 83) {
                tempY = 1;
            }
        }
    }
    var dirLength = Math.sqrt(tempX*tempX + tempY*tempY);
    if(dirLength <= 0){
        dirLength = 1;
    }
    this.move(tempX/dirLength,tempY/dirLength);
    tempX = mousePos.x - this.x;
    tempY = mousePos.y - this.y;
    dirLength = Math.sqrt(tempX*tempX + tempY*tempY);
    this.directionX = tempX/dirLength;
    this.directionY = tempY/dirLength;
};

function Ball(x, y) {
    this.x = x;
    this.y = y;
    this.x_speed = 0;
    this.y_speed = 0;
}

Ball.prototype.render = function () {
    context.beginPath();
    context.arc(this.x, this.y, 3, 2 * Math.PI, false);
    context.fillStyle = "white";
    context.fill();
};

Ball.prototype.update = function (p) {
    this.x += this.x_speed;
    this.y += this.y_speed;
    var top_x = this.x - 3;
    var top_y = this.y - 3;
    var bottom_x = this.x + 3;
    var bottom_y = this.y + 3;

    var xDisp = p.directionX;
    var yDisp = p.directionY;

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
    if (p.throwing == 1){
        if (top_y < (p.y + 3*p.size) && bottom_y > (p.y - 3*p.size) && top_x < (p.x + 3*p.size) && bottom_x > (p.x - 3*p.size)){
            this.x_speed = xDisp * 3;
            this.y_speed = yDisp * 3;  
        } else {
            p.throwing = 0;
        }
    } else if (top_y < (p.y + p.size) && bottom_y > (p.y - p.size) && top_x < (p.x + p.size) && bottom_x > (p.x - p.size)) {
        this.x_speed = 0;
        this.y_speed = 0;
        p.possess = 1;
        this.x = p.x + 15 * xDisp;
        this.y = p.y + 15 * yDisp;
    } else {
        p.possess = 0;
    }
};

document.body.appendChild(canvas);
animate(step);

window.addEventListener("keydown", function (event) {
    keysDown[event.keyCode] = true;
});

window.addEventListener("keyup", function (event) {
    delete keysDown[event.keyCode];
});

canvas.addEventListener('mousemove',function (event){
    mousePos = getMousePos(canvas,event);
});

canvas.addEventListener('mousedown', function(event){
    mouseClick = 1;
});

canvas.addEventListener('mouseup', function(event){
    mouseClick = 0;
});