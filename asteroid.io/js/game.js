let canvas;
let ctx;
let canvasWidth = window.innerWidth;
let canvasHeight = window.innerHeight;
let keys = [];
let ship;
let bullets = [];
let asteroids = [];
let lives = 3;
let highScore;
let localStorageName = "HighScore";

document.addEventListener('DOMContentLoaded', setupCanvas);

function setupCanvas(){
    canvas = document.getElementById("asteroid-canvas");
    ctx = canvas.getContext("2d");
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    //adding the ship and the asteroids to the canvas immediately upon creation
    ship = new Ship();

    for(let i = 0; i < 8; i++){
        asteroids.push(new Asteroid());
    }

    document.body.addEventListener("keydown", HandleKeyDown);
    document.body.addEventListener("keyup", HandleKeyUp);

    if (localStorage.getItem(localStorageName) == null) {
        highScore = 0;
    } else {
        highScore = localStorage.getItem(localStorageName);
    }

    Render();
}

//returns the ship to the center of the canvas and changes necessary ship fields to process a death
function handleDeath(){
    ship.x = canvasWidth / 2;
    ship.y = canvasHeight / 2;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ship.velX = 0;
    ship.velY = 0;
    lives -= 1;
    ship.numBlinks = Math.ceil (5 / 0.1);
}

function HandleKeyDown(e){
    keys[e.keyCode] = true;
}

function HandleKeyUp(e){
    keys[e.keyCode] = false;
}


//simulates firing rate cooldown by reducing a variable by a count of 1 every frame
const gun = {
    fireRate : 80,
    nextShotIn : 0,
    update() {
        if(this.nextShotIn > 0){
            this.nextShotIn -= 1;
        }
    },
    fire(){
        if(this.nextShotIn <= 0){
            this.fireRate = ship.fireRate;
            bullets.push(new Bullet(ship.angle));
            this.nextShotIn = this.fireRate;
        }
    }
}



class Ship {
    constructor() {
        this.visible = true;
        this.fireRate = 80;
        this.numBlinks = Math.ceil (5 / 0.1);
        this.blinkTime = Math.ceil (0.1 * 30);
        this.x = canvasWidth / 2;
        this.y = canvasHeight / 2;
        this.movingForward = false;
        this.weight = 0.99;
        this.speed = 0.05;
        this.velX = 0;
        this.velY = 0;
        this.level = 1;
        this.totalExp = 10;
        this.currentExp = 10;
        this.expToLevel = 10;
        this.rotateSpeed = 0.001;
        this.radius = 15;
        this.angle = 0;
        this.strokeColor = 'white';
        this.noseX = canvasWidth / 2 + 15;
        this.noseY = canvasHeight / 2;
    }
    Rotate(dir) {
        this.angle += this.rotateSpeed * dir;
    }
    Update() {
        //determines the angle the ship is facing
        let radians = this.angle / Math.PI * 180;

        //speed stat of the ship is increased as the W key is held
        if (this.movingForward) {

            this.velX += Math.cos(radians) * this.speed;
            this.velY += Math.sin(radians) * this.speed;

        }
        // If ship goes off board, process a death
        if (this.x < this.radius) {
            handleDeath();
        }
        if (this.x > canvas.width) {
            handleDeath();
        }
        if (this.y < this.radius) {
            handleDeath();
        }
        if (this.y > canvas.height) {
            handleDeath();
        }
        //translates the canvas to follow the ship positively before drag is applied
        ctx.translate(this.x,this.y);
        // Induce weight, reducing the velocity of the ship every frame by the weight coefficient
            this.velX *= this.weight;
            this.velY *= this.weight;

            this.x -= this.velX;
            this.y -= this.velY;
        //after slowdown is applied, modify translation to account for it
        ctx.translate(-this.x, -this.y);
        //draws the border on the outside of the canvas
        ctx.strokeStyle = "white";
        ctx.strokeRect(1, 1, canvas.width-2, canvas.height-2);
    }
    Draw() {
        //variable stores whether or not the ship is drawn, changing from true to false by being odd or even every frame
        let blinking = this.numBlinks % 2 === 0;


        //blinking will always be true when it's zero so the game will continue on as normal after numBlinks reaches 0
        if (blinking) {
            ctx.strokeStyle = this.strokeColor;
            ctx.beginPath();
            //angles of the triangle to draw the ship
            let vertAngle = ((Math.PI * 2) / 3);
            //angle of the nose of the ship
            let radians = this.angle / Math.PI * 180;
            this.noseX = this.x - this.radius * Math.cos(radians);
            this.noseY = this.y - this.radius * Math.sin(radians);

            //drawing the ship
            for (let i = 0; i < 3; i++) {
                ctx.lineTo(this.x - this.radius * Math.cos(vertAngle * i + radians), this.y - this.radius * Math.sin(vertAngle * i + radians));
            }

            ctx.closePath();
            ctx.stroke();

            // display exp over ship
            ctx.fillStyle = 'white';
            ctx.font = '10px Helvetica';
            ctx.fillText(this.currentExp.toString() + "/" + this.expToLevel.toString(), this.x, this.y - 20);


        }
        //if one of the buttons is showing, display the levelup text
        let btnFireRate = document.getElementById("buttonFireRate");
        if (btnFireRate.style.visibility === "visible") {
            ctx.font = '10px Helvetica';
            ctx.fillText("LEVEL UP", this.x + 50, this.y);
        }
        //setting and handling the duration of any single given blink over the blink duration
        if (this.numBlinks > 0) {
            this.blinkTime--;
            if (this.blinkTime === 0){
                this.blinkTime = Math.ceil (0.1 * 30);
                this.numBlinks--;
            }
        }
    }
}



