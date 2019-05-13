import React, { useRef, useEffect } from 'react';
import * as vec2 from 'gl-vec2';
import * as THREE from 'three';
import ball1 from './images/Ball1.jpg';
import ball2 from './images/Ball2.jpg';
import ball3 from './images/Ball3.jpg';
import ball4 from './images/Ball4.jpg';
import ball5 from './images/Ball5.jpg';
import ball6 from './images/Ball6.jpg';
import ball7 from './images/Ball7.jpg';
import ball8 from './images/Ball8.jpg';
import ball9 from './images/Ball9.jpg';
import ball10 from './images/Ball10.jpg';
import ball11 from './images/Ball11.jpg';
import ball12 from './images/Ball12.jpg';
import ball13 from './images/Ball13.jpg';
import ball14 from './images/Ball14.jpg';
import ball15 from './images/Ball15.jpg';
import ballCue from './images/BallCue.jpg';
import jeroenTable from './Pooltable.fbx';
import cloth from './images/cloth.jpg';
import env from './images/garage_1k.jpg';
import TrackballControls from './trackBallControls';
import FBXLoader from './FBXLoader';
import jeroenTexture from './PoolTable_Textures.png';

window.vec2 = vec2;

const height = 740;
const width = 1140;
const settings = {
  power: 40,
  drag: 0.975,
  ballR: 25 / 2,
  minPower: 0.05,
};

let canvas = null;
let render = null;
const ctx = null;
let scene = null;
let camera = null;
let linegeometry = null;
let line = null;
let controls = null;

const table = {};
let whiteBall = {};
let balls = [];
const textures = [
  ballCue,
  ball1,
  ball2,
  ball3,
  ball4,
  ball5,
  ball6,
  ball7,
  ball8,
  ball9,
  ball10,
  ball11,
  ball12,
  ball13,
  ball14,
  ball15,
];

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

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

function updateLine(origin, target) {
  const positions = line.geometry.attributes.position.array;
  positions[0] = origin.x;
  positions[1] = origin.y;
  positions[2] = settings.ballR;
  positions[3] = target.x;
  positions[4] = target.y;
  positions[5] = settings.ballR;
  line.geometry.attributes.position.needsUpdate = true;
}

