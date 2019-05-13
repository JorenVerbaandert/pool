import React, { useRef, useEffect } from 'react';
import * as vec2 from 'gl-vec2';
import * as THREE from 'three';
import { createBalls } from './ball';
import {
  handleMove, createScene, renderAll, getIntersectsWithPlane,
} from './scene/scene';

const height = 740;
const width = 1140;
const settings = {
  power: 40,
  drag: 0.975,
  ballR: 25 / 2,
  minPower: 0.05,
};

let canvas = null;

const table = {};
let whiteBall = {};
let balls = [];

function setTable() {
  const outer = {
    x: 0, y: 100, width: 1140, height: 640,
  };
  const inner = {
    x: outer.x + 70,
    y: outer.y + 70,
    width: outer.width - 140,
    height: outer.height - 140,
  };
  inner.x2 = inner.x + inner.width;
  inner.y2 = inner.y + inner.height;
  inner.middle = [(inner.x + inner.x2) / 2, (inner.y + inner.y2) / 2];

  table.outer = outer;
  table.drawOuter = [outer.x, outer.y, outer.width, outer.height];
  table.inner = inner;
  table.drawInner = [inner.x, inner.y, inner.width, inner.height];
}

function setupCanvas() {
  setTable();
  balls = createBalls(table);
  [whiteBall] = balls;
  createScene(balls, canvas, width, height, settings, table, whiteBall);
}

function rotateBall(ball, power = ball.getPower()) {
  if (!ball.direction) {
    return;
  }

  const V = new THREE.Vector3(-1 * ball.direction[1], ball.direction[0], 0);
  ball.sphere.rotateOnWorldAxis(V, (V.length() * power) / settings.ballR);
}

function handleClick() {
  if (balls.some(ball => ball.getPower())) {
    return;
  }

  const intersect = getIntersectsWithPlane();

  if (intersect) {
    const { x, y } = intersect;
    const click = vec2.fromValues(x, y);

    const ball = vec2.fromValues(whiteBall.x, whiteBall.y);

    const direction = vec2.sub(vec2.create(), ball, click);
    vec2.normalize(direction, direction);

    whiteBall.power = settings.power;
    whiteBall.direction = direction;
  }
}

function updateWallBounce(ball, wall, axis, addBallR, xAxis = (axis === 'x' || axis === 'x2')) {
  const N = vec2.fromValues(wall[axis] - ball[xAxis ? 'x' : 'y'] + addBallR, 0);

  const V = vec2.scale(vec2.create(), ball.direction, ball.getPower());

  const index = xAxis ? 0 : 1;
  const a = N[index] / V[index];

  const coll = vec2.scale(vec2.create(), V, a);

  rotateBall(ball, a * ball.getPower());
  ball.remainingPower = (1 - a) * ball.getPower();
  ball.position = vec2.add(ball.position, ball.position, coll);

  const mul = xAxis ? [-1, 1] : [1, -1];

  ball.direction = vec2.mul(vec2.create(), ball.direction, mul);
  return true;
}

function ballVSWall(ball, wall) {
  const newPos = vec2.scaleAndAdd(
    vec2.create(),
    ball.position,
    ball.direction,
    ball.getPower(),
  );

  if (newPos[0] - settings.ballR < wall.x) {
    return updateWallBounce(ball, wall, 'x', settings.ballR);
  }
  if (newPos[0] + settings.ballR > wall.x2) {
    return updateWallBounce(ball, wall, 'x2', -settings.ballR);
  }
  if (newPos[1] - settings.ballR < wall.y) {
    return updateWallBounce(ball, wall, 'y', settings.ballR);
  }
  if (newPos[1] + settings.ballR > wall.y2) {
    return updateWallBounce(ball, wall, 'y2', -settings.ballR);
  }
  return false;
}