class Bullet{
    constructor(angle) {
        this.visible = true;
        this.x = ship.noseX;
        this.y = ship.noseY;
        this.angle = angle;
        this.height = 4;
        this.width = 4;
        this.speed = 5;
        this.velX = 0;
        this.velY = 0;
    }
    Update(){
        //finding the angle the ship is facing
        let radians = this.angle / Math.PI * 180;
        this.x -= Math.cos(radians) * this.speed;
        this.y -= Math.sin(radians) * this.speed;
    }
    Draw(){
        //drawing the bullet on the canvas as it moves
        ctx.fillStyle = 'white';
        ctx.fillRect(this.x,this.y,this.width,this.height);
    }
}

class Asteroid{
    constructor(x,y,radius,level,collisionRadius) {
        this.visible = true;
        //chooses a random initial point on the canvas to spawn new asteroids
        this.x = x || Math.floor(Math.random() * canvasWidth);
        this.y = y || Math.floor(Math.random() * canvasHeight);
        this.speed = 1;
        this.radius = radius || 50;
        this.angle = Math.floor(Math.random() * 359);
        this.strokeColor = 'white';
        this.collisionRadius = collisionRadius || 46;
        this.level = level || 1;
    }
    Update(){
        //direction the asteroid is moving is used to draw asteroids in motion
        let radians = this.angle / Math.PI * 180;
        this.x += Math.cos(radians) * this.speed;
        this.y += Math.sin(radians) * this.speed;
        //if an asteroid reaches offscreen, wrap it around
        if (this.x < this.radius) {
            this.x = canvas.width;
        }
        if (this.x > canvas.width) {
            this.x = this.radius;
        }
        if (this.y < this.radius) {
            this.y = canvas.height;
        }
        if (this.y > canvas.height) {
            this.y = this.radius;
        }
    }
    Draw(){
        ctx.beginPath();
        //drawing hexagonal asteroids
        let vertAngle = ((Math.PI * 2) / 6);
        //determining an angle for travel
        var radians = this.angle / Math.PI * 180;
        //drawing the 6 sides of the asteroid
        for(let i = 0; i < 6; i++){
            ctx.lineTo(this.x - this.radius * Math.cos(vertAngle * i + radians), this.y - this.radius * Math.sin(vertAngle * i + radians));
        }
        ctx.closePath();
        //if the asteroid is level 4 (which means it's been broken down into gold dust for collecting) display it as yellow
        if (this.level == 4){
            ctx.strokeStyle = 'yellow';
            ctx.fillstyle = 'yellow';
            ctx.fill();
        }
        else{
            ctx.strokeStyle = 'white';
        }
        ctx.stroke();
    }
}

