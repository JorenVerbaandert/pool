import React, { useRef, useEffect } from "react";
import * as vec2 from "gl-vec2";

window.vec2 = vec2;

const height = 740;
const width = 1140;
const settings = {
  power: 40,
  drag: 0.975,
  ballR: 25 / 2,
  minPower: 0.05,
}

let canvas = null;
let ctx = null;

const table = {};
let whiteBall = {};
let balls = [];

function setTable() {
  const outer = {
    x: 0, y: 100, width: 1140, height: 640
  };
  const inner = {
    x: outer.x + 70, y: outer.y + 70,
    width: outer.width - 140, height: outer.height - 140
  };
  inner.x2 = inner.x + inner.width;
  inner.y2 = inner.y + inner.height;

  table.outer = outer;
  table.drawOuter = [outer.x, outer.y, outer.width, outer.height];
  table.inner = inner;
  table.drawInner = [inner.x, inner.y, inner.width, inner.height];
}

function createBall(color, number, col = 0, row = 0, half = false) {
  const x = col * 27;
  const y = row * 27;

  const ball = {
    position: vec2.fromValues(table.inner.x + 3 * (table.inner.width / 4) + x, table.inner.y + (table.inner.height / 2) + y),
    get x() {
      return this.position[0];
    },
    get y() {
      return this.position[1];
    },
    color,
    half,
    number,
  };

  balls.push(ball);
  return ball;
}

function createBalls() {

  balls = [];

  whiteBall = {
    position: vec2.fromValues(table.inner.x + (table.inner.width / 4), table.inner.y + (table.inner.height / 2)),
    get x() {
      return this.position[0];
    },
    get y() {
      return this.position[1];
    },
    color: "white",
  };
  balls.push(whiteBall);
  
  createBall("black", 8);
  createBall("yellow", 1, -2);
  createBall("yellow", 9, -1, 0.5, true);
  createBall("green", 14, -1, -0.5, true);
  createBall("blue", 2, 0, -1);
  createBall("green", 6, 0, 1);
  createBall("orange", 13, 1, -1.5, true);
  createBall("darkred", 15, 1, -0.5, true);
  createBall("darkred", 7, 1, 0.5);
  createBall("blue", 10, 1, 1.5, true);

  createBall("orange", 5, 2, -2);
  createBall("purple", 12, 2, -1, true);
  createBall("purple", 4, 2, 0);
  createBall("red", 11, 2, 1, true);
  createBall("red", 3, 2, 2);
}

function setupCanvas() {
  ctx.font = "30px Verdana";
  setTable();
  createBalls();
}

function drawBall(ball) {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, settings.ballR, 0, 2 * Math.PI);
  ctx.fillStyle = "black";
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, settings.ballR, 0, 2 * Math.PI);
  ctx.fillStyle = ball.color;
  ctx.fill();

  if (ball.half) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, settings.ballR, .2 * Math.PI, .8 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, settings.ballR, 1.2 * Math.PI, 1.8 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = "white";
    ctx.fill();
  }
}

function drawBalls() {
  balls.forEach(drawBall);
}

function drawTable() {
  ctx.beginPath();
  ctx.rect(...table.drawOuter);
  ctx.fillStyle = "peru";
  ctx.fill();

  ctx.beginPath();
  ctx.rect(...table.drawInner);
  ctx.fillStyle = "green";
  ctx.fill();
}

let times = [];
let fps;

function drawFPS() {

  const now = performance.now();
  while (times.length > 0 && times[0] <= now - 1000) {
    times.shift();
  }
  times.push(now);
  fps = times.length;

  ctx.fillStyle = "black";
  ctx.fillText("Fps: " + fps, 10, 50);
}