function ballVSball(ballA, ballB) {
  // Early Escape test: if the length of the movevec is less
  // than distance between the centers of these circles minus
  // their radii, there's no way they can hit.
  const A = ballA.position;
  const B = ballB.position;
  let movevec = vec2.scale(vec2.create(), ballA.direction, ballA.getPower());

  if (ballB.getPower()) {
    const movevecB = vec2.scale(vec2.create(), ballB.direction, ballB.getPower());
    movevec = vec2.sub(vec2.create(), movevec, movevecB);
  }

  let dist = vec2.dist(A, B);
  const sumRadii = (settings.ballR + settings.ballR);
  const movevecLen = vec2.len(movevec);
  dist -= sumRadii;
  if (movevecLen < dist) {
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
  if (D <= 0) {
    return false;
  }
  // Find the length of the vector C
  const lengthC = vec2.len(C);

  const F = (lengthC * lengthC) - (D * D);

  // Escape test: if the closest that A will get to B
  // is more than the sum of their radii, there's no
  // way they are going collide
  const sumRadiiSquared = sumRadii * sumRadii;
  if (F >= sumRadiiSquared) {
    return false;
  }

  // We now have F and sumRadii, two sides of a right triangle.
  // Use these to find the third side, sqrt(T)
  const T = sumRadiiSquared - F;

  // If there is no such right triangle with sides length of
  // sumRadii and sqrt(f), T will probably be less than 0.
  // Better to check now than perform a square root of a
  // negative number.
  if (T < 0) {
    return false;
  }

  // Therefore the distance the circle has to travel along
  // movevec is D - sqrt(T)
  const distance = D - Math.sqrt(T);

  // Finally, make sure that the distance A has to move
  // to touch B is not greater than the magnitude of the
  // movement vector.
  if (movevecLen < distance) {
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

  const angleA = vec2.normalize(vec2.create(), vec2.sub(vec2.create(), N, angleN));

  ballA.position = collisionPos;

  const remainder = movevecLen - distance;
  const lenA = vec2.len(angleA);
  const lenB = vec2.len(angleN);
  const percentA = (lenA / (lenA + lenB));
  const percentB = (lenB / (lenA + lenB));

  ballB.power = ballA.power * percentB;
  ballA.power *= percentA;

  const ballAOldPower = ballA.getPower() * (remainder / movevecLen);
  const ballBOldPower = ballB.getPower() * (remainder / movevecLen);

  rotateBall(ballA, ballA.getPower() - ballAOldPower);
  rotateBall(ballB, ballB.getPower() - ballBOldPower);

  ballA.remainingPower = ballAOldPower;
  ballB.remainingPower = ballBOldPower;

  ballA.direction = angleA;
  ballB.direction = angleN;

  return true;
}

function checkCollisions(ball) {
  const oldPos = ball.position;
  const dir = ball.direction;
  const power = ball.getPower();
  const ballPos = vec2.create();

  for (const otherBall of balls) {
    // TODO uncomment if dynamic dynamic is fixed
    // if (otherBall.checked) {
    //   continue;
    // }
    if (otherBall !== ball) {
      if (ballVSball(ball, otherBall)) {
        return checkCollisions(ball);
      }
    }
  }

  if (ballVSWall(ball, table.inner)) {
    return checkCollisions(ball);
  }

  vec2.scaleAndAdd(ballPos, oldPos, dir, power);

  ball.position = ballPos;

  return null;
}

function updateBall(ball) {
  if (ball.power) {
    checkCollisions(ball);

    ball.checked = true;

    if (ball.remainingPower) {
      ball.remainingPower = 0;
    }

    if (ball.power) {
      ball.power *= settings.drag;

      if (ball.power < settings.minPower) {
        ball.power = null;
      }
    }
    ball.sphere.position.set(ball.x, ball.y, settings.ballR);
    rotateBall(ball);
  }
}

function updateBalls() {
  balls.forEach(updateBall);
  balls.forEach((ball) => {
    ball.checked = false;
  });
}

function update() {
  updateBalls();

  renderAll();
  window.requestAnimationFrame(update);
}

export default function Canvas() {
  const canvasRef = useRef();

  useEffect(() => {
    canvas = canvasRef.current;

    setupCanvas();

    window.requestAnimationFrame(update);
  }, [canvasRef]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleClick}
        onMouseMove={handleMove}
      />
      <button type="button" onClick={setupCanvas}>reset!</button>
    </div>
  );
}