function isColliding(p1x, p1y, r1, p2x, p2y, r2){
    let radiusSum;
    let xDiff;
    let yDiff;
    //taking the sum of the radii of the two objects and the difference between their x and y values to determine collision
    radiusSum = r1 + r2;
    xDiff = p1x - p2x;
    yDiff = p1y - p2y;
    //returns true or false depending on collision found
    return radiusSum > Math.sqrt((xDiff * xDiff) + (yDiff * yDiff));
}

//calling the levelup function depending on which button was clicked
function topSpeedClicked(){
    levelUp("TopSpeed");
}

function weightClicked(){
    levelUp("Weight");
}

function fireRateClicked(){
    levelUp("FireRate");
}


function levelUp (buttonClicked){
    let btnWeight = document.getElementById("buttonWeight");
    let btnTopSpeed = document.getElementById("buttonTopSpeed");
    let btnFireRate = document.getElementById("buttonFireRate");

    //boosting the weight, top speed, or fire rate stats of the ship when the buttons are clicked to level up, then hiding them
    if (buttonClicked === "Weight"){
        ship.weight-=0.005;
    }
    else if (buttonClicked === "TopSpeed") {
        ship.speed+=0.02;
    }
    else if (buttonClicked === "FireRate"){
        ship.fireRate = ship.fireRate - (ship.fireRate / 25);
    }

    btnWeight.disabled = true;
    btnWeight.style.visibility = "hidden";
    btnTopSpeed.disabled = true;
    btnTopSpeed.style.visibility = "hidden";
    btnFireRate.disabled = true;
    btnFireRate.style.visibility = "hidden";

}


function DrawHP(){
    let startX = 1350;
    let startY = 10;
    let points = [[9, 9], [-9, 9]];
    ctx.strokeStyle = 'white';
    //depending on how many lives are left, constantly draw life indicators at the top right
    for(let i = 0; i < lives; i++){
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        for(let j = 0; j < points.length; j++){
            ctx.lineTo(startX + points[j][0],
                startY + points[j][1]);
        }
        ctx.closePath();
        ctx.stroke();
        //move to the starting point for the next life indicator
        startX -= 30;
    }
}