function createScene() {
  render = new THREE.WebGLRenderer({ canvas, antialias: true });

  render.setClearColor(0x000000, 1);
  //render.setClearColor( 0xffffff, 1 );
  render.setSize(width, height);
  render.shadowMap.enabled = true;
  render.shadowMapSoft = true;

  scene = new THREE.Scene();
  const aspect = width / height;

  // intersection plane
  var geometry = new THREE.PlaneGeometry( 2000, 2000, 2 );
  var material = new THREE.MeshBasicMaterial( {
    color: 0x248f24, alphaTest: 0, visible: false});
  var intersectionPlane = new THREE.Mesh( geometry, material );
  scene.add( intersectionPlane );

  // Lights

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(1500, 400, 1000);
  directionalLight.shadow.camera.near = 3;
  directionalLight.shadow.camera.far = 10000;
  directionalLight.shadow.camera.fov = 45;
  directionalLight.castShadow = true;
  directionalLight.shadow.camera.left = -600;
  directionalLight.shadow.camera.right = 600;
  directionalLight.shadow.camera.top = 600;
  directionalLight.shadow.camera.bottom = -600;
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;

  scene.add(directionalLight);

  const light = new THREE.AmbientLight(0x808080);
  scene.add(light);

  function onLoad(m){
    console.log(m);
  }

  function onError(error){
      console.log(error);
  }

  function onProgress(p){
    console.log(p);
  }

  // line

  linegeometry = new THREE.BufferGeometry();

  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
  const positions = new Float32Array(2 * 3);
  linegeometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
  linegeometry.setDrawRange(0, 2);

  line = new THREE.Line(linegeometry, lineMaterial);

  updateLine(
    new THREE.Vector3(whiteBall.position[0], whiteBall.position[1], 1),
    new THREE.Vector3(0, 0, 1),
  );

  scene.add(line);

  // Camera

//   camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 1000 );
//   camera.position.z = 500;

  camera = new THREE.PerspectiveCamera(45, aspect, 1, 10000);
  camera.position.set(table.inner.middle[0], table.inner.middle[1], 800);
  camera.lookAt(new THREE.Vector3(whiteBall.position[0], whiteBall.position[1], 0));

  scene.add(camera);

  // Controls

  controls = new TrackballControls( camera );

  controls.rotateSpeed = 1.0;
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 0.8;
  controls.noZoom = false;
  controls.noPan = false;
  controls.staticMoving = true;
  controls.dynamicDampingFactor = 0.3;
  controls.keys = [ 65, 83, 68 ];
  controls.addEventListener( 'change', renderScene );

  // Table

  let loader = new FBXLoader();
  let tableTexture = new THREE.TextureLoader().load(jeroenTexture, onLoad, onProgress, onError);
  let tableMaterial = new THREE.MeshLambertMaterial({map: tableTexture});
  loader.load( jeroenTable, function ( object ) {

    object.traverse( function ( child ) {
        if ( child.isMesh ) {
            child.castShadow = true;
            child.receiveShadow = true;

            child.material = tableMaterial;
            child.material.needsUpdate = true;
        }
    } );

    object.translateZ(-310);
    object.translateX(590);
    object.translateY(425);

    object.rotateX(Math.PI / 2);
    object.rotateY(Math.PI / 2);

    //object.rotation.set(new THREE.Vector3( 1, 1, 1));
    //object.rotateOnWorldAxis(new THREE.Vector3(1,0,0), Math.Pi / 2 );
    object.scale.set( 4, 4, 4 );

    scene.add(object);
  });

//   const clothTexture = new THREE.TextureLoader().load(cloth);
//   clothTexture.wrapS = THREE.RepeatWrapping;
//   clothTexture.wrapT = THREE.RepeatWrapping;
//   clothTexture.flipY = false;
//   clothTexture.minFilter = THREE.LinearFilter;
//   clothTexture.magFilter = THREE.LinearFilter;
//   clothTexture.generateMipmaps = false;
//   clothTexture.repeat.x = 4;
//   clothTexture.repeat.y = 2;

//   const tableMaterial = new THREE.MeshLambertMaterial({
//     color: 'green',
//     map: clothTexture,
//   });

//   const geometry = new THREE.PlaneGeometry(table.inner.width, table.inner.height);
//   const tablePlane = new THREE.Mesh(geometry, tableMaterial);
//   tablePlane.position.set(...table.inner.middle, 0);
//   tablePlane.receiveShadow = true;
//   scene.add(tablePlane);

  const specularShininess = 2 ** 8;

  const textureEquirec = new THREE.TextureLoader().load(env);
  textureEquirec.mapping = THREE.EquirectangularReflectionMapping;
  textureEquirec.magFilter = THREE.LinearFilter;
  textureEquirec.minFilter = THREE.LinearMipMapLinearFilter;
  textureEquirec.encoding = THREE.sRGBEncoding;
  textureEquirec.format = THREE.RGBFormat;

  balls.map((ball) => {
    const ballGeometry = new THREE.SphereGeometry(settings.ballR, 32, 16);

    const material = new THREE.MeshPhongMaterial({
      specular: 'white',
      reflectivity: 0.25,
      shininess: specularShininess,
      map: new THREE.TextureLoader().load(textures[ball.number || 0]),
      envMap: textureEquirec,
      combine: THREE.AddOperation,
    });

    const sphere = new THREE.Mesh(ballGeometry, material);
    sphere.position.set(ball.x, ball.y, settings.ballR);
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    scene.add(sphere);

    ball.sphere = sphere;
    return sphere;
  });
}

function createBall(color, number, col = 0, row = 0, half = false) {
  const x = col * 27;
  const y = row * 27;

  const ball = {
    position: vec2.fromValues(
      table.inner.x + 3 * (table.inner.width / 4) + x,
      table.inner.y + (table.inner.height / 2) + y,
    ),
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
    position: vec2.fromValues(
      table.inner.x + (table.inner.width / 4),
      table.inner.y + (table.inner.height / 2),
    ),
    get x() {
      return this.position[0];
    },
    get y() {
      return this.position[1];
    },
    color: 'white',
  };
  balls.push(whiteBall);

  createBall('black', 8);
  createBall('yellow', 1, -2);
  createBall('yellow', 9, -1, 0.5, true);
  createBall('green', 14, -1, -0.5, true);
  createBall('blue', 2, 0, -1);
  createBall('green', 6, 0, 1);
  createBall('orange', 13, 1, -1.5, true);
  createBall('darkred', 15, 1, -0.5, true);
  createBall('darkred', 7, 1, 0.5);
  createBall('blue', 10, 1, 1.5, true);

  createBall('orange', 5, 2, -2);
  createBall('purple', 12, 2, -1, true);
  createBall('purple', 4, 2, 0);
  createBall('red', 11, 2, 1, true);
  createBall('red', 3, 2, 2);
}

function setupCanvas() {
  setTable();
  createBalls();
  createScene();
}

function setupTest() {
  setTable();
  balls.length = 1;
  createBall('blue', 10, 1, 1.5, true);
  createScene();
}

function updatemouse(event) {
  if (!canvas) {
    return;
  }
  const rect = canvas.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.x) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.y) / rect.height) * 2 + 1;
}

