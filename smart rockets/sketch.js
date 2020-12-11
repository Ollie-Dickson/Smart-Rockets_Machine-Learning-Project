var population;
var lifeSpan = 450;
var lifeP;
var count = 0;
var gen = 0;
var target;
var reset = false;

var rx = 200;
var ry = 300;
var rw = 400;
var rh = 10;
var rx2 = 200;
var ry2 = 300;
var rw2 = 400;
var rh2 = 10;

function setup() {
    createCanvas(800, 600);
    genP = createP();
    lifeP = createP();
    target = createVector(width/2, 50);
    population = new Population();
    
    let barrier1Button = select('#obstacle_1');
    barrier1Button.mousePressed(() => setBarriers(1));
    let barrier2Button = select('#obstacle_2');
    barrier2Button.mousePressed(() => setBarriers(2));
    
    let resetButton = select('#reset');
    resetButton.mousePressed(() => reset = true);
}

function draw() {
    background(0);
    population.run();
    lifeP.html("Time: "+ count);
    genP.html("Generation: "+ gen);
    count++;
    if(count == lifeSpan){
        population.evaluate();
        population.selection();
        count = 0;
        gen++;
    }
    
    noStroke();
    fill(250, 230);
    rect(rx,ry,rw,rh);
    rect(rx2,ry2,rw2,rh2);
    
    
    fill(250,0,0,150);
    ellipse(target.x, target.y, 4, 4);
    stroke(250,0,0,150);
    strokeWeight(1);
    noFill();
    ellipse(target.x, target.y, 15, 15);
    
    if(reset) {
        population = new Population();
        count = 0;
        gen = 0;
        reset = false;
    }
}
    
function setBarriers(index) {
    if(index == 1){
        rx = 200;
        ry = 300;
        rw = 400;
        rh = 10;
        rx2 = 200;
        ry2 = 300;
        rw2 = 400;
        rh2 = 10;
        console.log("1 barrier");
    }
    if(index == 2){
        rx = 0;
        ry = 340;
        rw = 500;
        rh = 10;
        rx2 = 390;
        ry2 = 150;
        rw2 = 410;
        rh2 = 10;
    }
}

function Population() {
    this.rockets = [];
    this.popSize = 50;
    this.matingPool = [];
    
    for (var i=0; i<this.popSize; i++){
        this.rockets[i] = new Rocket();
    }
    
    this.evaluate = function() {
        var maxFit = 0;
        var totalFitness = 0;
        for (var i=0; i<this.popSize; i++) {
            this.rockets[i].calcFitness();
            totalFitness += this.rockets[i].fitness;
            if(this.rockets[i].fitness > maxFit) {
                maxFit = this.rockets[i].fitness;
            }
        }
        //console.log("total fitness: "+ totalFitness);
        console.log("max fitness: "+ maxFit);
        console.log("av fitness: "+ totalFitness/this.popSize);
        
        for (var i=0; i<this.popSize; i++) {
            this.rockets[i].fitness /= maxFit;
        }
        this.matingPool = [];
        for (var i=0; i<this.popSize; i++) {
            var n = this.rockets[i].fitness * 100;
            for(var j=0; j<n; j++) {
                this.matingPool.push(this.rockets[i]);
            }
        }
        //console.log("matingPool: " + this.matingPool.length);
    }
    
    this.selection = function() {
        var newRockets =[];
        for (var i=0; i < this.rockets.length; i++) {
            var parentA = random(this.matingPool).dna;
            var parentB = random(this.matingPool).dna;
            var child = parentA.crossOver(parentB);
            child.mutation();
            newRockets[i] = new Rocket(child);
        }
        this.rockets = newRockets;
    }
    
    this.run = function() {
        for (var i=0; i<this.popSize; i++){
            this.rockets[i].update();
            this.rockets[i].show();
        }
    } 
}


function DNA(genes) {
    if(genes) {
        this.genes = genes;
    } else {
        this.genes = [];
        for (var i=0; i<lifeSpan; i++) {
            this.genes[i] = p5.Vector.random2D();
            this.genes[i].setMag(0.2);
        }
    }
    
    
    this.crossOver = function(partner) {
        var newGenes = [];
        var mid = floor(random(this.genes.length));
        for (var i=0; i<this.genes.length; i++) {
            if(i > mid){
                newGenes[i] = this.genes[i];
            } else {
                newGenes[i] = partner.genes[i];
            }
        }
        return new DNA(newGenes);
    }
    
    this.mutation = function() {
        for (var i=0; i<this.genes.length; i++) {
            if(random(1) < 0.01) {
                this.genes[i] = p5.Vector.random2D();
                this.genes[i].setMag(0.2);
            }
        }
    }
    
}

