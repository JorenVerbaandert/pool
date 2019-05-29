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

function handleClick() {
  const intersect = getIntersectsWithPlane();

  whiteBall.sphere.applyCentralImpulse(new THREE.Vector3(5000, 0, -300));
  
  if (intersect) {
    const { x, y } = intersect;
    const click = vec2.fromValues(x, y);

    const ball = vec2.fromValues(whiteBall.x, whiteBall.y);

    const direction = vec2.sub(vec2.create(), ball, click);
    
    let powerAmp = 5;

    whiteBall.sphere.applyCentralImpulse(new THREE.Vector3(direction[0] * powerAmp, direction[1] * powerAmp, 0));
  }
}

function update() {
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
