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
    updateLine(new THREE.Vector3(intersects[0].point.x, intersects[0].point.y, settings.ballR),
      new THREE.Vector3(whiteBall.position[0], whiteBall.position[1], settings.ballR));
  }
}

function renderScene() {
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

  scene = new THREE.Scene();
  const aspect = width / height;

  // intersection plane
  const geometry = new THREE.PlaneGeometry(5000, 5000, 2);
  const material = new THREE.MeshBasicMaterial({ color: 0x248f24, alphaTest: 0, visible: false });
  intersectionPlane = new THREE.Mesh(geometry, material);
  scene.add(intersectionPlane);

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
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;

  scene.add(directionalLight);

  const light = new THREE.AmbientLight(0x404040);
  scene.add(light);

  // line

  const linegeometry = new THREE.BufferGeometry();

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

  const textureEquirec = new THREE.TextureLoader().load(env);
  textureEquirec.mapping = THREE.EquirectangularReflectionMapping;
  textureEquirec.magFilter = THREE.LinearFilter;
  textureEquirec.minFilter = THREE.LinearMipMapLinearFilter;
  textureEquirec.encoding = THREE.sRGBEncoding;
  textureEquirec.format = THREE.RGBFormat;

  balls.forEach((ball) => {
    const ballGeometry = new THREE.SphereGeometry(settings.ballR, 32, 16);

    const ballMaterial = new THREE.MeshPhysicalMaterial({
      reflectivity: 0.2,
      roughness: 0.12,
      reflectivity: 0.9,
      metalness: 0,
      map: new THREE.TextureLoader().load(textures[ball.number || 0]),
      envMap: textureEquirec,
      color: new THREE.Color(0.8, 0.8, 0.6) 
    });

    const sphere = new THREE.Mesh(ballGeometry, ballMaterial);
    sphere.position.set(ball.x, ball.y, settings.ballR);
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    scene.add(sphere);

    ball.sphere = sphere;
  });

  return { balls, render };
}
