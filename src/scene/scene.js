import * as THREE from 'three';
import env from '../images/garage_1k.jpg';
import TrackballControls from './trackBallControls';
import loadTable from '../jeroenTable';
import ball1 from '../images/Ball1.jpg';
import ball2 from '../images/Ball2.jpg';
import ball3 from '../images/Ball3.jpg';
import ball4 from '../images/Ball4.jpg';
import ball5 from '../images/Ball5.jpg';
import ball6 from '../images/Ball6.jpg';
import ball7 from '../images/Ball7.jpg';
import ball8 from '../images/Ball8.jpg';
import ball9 from '../images/Ball9.jpg';
import ball10 from '../images/Ball10.jpg';
import ball11 from '../images/Ball11.jpg';
import ball12 from '../images/Ball12.jpg';
import ball13 from '../images/Ball13.jpg';
import ball14 from '../images/Ball14.jpg';
import ball15 from '../images/Ball15.jpg';
import ballCue from '../images/BallCue.jpg';

import Physijs from '../physics/physi';

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

let render = null;
let scene = null;
let camera = null;
let controls = null;
let canvas = null;
let line = null;
let whiteBall = null;
let intersectionPlane = null;
const settings = {};

const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

let Physics = Physijs();

Physics.scripts.worker = 'physijs_worker.js';
Physics.scripts.ammo = 'ammo.js';

function updateLine(origin, target) {
  const positions = line.geometry.attributes.position.array;
  positions[0] = origin.x;
  positions[1] = settings.ballR;
  positions[2] = origin.y;
  positions[3] = target.x;
  positions[4] = settings.ballR;
  positions[5] = target.y;
  line.geometry.attributes.position.needsUpdate = true;
}

function updatemouse(event) {
  if (!canvas) {
    return;
  }
  const rect = canvas.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.x) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.y) / rect.height) * 2 + 1;
}

export function getIntersectsWithPlane() {
  // calculate objects intersecting the picking ray
  const intersect = raycaster.intersectObject(intersectionPlane);

  if (intersect[0]) {
    return intersect[0].point;
  }
  return null;
}

export function handleMove(event) {
  updatemouse(event);

  if (!scene) {
    return;
  }

  raycaster.setFromCamera(mouse, camera);

  // calculate objects intersecting the picking ray
  const intersects = raycaster.intersectObjects(scene.children);

  if (intersects[0]) {
    updateLine(new THREE.Vector3(intersects[0].point.x, settings.ballR, intersects[0].point.z),
      new THREE.Vector3(whiteBall.position[0], settings.ballR, whiteBall.position[1]));
  }
}

function renderScene() {
  scene.simulate();
  render.render(scene, camera);
}

export function renderAll() {
  controls.update();
  renderScene();
}