function handleClick(event) {
  if (balls.some(ball => ball.power)) {
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const click = vec2.fromValues(event.clientX - rect.left, event.clientY - rect.top);
  const ball = vec2.fromValues(whiteBall.x, whiteBall.y);

  const direction = vec2.sub(vec2.create(), ball, click);
  vec2.normalize(direction, direction);

  whiteBall.power = settings.power;
  whiteBall.direction = direction;
}

function ballVSWall(ball, wall) {
  const newPos = vec2.scaleAndAdd(vec2.create(), ball.position, ball.direction, ball.remainingPower || ball.power);

  if (newPos[0] - settings.ballR < wall.x) {
    const N = vec2.fromValues(wall.x - ball.x + settings.ballR, 0);

    const V = vec2.scale(vec2.create(), ball.direction, ball.power);

    const a = N[0] / V[0];
    
    const coll = vec2.scale(vec2.create(), V, a);

    ball.remainingPower = (1 - a) * ball.power;
    ball.position = vec2.add(ball.position, ball.position, coll);
    ball.direction = vec2.mul(ball.direction, ball.direction, [-1, 1]);
    return true;
  }
  if (newPos[0] + settings.ballR > wall.x2) {
    const N = vec2.fromValues(wall.x2 - ball.x - settings.ballR, 0);

    const V = vec2.scale(vec2.create(), ball.direction, ball.power);

    const a = N[0] / V[0];
    
    const coll = vec2.scale(vec2.create(), V, a);

    ball.remainingPower = (1 - a) * ball.power;
    ball.position = vec2.add(ball.position, ball.position, coll);
    ball.direction = vec2.mul(ball.direction, ball.direction, [-1, 1]);
    return true;
  }
  if (newPos[1] - settings.ballR < wall.y) {
    const N = vec2.fromValues(0, wall.y - ball.y + settings.ballR);

    const V = vec2.scale(vec2.create(), ball.direction, ball.power);

    const a = N[1] / V[1];
    
    const coll = vec2.scale(vec2.create(), V, a);

    ball.remainingPower = (1 - a) * ball.power;
    ball.position = vec2.add(ball.position, ball.position, coll);
    ball.direction = vec2.mul(ball.direction, ball.direction, [1, -1]);
    return true;
  }
  if (newPos[1] + settings.ballR > wall.y2) {
    const N = vec2.fromValues(0, wall.y2 - ball.y - settings.ballR);

    const V = vec2.scale(vec2.create(), ball.direction, ball.power);

    const a = N[1] / V[1];
    
    const coll = vec2.scale(vec2.create(), V, a);

    ball.remainingPower = (1 - a) * ball.power;
    ball.position = vec2.add(ball.position, ball.position, coll);
    ball.direction = vec2.mul(ball.direction, ball.direction, [1, -1]);
    return true;
  }
}

function ballVSball(ballA, ballB) {
  // Early Escape test: if the length of the movevec is less
  // than distance between the centers of these circles minus 
  // their radii, there's no way they can hit.
  const A = ballA.position;
  const B = ballB.position;
  const movevec = vec2.scale(vec2.create(), ballA.direction, ballA.power);

  let dist = vec2.dist(A, B);
  const sumRadii = (settings.ballR + settings.ballR);
  const movevecLen = vec2.len(movevec);
  dist -= sumRadii;
  if(movevecLen < dist){
    return false;
  }

  // Normalize the movevec
  const N = vec2.create();
  vec2.normalize(N, vec2.copy(N, movevec));

  // Find C, the vector from the center of the moving 
  // circle A to the center of B
  const C = vec2.sub(vec2.create(), B, A);

  // D = N . C = ||C|| * cos(angle between N and C)
  const D = vec2.dot(N, C);

  // Another early escape: Make sure that A is moving 
  // towards B! If the dot product between the movevec and 
  // B.center - A.center is less that or equal to 0, 
  // A isn't isn't moving towards B
  if(D <= 0){
    return false;
  }
  // Find the length of the vector C
  const lengthC = vec2.len(C);

  const F = (lengthC * lengthC) - (D * D);

  // Escape test: if the closest that A will get to B 
  // is more than the sum of their radii, there's no 
  // way they are going collide
  const sumRadiiSquared = sumRadii * sumRadii;
  if(F >= sumRadiiSquared){
    return false;
  }

  // We now have F and sumRadii, two sides of a right triangle. 
  // Use these to find the third side, sqrt(T)
  const T = sumRadiiSquared - F;

  // If there is no such right triangle with sides length of 
  // sumRadii and sqrt(f), T will probably be less than 0. 
  // Better to check now than perform a square root of a 
  // negative number. 
  if(T < 0){
    return false;
  }

  // Therefore the distance the circle has to travel along 
  // movevec is D - sqrt(T)
  const distance = D - Math.sqrt(T);

  // Finally, make sure that the distance A has to move 
  // to touch B is not greater than the magnitude of the 
  // movement vector. 
  if(movevecLen < distance){
    return false;
  }
  // Set the length of the movevec so that the circles will just 
  // touch
  const collisionDiff = vec2.copy(vec2.create(), movevec);

  vec2.normalize(collisionDiff, collisionDiff);
  vec2.scale(collisionDiff, collisionDiff, distance);

  const collisionPos = vec2.add(vec2.create(), collisionDiff, A);

  const angleB = vec2.sub(vec2.create(), B, collisionPos);
  const angleN = vec2.normalize(vec2.create(), angleB);

  const angleA = vec2.sub(vec2.create(), N, angleN);
  
  ballA.position = collisionPos;
  ballA.direction = angleA;
  ballB.direction = angleN;
  
  const remainder = movevecLen - distance;
  const lenA = vec2.len(angleA);
  const lenB = vec2.len(angleN);
  const percentA = (lenA / (lenA + lenB));
  const percentB = (lenB / (lenA + lenB));

  ballB.power = ballA.power * percentB;
  ballA.power = ballA.power * percentA;

  ballA.remainingPower = ballA.power * (remainder / movevecLen);
  ballB.remainingPower = ballB.power * (remainder / movevecLen);

  return true;
}

function checkCollisions(ball) {
  const oldPos = ball.position;
  const dir = ball.direction;
  const power = ball.remainingPower || ball.power;
  const ballPos = vec2.create();

  for (const otherBall of balls) {
    // TODO uncomment if dynamic dynamic is fixed
    // if (otherBall.checked) {
    //   continue;
    // }
    if (otherBall === ball) {
      continue;
    }
    if (ballVSball(ball, otherBall)) {
      return checkCollisions(ball);
    }
  }
  
  if (ballVSWall(ball, table.inner)) {
    return checkCollisions(ball);
  };

  vec2.scaleAndAdd(ballPos, oldPos, dir, power);

  ball.position = ballPos;

  return;
}

function updateBall(ball) {
  if (ball.power) {
    checkCollisions(ball);

    ball.checked = true;

    if (ball.remainingPower) {
      ball.remainingPower = 0;
    }

    if (ball.power) {
      ball.power = ball.power * settings.drag;
    
      if (ball.power < settings.minPower) {
        ball.power = null;
      }
    }
  }
}

function updateBalls() {
  balls.forEach(updateBall);
  balls.forEach(ball => ball.checked = false);
}

function update() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  updateBalls();

  drawTable();
  drawBalls();
  drawFPS();

  window.requestAnimationFrame(update);
}

export default function Canvas() {
  const canvasRef = useRef();

  useEffect(() => {
    if (ctx) {
      return;
    }
    canvas = canvasRef.current;
    ctx = canvas.getContext('2d');

    setupCanvas();

    window.requestAnimationFrame(update);
  }, [canvasRef]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={ width }
        height={ height }
        onClick={handleClick}
      />
      <button onClick={setupCanvas}>reset!</button>
    </div>
  )
}