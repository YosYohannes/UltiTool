var animate = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function (callback) {
        window.setTimeout(callback, 1000 / 120)
    };
var socket = io.connect('http://localhost:8000');

var btn = document.getElementById('join');
var teamBtn = document.getElementById('team');
var resetBtn = document.getElementById('reset');

var canvas = document.createElement("canvas");
var width = 1500;
var height = 555;
canvas.width = width;
canvas.height = height;
var context = canvas.getContext('2d');
var players = {};
var ball = null;
var curPlayer = "none";

// Game loop
var render = function () {
    context.fillStyle = "#90C978";
    context.fillRect(0, 0, width, height);
    context.fillStyle = "white";
    context.fillRect(345, 0, 3, height);
    context.fillRect(1152, 0, 3, height);
    renderPlayers(players);
    renderBall(ball);
};

function renderPlayers(players) {
    for (var id in players){
        var p = players[id];
        context.beginPath();
        context.arc(p.x, p.y, p.size, 2 * Math.PI, false);
        if(team[p.name] == 0) context.fillStyle = "#0083A3";
        else context.fillStyle = "#E2504B";
        context.fill();
        context.font = "15px Verdana, Geneva, sans-serif";
        context.fillStyle = "white";
        context.textAlign = "center";
        context.fillText(p.name.substring(0,5),p.x,p.y - 2*p.size);
    }
};

function renderBall(ball){
    if(ball != null){
        context.beginPath();
        context.arc(ball.x, ball.y, 4.5, 2 * Math.PI, false);
        context.fillStyle = "white";
        context.fill();
    }
};

var step = function () {
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

// Main
document.body.appendChild(canvas);
animate(step);


// Event Socket Emitter
window.addEventListener("keydown", function (event) {
    socket.emit('keyDown', {
        userName: curPlayer,
        key: event.keyCode,
    })
});

window.addEventListener("keyup", function (event) {
    socket.emit('keyUp', {
        userName: curPlayer,
        key: event.keyCode,
    })
});

canvas.addEventListener('mousemove',function (event){
    socket.emit('mousePos', {
        userName: curPlayer,
        pos: getMousePos(canvas,event)
    })
});

canvas.addEventListener('mousedown', function(event){
    socket.emit('mouseDown', {
        userName: curPlayer
    })
});

canvas.addEventListener('mouseup', function(event){
    socket.emit('mouseUp', {
        userName: curPlayer
    })
});

btn.addEventListener("click", function(){
    var name = document.getElementById('name');
    document.getElementById("header").innerHTML = name.value;
    curPlayer = name.value;
    socket.emit('newPlayer', {
        userName: curPlayer
    })
    btn.parentElement.removeChild(name);
    btn.parentElement.removeChild(btn);
});

teamBtn.addEventListener("click", function(){
    socket.emit('changeTeam', {
        userName: curPlayer
    });
});

resetBtn.addEventListener("click", function(){
    socket.emit('reset', {
        userName: curPlayer
    });
});

// Event Socket Receiver
socket.on('players', function(data){
    players = data;
});

socket.on('ball', function(data){
    ball = data;
});

socket.on('team', function(data){
    team = data;
});
