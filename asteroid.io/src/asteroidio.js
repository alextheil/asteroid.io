import { Buffer } from "buffer";
import * as Colyseus from "colyseus.js";
global.Buffer = Buffer;

let canvas;
let context;
let canvasWidth = window.innerWidth;
let canvasHeight = window.innerHeight;
let ship;
let keys = [];
var client = new Colyseus.Client('ws://localhost:2567');

document.addEventListener('DOMContentLoaded', SetupCanvas);

function SetupCanvas(){
    canvas = document.getElementById("asteroid-canvas");
    context = canvas.getContext("2d");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    context.fillStyle = "black";
    context.fillRect(0, 0, canvas.width, canvas.height);
    ship = new Ship();

    document.body.addEventListener("keydown", KeyDown);
    document.body.addEventListener("keyup", KeyUp);

    client.joinOrCreate("my_room").then(room => {

        console.log(room.sessionId, "joined", room.name);
        room.send({ move: "left" });

        room.onMessage((message) => {
            console.log("message received from server");
            console.log(message);
        });
    }).catch(e => {
        console.log("JOIN ERROR", e);
    });
    Render();
}

function KeyDown(e){ keys[e.keyCode] = true; }
function KeyUp(e){ keys[e.keyCode] = false; }

class Ship {
    constructor() {
        this.visible = true;
        this.x = canvasWidth / 2;
        this.y = canvasHeight / 2;
        this.movingForward = false;
        this.speed = 0.1;
        this.velX = 0;
        this.velY = 0;
        this.rotateSpeed = 0.001;
        this.radius = 15;
        this.angle = 0;
        this.strokeColor = 'white';
    }


    Rotate(dir) {
        this.angle += this.rotateSpeed * dir;
    }


    Update() {
        let radians = this.angle / Math.PI * 180;

        if (this.movingForward) {
            this.velX += Math.cos(radians) * this.speed;
            this.velY += Math.sin(radians) * this.speed;
        }


        this.velX *= 0.99;
        this.velY *= 0.99;

        this.x -= this.velX;
        this.y -= this.velY;
    }

    Draw() {
        context.strokeStyle = this.strokeColor;
        context.beginPath();
        let vertAngle = ((Math.PI * 2) / 3);

        let radians = this.angle / Math.PI * 180;

        for (let i = 0; i < 3; i++) {
            context.lineTo(this.x - this.radius * Math.cos(vertAngle * i + radians), this.y - this.radius * Math.sin(vertAngle * i + radians));
        }
        context.closePath();
        context.stroke();
    }
}

function Render() {

    ship.movingForward = (keys[87]);

    if (keys[68]) { ship.Rotate(1); } //rotate to right if 'D' is pressed
    if (keys[65]) { ship.Rotate(-1); } //rotate to right if 'A' is pressed

    context.clearRect(0, 0, canvasWidth, canvasHeight);

    if(ship.visible){
        ship.Update();
        ship.Draw();
    }

    requestAnimationFrame(Render);
}