function Render() {

    ship.movingForward = (keys[87]);
    //calling this every frame creates proper timing for shot cooldown
    gun.update();

    if (keys[68]) {
        ship.Rotate(1);
    }
    if (keys[65]) {
        ship.Rotate(-1);
    }

    if (keys[32]){
        gun.fire();
    }


    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    ctx.fillStyle = 'white';
    ctx.font = '21px Helvetica';
    ctx.fillText("EXP : " + ship.totalExp.toString(), 20, 35);

    //handling game over, removing players abilities to interact and displaying game over text
    if(lives <= 0){
        document.body.removeEventListener("keydown", HandleKeyDown);
        document.body.removeEventListener("keyup", HandleKeyUp);

        ship.visible = false;
        ctx.fillStyle = 'white';
        ctx.font = '50px Helvetica';
        ctx.fillText("GAME OVER", canvasWidth / 2 - 150, canvasHeight / 2);
    }


    //creating 8 new asteroids on startup
    if(asteroids.length === 0){
        ship.x = canvasWidth / 2;
        ship.y = canvasHeight / 2;
        ship.velX = 0;
        ship.velY = 0;
        for(let i = 0; i < 8; i++){
            let asteroid = new Asteroid();
            asteroid.speed += .5;
            asteroids.push(asteroid);
        }
    }


    DrawHP();

    //if there are asteroids present and the ship is not invulnerable
    if (asteroids.length !== 0 && ship.numBlinks === 0) {
        //go through the list of asteroids
        for(let k = 0; k < asteroids.length; k++){
            //check collision of the ship's current position with the current position of all asteroids until we've found one it's colliding with
            if(isColliding(ship.x, ship.y, 11, asteroids[k].x, asteroids[k].y, asteroids[k].collisionRadius)){
                //if the collision happens with a level 4 asteroid (gold dust) process collection and exp gain
                if (asteroids[k].level === 4){
                    asteroids.splice(k,1);
                    ship.currentExp += 1;
                    ship.totalExp +=1;
                }
                //otherwise you die
                else{
                    handleDeath();
                }
            }
        }
    }

    //if asteroids and bullets exist on the screen
    if (asteroids.length !== 0 && bullets.length !== 0){
        loop1:
        //go through the arrays of the asteroids and bullets
            for(let l = 0; l < asteroids.length; l++){
                //for each asteroid check if all bullets have collided with them
                for(let m = 0; m < bullets.length; m++){
                    //check for collision between all bullets for the current asteroid
                    if(isColliding(bullets[m].x, bullets[m].y, 3, asteroids[l].x, asteroids[l].y, asteroids[l].collisionRadius)){
                        // if the asteroid can be broken down, reduce level by one and display the broken asteroids, removing the old one
                        if(asteroids[l].level === 1){
                            asteroids.push(new Asteroid(asteroids[l].x - 5, asteroids[l].y - 5, 25, 2, 22));
                            asteroids.push(new Asteroid(asteroids[l].x + 5, asteroids[l].y + 5, 25, 2, 22));
                            asteroids.splice(l,1);
                            bullets.splice(m,1);
                            //same as above
                        } else if(asteroids[l].level === 2){
                            asteroids.push(new Asteroid(asteroids[l].x - 5, asteroids[l].y - 5, 15, 3, 12));
                            asteroids.push(new Asteroid(asteroids[l].x + 5, asteroids[l].y + 5, 15, 3, 12));
                            asteroids.splice(l,1);
                            bullets.splice(m,1);
                            //create gold dust and destroy the smallest asteroids
                        }else if(asteroids[l].level === 3){
                            let asteroid1 = new Asteroid(asteroids[l].x - 2, asteroids[l].y - 5, 5, 4, 6);
                            asteroid1.speed = 0.1;
                            asteroids.push(asteroid1);
                            let asteroid2 = new Asteroid(asteroids[l].x + 2, asteroids[l].y + 5, 5, 4, 6);
                            asteroid2.speed = 0.1;
                            asteroids.push(asteroid2);
                            let asteroid3 = new Asteroid(asteroids[l].x - 4, asteroids[l].y - 5, 5, 4, 6);
                            asteroid3.speed = 0.1;
                            asteroids.push(asteroid3);
                            let asteroid4 = new Asteroid(asteroids[l].x + 4, asteroids[l].y + 5, 5, 4, 6);
                            asteroid4.speed = 0.1
                            asteroids.push(asteroid4);
                            asteroids.splice(l,1);
                            bullets.splice(m,1);
                        }
                        break loop1;
                    }
                }
            }
    }

    if(ship.visible){
        ship.Update();
        ship.Draw();
    }

    //processing levelup, changing the exp values and displays and enabling the buttons to be clicked
   if (ship.currentExp >= ship.expToLevel){
       ship.expToLevel += 5;
       ship.currentExp = 0;
       ship.level += 1;
       let btnTopSpeed = document.getElementById("buttonTopSpeed");
       btnTopSpeed.addEventListener("click", topSpeedClicked);
       let btnFireRate = document.getElementById("buttonFireRate");
       btnFireRate.addEventListener("click", fireRateClicked);
       let btnWeight = document.getElementById("buttonWeight");
       btnWeight.addEventListener("click", weightClicked);

       btnFireRate.disabled = false;
       btnFireRate.style.visibility = "visible";

       btnWeight.disabled = false;
       btnWeight.style.visibility = "visible";

       btnTopSpeed.disabled = false;
       btnTopSpeed.style.visibility = "visible";
   }

   //drawing the bullets
    if (bullets.length !== 0) {
        for(let i = 0; i < bullets.length; i++){
            bullets[i].Update();
            bullets[i].Draw();
        }
    }
    //drawing the asteroids
    if (asteroids.length !== 0) {
        for(let j = 0; j < asteroids.length; j++){
            asteroids[j].Update();
            asteroids[j].Draw(j);
        }
    }

    //high score is stored locally, this also displays the current level of the ship at the top left
    highScore = Math.max(ship.totalExp, highScore);
    localStorage.setItem(localStorageName, highScore);
    ctx.font = '21px Helvetica';
    ctx.fillText("EXP RECORD : " + highScore.toString(), 20, 70);
    ctx.fillText("LEVEL : " + ship.level.toString(), 20, 105);
    requestAnimationFrame(Render);
}