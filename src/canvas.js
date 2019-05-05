import React, { useRef, useEffect } from "react";
import * as vec2 from "gl-vec2";

window.vec2 = vec2;

const height = 740;
const width = 1140;
const settings = {
  power: 30,
  drag: 0.98,
  ballR: 25 / 2,
}

let canvas = null;
let ctx = null;

const table = {};
let whiteBall = {};
let blackBall = {};

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

function createBalls() {

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
  
  blackBall = {
    position: vec2.fromValues(table.inner.x + (3 * (table.inner.width / 4)), table.inner.y + (table.inner.height / 2)),
    get x() {
      return this.position[0];
    },
    get y() {
      return this.position[1];
    },
    color: "black",
  };
}

function setupCanvas() {
  ctx.font = "30px Verdana";
  setTable();
  createBalls()
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
}

function drawBalls() {
  drawBall(whiteBall);
  drawBall(blackBall);
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
  const rect = canvas.getBoundingClientRect();
  const click = vec2.fromValues(event.clientX - rect.left, event.clientY - rect.top);
  const ball = vec2.fromValues(whiteBall.x, whiteBall.y);

  const direction = vec2.sub(vec2.create(), ball, click);
  vec2.normalize(direction, direction);

  whiteBall.power = settings.power;
  whiteBall.direction = direction;
}

function ballVSWall(ball, { x, x2, y, y2}) {
  return {
    x: ball[0] - settings.ballR < x,
    x2: ball[0] + settings.ballR > x2,
    y: ball[1] - settings.ballR < y,
    y2: ball[1] + settings.ballR > y2,
  };
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
  vec2.scaleAndAdd(ballPos, oldPos, dir, power);

  const ballCollision = ballVSball(ball, blackBall);

  if (ballCollision) {
    console.log("COLLISION!");
    return checkCollisions(ball);
  }
  
  const {x, y, x2, y2} = ballVSWall(ballPos, table.inner);

  // TODO partial bounce

  if (x) {
    vec2.set(dir, dir[0] * -1, dir[1]);
  }
  if (x2) {
    vec2.set(dir, dir[0] * -1, dir[1]);
  }
  if (y) {
    vec2.set(dir, dir[0], dir[1] * -1);
  }
  if (y2) {
    vec2.set(dir, dir[0], dir[1] * -1);
  }
  vec2.scaleAndAdd(ballPos, oldPos, dir, power);

  ball.position = ballPos;

  return;
}

function updateBall(ball) {
  if (ball.power) {
    checkCollisions(ball);

    if (ball.remainingPower) {
      ball.remainingPower = 0;
    }

    if (ball.power) {
      ball.power = ball.power * settings.drag;
    
      if (ball.power < 0.01) {
        ball.power = null;
      }
    }
  }
}

function updateBalls() {
  updateBall(whiteBall);
  updateBall(blackBall);
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
    </div>
  )
}