export function createScene(
  balls, argCanvas, width, height, argsettings,
  table, argWhiteBall,
) {
  canvas = argCanvas;
  whiteBall = argWhiteBall;
  Object.assign(settings, argsettings);
  render = new THREE.WebGLRenderer({ canvas, antialias: true });

  render.setClearColor(0x000000, 1);
  // render.setClearColor( 0xffffff, 1 );
  render.setSize(width, height);
  render.shadowMap.enabled = true;
  render.shadowMapSoft = true;

  scene = new Physics.Scene;
  scene.setGravity (new THREE.Vector3( 0, -1000, 0 ) );
  const aspect = width / height;

  // intersection plane
  const geometry = new THREE.PlaneGeometry(5000, 5000, 2);
  const material = new THREE.MeshBasicMaterial({ color: 0x248f24, alphaTest: 0, visible: false});

  intersectionPlane = new THREE.Mesh(geometry, material);
   
  let linearDamping = 0.8;
  let angularDamping = 0.8;

  intersectionPlane.rotateX(-Math.PI);
  intersectionPlane.__dirtyRotation = true;

  scene.add(intersectionPlane);

  // Lights

  var spotLight = new THREE.SpotLight( 0xffffff );
  spotLight.position.set( table.inner.middle[0], 1200, table.inner.middle[1] );

  spotLight.castShadow = true;

  spotLight.shadow.mapSize.width = 4048;
  spotLight.shadow.mapSize.height = 4048;

  spotLight.shadow.camera.near = 10;
  spotLight.shadow.camera.far = 4000;
  spotLight.shadow.camera.fov = 55;

  scene.add( spotLight );

  const light = new THREE.AmbientLight(0x505050);
  scene.add(light);

  // line

  const linegeometry = new THREE.BufferGeometry();

  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffff00, side: THREE.DoubleSide });
  const positions = new Float32Array(2 * 3);
  linegeometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
  linegeometry.setDrawRange(0, 2);

  line = new THREE.Line(linegeometry, lineMaterial);

  updateLine(
    new THREE.Vector3(whiteBall.position[0], 1, whiteBall.position[1]),
    new THREE.Vector3(0, 1, 0),
  );

  scene.add(line);

  // Camera

  camera = new THREE.PerspectiveCamera(45, aspect, 1, 10000);
  camera.position.set(table.inner.middle[0], 1000, table.inner.middle[1]);
  camera.lookAt(new THREE.Vector3(table.inner.middle[0], 0, table.inner.middle[1]));

  scene.add(camera);

  // Controls

  controls = new TrackballControls(camera);

  controls.rotateSpeed = 1.0;
  controls.zoomSpeed = 1.2;
  controls.panSpeed = 0.8;
  controls.noZoom = false;
  controls.noPan = false;
  controls.staticMoving = true;
  controls.dynamicDampingFactor = 0.3;
  controls.keys = [65, 83, 68];
  controls.addEventListener('change', renderScene);

  // Table

  loadTable(scene);
  
  // collision PlaneMesh

  const tmpCollisionMaterial = Physics.createMaterial(
    new THREE.MeshNormalMaterial({ color: "red", side: THREE.DoubleSide, visible: true }),
    0, 1
  );
  
  const left = new THREE.BoxGeometry(1000, 1000, 10);
  let leftPlane = new Physics.BoxMesh(left, tmpCollisionMaterial, 0);

  leftPlane.translateX(1000);
  leftPlane.translateY(0);
  leftPlane.translateZ(200);
  leftPlane.__dirtyPosition = true;

  leftPlane.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeRotationX( -Math.PI / 2 ));
  leftPlane.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeRotationY( -Math.PI / 2 ));
  leftPlane.__dirtyRotation = true;

  scene.add(leftPlane);

  const bottom = new THREE.BoxGeometry(2000, 1000, 1);
  let bottomtPlane = new Physics.BoxMesh(bottom, tmpCollisionMaterial, 0);

  bottomtPlane.translateX(1000);
  bottomtPlane.translateY(0);
  bottomtPlane.translateZ(200);
  bottomtPlane.__dirtyPosition = true;

  bottomtPlane.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeRotationX( -Math.PI / 2 ));
  bottomtPlane.__dirtyRotation = true;

  scene.add(bottomtPlane);

  const right = new THREE.BoxGeometry(1000, 1000, 10);
  let rightPlane = new Physics.BoxMesh(right, tmpCollisionMaterial, 0);

  rightPlane.translateX(1000);
  rightPlane.translateY(0);
  rightPlane.translateZ(0);
  rightPlane.__dirtyPosition = true;

  rightPlane.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeRotationZ( -Math.PI / 2 ));
  rightPlane.__dirtyRotation = true;

  scene.add(rightPlane);

  const textureEquirec = new THREE.TextureLoader().load(env);
  textureEquirec.mapping = THREE.EquirectangularReflectionMapping;
  textureEquirec.magFilter = THREE.LinearFilter;
  textureEquirec.minFilter = THREE.LinearMipMapLinearFilter;
  textureEquirec.encoding = THREE.sRGBEncoding;
  textureEquirec.format = THREE.RGBFormat;

  balls.forEach((ball) => {
    const ballGeometry = new THREE.SphereGeometry(settings.ballR, 32, 16);

    const ballMaterial = Physics.createMaterial(
       new THREE.MeshPhysicalMaterial({
        roughness: 0.12,
        reflectivity: 0.9,
        metalness: 0,
        map: new THREE.TextureLoader().load(textures[ball.number || 0]),
        envMap: textureEquirec,
        color: new THREE.Color(0.8, 0.8, 0.6) 
      }),
      0.9,
      0.99
    )

    let sphere = new Physics.SphereMesh(ballGeometry, ballMaterial, 3);
    sphere.position.set(ball.x, settings.ballR, ball.y);
    sphere.castShadow = true;
    sphere.receiveShadow = true;

    sphere.setDamping(linearDamping, angularDamping);
    scene.add(sphere);

    ball.sphere = sphere;
  });
  controls.target = new THREE.Vector3(table.inner.middle[0], -200, table.inner.middle[1]);

  return { balls, render };
}