function handleMove(event) {
  updatemouse(event);

  if (!scene) {
    return;
  }

  raycaster.setFromCamera(mouse, camera);

  // calculate objects intersecting the picking ray
  const intersects = raycaster.intersectObjects(scene.children);

  if (intersects[0]) {
    updateLine(new THREE.Vector3(intersects[0].point.x, intersects[0].point.y, settings.ballR),
      new THREE.Vector3(whiteBall.position[0], whiteBall.position[1], settings.ballR));
  }
}

function rotateBall(ball, power = ball.remainingPower || ball.power) {
  if (!ball.direction) {
    return;
  }

  const V = new THREE.Vector3(-1 * ball.direction[1], ball.direction[0], 0);
  ball.sphere.rotateOnWorldAxis(V, (V.length() * power) / settings.ballR);
}

function handleClick() {
  if (balls.some(ball => ball.power)) {
    return;
  }

  raycaster.setFromCamera(mouse, camera);

  // calculate objects intersecting the picking ray
  const intersects = raycaster.intersectObjects(scene.children);

  if (intersects[0]) {
    const click = vec2.fromValues(intersects[0].point.x, intersects[0].point.y);

    const ball = vec2.fromValues(whiteBall.x, whiteBall.y);

    const direction = vec2.sub(vec2.create(), ball, click);
    vec2.normalize(direction, direction);

    whiteBall.power = settings.power;
    whiteBall.direction = direction;
  }
}

function ballVSWall(ball, wall) {
  const newPos = vec2.scaleAndAdd(
    vec2.create(),
    ball.position,
    ball.direction,
    ball.remainingPower || ball.power,
  );

  if (newPos[0] - settings.ballR < wall.x) {
    const N = vec2.fromValues(wall.x - ball.x + settings.ballR, 0);

    const V = vec2.scale(vec2.create(), ball.direction, ball.power);

    const a = N[0] / V[0];

    const coll = vec2.scale(vec2.create(), V, a);

    ball.remainingPower = (1 - a) * ball.power;
    rotateBall(ball, a * ball.power);
    ball.position = vec2.add(ball.position, ball.position, coll);
    ball.direction = vec2.mul(vec2.create(), ball.direction, [-1, 1]);
    return true;
  }
  if (newPos[0] + settings.ballR > wall.x2) {
    const N = vec2.fromValues(wall.x2 - ball.x - settings.ballR, 0);

    const V = vec2.scale(vec2.create(), ball.direction, ball.power);

    const a = N[0] / V[0];

    const coll = vec2.scale(vec2.create(), V, a);

    ball.remainingPower = (1 - a) * ball.power;
    rotateBall(ball, a * ball.power);
    ball.position = vec2.add(ball.position, ball.position, coll);
    ball.direction = vec2.mul(vec2.create(), ball.direction, [-1, 1]);
    return true;
  }
  if (newPos[1] - settings.ballR < wall.y) {
    const N = vec2.fromValues(0, wall.y - ball.y + settings.ballR);

    const V = vec2.scale(vec2.create(), ball.direction, ball.power);

    const a = N[1] / V[1];

    const coll = vec2.scale(vec2.create(), V, a);

    ball.remainingPower = (1 - a) * ball.power;
    rotateBall(ball, a * ball.power);
    ball.position = vec2.add(ball.position, ball.position, coll);
    ball.direction = vec2.mul(vec2.create(), ball.direction, [1, -1]);
    return true;
  }
  if (newPos[1] + settings.ballR > wall.y2) {
    const N = vec2.fromValues(0, wall.y2 - ball.y - settings.ballR);

    const V = vec2.scale(vec2.create(), ball.direction, ball.power);

    const a = N[1] / V[1];

    const coll = vec2.scale(vec2.create(), V, a);

    ball.remainingPower = (1 - a) * ball.power;
    rotateBall(ball, a * ball.power);
    ball.position = vec2.add(ball.position, ball.position, coll);
    ball.direction = vec2.mul(vec2.create(), ball.direction, [1, -1]);
    return true;
  }
  return false;
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

  ballA.remainingPower = ballA.power * (remainder / movevecLen);
  ballB.remainingPower = ballB.power * (remainder / movevecLen);

  rotateBall(ballA, ballA.power - ballA.remainingPower);
  rotateBall(ballB, ballB.power - ballB.remainingPower);

  ballA.direction = angleA;
  ballB.direction = angleN;

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

function renderScene() {
  render.render(scene, camera);
}

function updateBalls() {
  balls.forEach(updateBall);
  balls.forEach((ball) => {
    ball.checked = false;
  });
}

function update() {
  updateBalls();

  controls.update();

  renderScene();
  window.requestAnimationFrame(update);
}

export default function Canvas() {
  const canvasRef = useRef();

  useEffect(() => {
    if (ctx) {
      return;
    }
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
      <button type="button" onClick={setupTest}>test!</button>
    </div>
  );
}