function Rocket(dna) {
    this.pos = createVector(width/2, height - 10);
    this.vel = createVector();
    this.acc = createVector();
    this.rocketCol = color(255,180);
    this.hitTarget = false;
    this.crashed = false;
    this.hitTime = 0;
    this.closeTime = 0;
    this.bestDist = 1000;
    if(dna) {
        this.dna = dna;
    } else {
        this.dna = new DNA();
    }
    this.fitness = 0;
    
    this.posHistory = [];
    //this.col = color(220,160,0,200)
    
    this.applyForce = function(force) {
        this.acc.add(force);
    }
    
    this.setColour = function(someCol) {
        this.rocketCol = someCol;
    }
    
    this.calcFitness = function() {
        var d = dist(this.pos.x, this.pos.y, target.x, target.y);
        this.fitness = map(d, 0, width, width, 0);
        if(this.crashed) {
            this.fitness *= 0.2;
            if(this.bestDist < 150){
                var distBonus = (150 - this.bestDist) / 150;
                var timeBonus = (lifeSpan - this.closeTime) / lifeSpan
                this.fitness += 200 * distBonus + 1000 * timeBonus;
            }
        } else if(this.hitTarget){
            var timeBonus = (lifeSpan - this.hitTime) / lifeSpan
            this.fitness += 4000 + (100000 * timeBonus);
            //console.log("hitTime " + this.hitTime, "fitness " + this.fitness, "timeBonus: "+ 60000*timeBonus);
        } else if(this.bestDist < 150){
            var distBonus = (150 - this.bestDist) / 150;
            var timeBonus = (lifeSpan - this.closeTime) / lifeSpan
            this.fitness += 1000 * distBonus + 10000 * timeBonus;
        }
    }
    
    this.update = function() {
        var d = dist(this.pos.x, this.pos.y, target.x, target.y);
        if(d < this.bestDist) {
            this.bestDist = d;
            this.closeTime = count;
        }
        if((d < 10) && !this.hitTarget) {
            this.hitTarget = true;
            this.pos = target.copy();
            this.hitTime = count;
        }
        
        if (this.pos.x > rx && this.pos.x < rx + rw && this.pos.y > ry && this.pos.y < ry + rh) {
            this.crashed = true;
        }
        if (this.pos.x > rx2 && this.pos.x < rx2 + rw2 && this.pos.y > ry2 && this.pos.y < ry2 + rh2) {
            this.crashed = true;
        }
        if (this.pos.y > height || this.pos.x > width || this.pos.x < 0 || this.pos.y < 0) {
            this.crashed = true;
        }
        
        this.applyForce(this.dna.genes[count]);
        if(!this.hitTarget && !this.crashed){
            this.vel.add(this.acc);
            this.pos.add(this.vel);
            this.acc.mult(0);
        }
        
        var currentPos = createVector(this.pos.x, this.pos.y);
        if(frameCount % 4 == 0){
            this.posHistory.push(currentPos);
        }
        if(this.posHistory.length > 60){
            this.posHistory.splice(0, 1);
        }
    }
    
    this.show = function() {
        push();
        noStroke();
        fill(this.rocketCol);
        translate(this.pos.x, this.pos.y);
        rotate(this.vel.heading());
        rectMode(CENTER);
        rect(0,0, 20, 4);
        
        pop();
        
        // dot trails
//        for (var i=0; i<this.posHistory.length-3; i++) {
//            var trailPos = this.posHistory[i];
//            fill(220,160,0,200);
//            noStroke();
//            var size = i / 12;
//            ellipse(trailPos.x, trailPos.y, size, size);
//        }
        
        // line trails
        beginShape();
        for (var i=0; i<this.posHistory.length-1; i++) {
            //var trailPos = createVector(this.posHistory[i].x + random(2,-2),this.posHistory[i].y + random(2,-2));
            var trailPos = this.posHistory[i];
            stroke(220,160,0,200);
            if(this.crashed){
                stroke(220,0,0,180);
            }
            if(this.hitTarget){
                stroke(0,220,0,180);
            }
            strokeWeight(1.5);
            noFill();
            vertex(trailPos.x, trailPos.y);
        }
        endShape();
    }
    
}