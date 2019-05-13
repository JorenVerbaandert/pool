/* eslint-disable no-underscore-dangle */
/**
 * @author Eberhard Graether / http://egraether.com/
 * @author Mark Lundin   / http://mark-lundin.com
 * @author Simone Manini / http://daron1337.github.io
 * @author Luca Antiga   / http://lantiga.github.io
 */

import * as THREE from 'three';

export default function TrackballControls(object, domElement) {
  const self = this;
  const STATE = {
    NONE: -1, ROTATE: 0, ZOOM: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4,
  };

  this.object = object;
  this.domElement = (domElement !== undefined) ? domElement : document;

  // API

  this.enabled = true;

  this.screen = {
    left: 0, top: 0, width: 0, height: 0,
  };

  this.rotateSpeed = 1.0;
  this.zoomSpeed = 1.2;
  this.panSpeed = 0.3;

  this.noRotate = false;
  this.noZoom = false;
  this.noPan = false;

  this.staticMoving = false;
  this.dynamicDampingFactor = 0.2;

  this.minDistance = 0;
  this.maxDistance = Infinity;

  this.keys = [65 /* A */, 83 /* S */, 68];

  // internals

  this.target = new THREE.Vector3();

  const EPS = 0.000001;

  const lastPosition = new THREE.Vector3();

  let _state = STATE.NONE;
  let _prevState = STATE.NONE;

  const _eye = new THREE.Vector3();

  const _movePrev = new THREE.Vector2();
  const _moveCurr = new THREE.Vector2();

  const _lastAxis = new THREE.Vector3();
  let _lastAngle = 0;

  const _zoomStart = new THREE.Vector2();
  const _zoomEnd = new THREE.Vector2();

  let _touchZoomDistanceStart = 0;
  let _touchZoomDistanceEnd = 0;

  const _panStart = new THREE.Vector2();
  const _panEnd = new THREE.Vector2();

  // for reset

  this.target0 = this.target.clone();
  this.position0 = this.object.position.clone();
  this.up0 = this.object.up.clone();

  // events

  const changeEvent = { type: 'change' };
  const startEvent = { type: 'start' };
  const endEvent = { type: 'end' };


  // methods

  this.handleResize = () => {
    if (this.domElement === document) {
      this.screen.left = 0;
      this.screen.top = 0;
      this.screen.width = window.innerWidth;
      this.screen.height = window.innerHeight;
    } else {
      const box = this.domElement.getBoundingClientRect();
      // adjustments come from similar code in the jquery offset() function
      const d = this.domElement.ownerDocument.documentElement;
      this.screen.left = box.left + window.pageXOffset - d.clientLeft;
      this.screen.top = box.top + window.pageYOffset - d.clientTop;
      this.screen.width = box.width;
      this.screen.height = box.height;
    }
  };

  const getMouseOnScreen = (function getMouseOnScreen() {
    const vector = new THREE.Vector2();

    return (pageX, pageY) => {
      vector.set(
        (pageX - self.screen.left) / self.screen.width,
        (pageY - self.screen.top) / self.screen.height,
      );

      return vector;
    };
  }());

  const getMouseOnCircle = (function getMouseOnCircle() {
    const vector = new THREE.Vector2();

    return (pageX, pageY) => {
      vector.set(
        ((pageX - self.screen.width * 0.5 - self.screen.left) / (self.screen.width * 0.5)),
        ((self.screen.height + 2 * (self.screen.top - pageY)) / self.screen.width), // screen.width intentional
      );

      return vector;
    };
  }());

  this.rotateCamera = (function rotateCamera() {
    const axis = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const eyeDirection = new THREE.Vector3();
    const objectUpDirection = new THREE.Vector3();
    const objectSidewaysDirection = new THREE.Vector3();
    const moveDirection = new THREE.Vector3();
    let angle;

    return () => {
      moveDirection.set(_moveCurr.x - _movePrev.x, _moveCurr.y - _movePrev.y, 0);
      angle = moveDirection.length();

      if (angle) {
        _eye.copy(self.object.position).sub(self.target);

        eyeDirection.copy(_eye).normalize();
        objectUpDirection.copy(self.object.up).normalize();
        objectSidewaysDirection.crossVectors(objectUpDirection, eyeDirection).normalize();

        objectUpDirection.setLength(_moveCurr.y - _movePrev.y);
        objectSidewaysDirection.setLength(_moveCurr.x - _movePrev.x);

        moveDirection.copy(objectUpDirection.add(objectSidewaysDirection));

        axis.crossVectors(moveDirection, _eye).normalize();

        angle *= self.rotateSpeed;
        quaternion.setFromAxisAngle(axis, angle);

        _eye.applyQuaternion(quaternion);
        self.object.up.applyQuaternion(quaternion);

        _lastAxis.copy(axis);
        _lastAngle = angle;
      } else if (!self.staticMoving && _lastAngle) {
        _lastAngle *= Math.sqrt(1.0 - self.dynamicDampingFactor);
        _eye.copy(self.object.position).sub(self.target);
        quaternion.setFromAxisAngle(_lastAxis, _lastAngle);
        _eye.applyQuaternion(quaternion);
        self.object.up.applyQuaternion(quaternion);
      }

      _movePrev.copy(_moveCurr);
    };
  }());


  this.zoomCamera = () => {
    let factor;

    if (_state === STATE.TOUCH_ZOOM_PAN) {
      factor = _touchZoomDistanceStart / _touchZoomDistanceEnd;
      _touchZoomDistanceStart = _touchZoomDistanceEnd;
      _eye.multiplyScalar(factor);
    } else {
      factor = 1.0 + (_zoomEnd.y - _zoomStart.y) * self.zoomSpeed;

      if (factor !== 1.0 && factor > 0.0) {
        _eye.multiplyScalar(factor);
      }

      if (self.staticMoving) {
        _zoomStart.copy(_zoomEnd);
      } else {
        _zoomStart.y += (_zoomEnd.y - _zoomStart.y) * this.dynamicDampingFactor;
      }
    }
  };

  this.panCamera = (function panCamera() {
    const mouseChange = new THREE.Vector2();
    const objectUp = new THREE.Vector3();
    const pan = new THREE.Vector3();

    return () => {
      mouseChange.copy(_panEnd).sub(_panStart);

      if (mouseChange.lengthSq()) {
        mouseChange.multiplyScalar(_eye.length() * self.panSpeed);

        pan.copy(_eye).cross(self.object.up).setLength(mouseChange.x);
        pan.add(objectUp.copy(self.object.up).setLength(mouseChange.y));

        self.object.position.add(pan);
        self.target.add(pan);

        if (self.staticMoving) {
          _panStart.copy(_panEnd);
        } else {
          _panStart.add(mouseChange.subVectors(_panEnd, _panStart).multiplyScalar(self.dynamicDampingFactor));
        }
      }
    };
  }());

  this.checkDistances = () => {
    if (!self.noZoom || !self.noPan) {
      if (_eye.lengthSq() > self.maxDistance * self.maxDistance) {
        self.object.position.addVectors(self.target, _eye.setLength(self.maxDistance));
        _zoomStart.copy(_zoomEnd);
      }

      if (_eye.lengthSq() < self.minDistance * self.minDistance) {
        self.object.position.addVectors(self.target, _eye.setLength(self.minDistance));
        _zoomStart.copy(_zoomEnd);
      }
    }
  };

  this.update = () => {
    _eye.subVectors(self.object.position, self.target);

    if (!self.noRotate) {
      self.rotateCamera();
    }

    if (!self.noZoom) {
      self.zoomCamera();
    }

    if (!self.noPan) {
      self.panCamera();
    }

    self.object.position.addVectors(self.target, _eye);

    self.checkDistances();

    self.object.lookAt(self.target);

    if (lastPosition.distanceToSquared(self.object.position) > EPS) {
      self.dispatchEvent(changeEvent);

      lastPosition.copy(self.object.position);
    }
  };

  this.reset = () => {
    _state = STATE.NONE;
    _prevState = STATE.NONE;

    self.target.copy(self.target0);
    self.object.position.copy(self.position0);
    self.object.up.copy(self.up0);

    _eye.subVectors(self.object.position, self.target);

    self.object.lookAt(self.target);

    self.dispatchEvent(changeEvent);

    lastPosition.copy(self.object.position);
  };

  // listeners

  function keydown(event) {
    if (self.enabled === false) return;

    window.removeEventListener('keydown', keydown);

    _prevState = _state;

    // eslint-disable-next-line no-empty
    if (_state !== STATE.NONE) {


    } else if (event.keyCode === self.keys[STATE.ROTATE] && !self.noRotate) {
      _state = STATE.ROTATE;
    } else if (event.keyCode === self.keys[STATE.ZOOM] && !self.noZoom) {
      _state = STATE.ZOOM;
    } else if (event.keyCode === self.keys[STATE.PAN] && !self.noPan) {
      _state = STATE.PAN;
    }
  }

  function keyup() {
    if (self.enabled === false) return;

    _state = _prevState;

    window.addEventListener('keydown', keydown, false);
  }

  function mousemove(event) {
    if (self.enabled === false) return;

    event.preventDefault();
    event.stopPropagation();

    if (_state === STATE.ROTATE && !self.noRotate) {
      _movePrev.copy(_moveCurr);
      _moveCurr.copy(getMouseOnCircle(event.pageX, event.pageY));
    } else if (_state === STATE.ZOOM && !self.noZoom) {
      _zoomEnd.copy(getMouseOnScreen(event.pageX, event.pageY));
    } else if (_state === STATE.PAN && !self.noPan) {
      _panEnd.copy(getMouseOnScreen(event.pageX, event.pageY));
    }
  }

  function mouseup(event) {
    if (self.enabled === false) return;

    event.preventDefault();
    event.stopPropagation();

    _state = STATE.NONE;

    document.removeEventListener('mousemove', mousemove);
    document.removeEventListener('mouseup', mouseup);
    self.dispatchEvent(endEvent);
  }

  function mousedown(event) {
    if (self.enabled === false) return;

    event.preventDefault();
    event.stopPropagation();

    if (_state === STATE.NONE) {
      _state = event.button;
    }

    if (_state === STATE.ROTATE && !self.noRotate) {
      _moveCurr.copy(getMouseOnCircle(event.pageX, event.pageY));
      _movePrev.copy(_moveCurr);
    } else if (_state === STATE.ZOOM && !self.noZoom) {
      _zoomStart.copy(getMouseOnScreen(event.pageX, event.pageY));
      _zoomEnd.copy(_zoomStart);
    } else if (_state === STATE.PAN && !self.noPan) {
      _panStart.copy(getMouseOnScreen(event.pageX, event.pageY));
      _panEnd.copy(_panStart);
    }

    document.addEventListener('mousemove', mousemove, false);
    document.addEventListener('mouseup', mouseup, false);

    self.dispatchEvent(startEvent);
  }

  function mousewheel(event) {
    if (self.enabled === false) return;

    if (self.noZoom === true) return;

    event.preventDefault();
    event.stopPropagation();

    switch (event.deltaMode) {
      case 2:
        // Zoom in pages
        _zoomStart.y -= event.deltaY * 0.025;
        break;

      case 1:
        // Zoom in lines
        _zoomStart.y -= event.deltaY * 0.01;
        break;

      default:
        // undefined, 0, assume pixels
        _zoomStart.y -= event.deltaY * 0.00025;
        break;
    }

    self.dispatchEvent(startEvent);
    self.dispatchEvent(endEvent);
  }

  function touchstart(event) {
    if (self.enabled === false) return;

    event.preventDefault();

    switch (event.touches.length) {
      case 1:
        _state = STATE.TOUCH_ROTATE;
        _moveCurr.copy(getMouseOnCircle(event.touches[0].pageX, event.touches[0].pageY));
        _movePrev.copy(_moveCurr);
        break;

      default: { // 2 or more
        _state = STATE.TOUCH_ZOOM_PAN;
        const dx = event.touches[0].pageX - event.touches[1].pageX;
        const dy = event.touches[0].pageY - event.touches[1].pageY;
        _touchZoomDistanceStart = Math.sqrt(dx * dx + dy * dy);
        _touchZoomDistanceEnd = _touchZoomDistanceStart;

        const x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
        const y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
        _panStart.copy(getMouseOnScreen(x, y));
        _panEnd.copy(_panStart);
        break;
      }
    }

    self.dispatchEvent(startEvent);
  }

  function touchmove(event) {
    if (self.enabled === false) return;

    event.preventDefault();
    event.stopPropagation();

    switch (event.touches.length) {
      case 1:
        _movePrev.copy(_moveCurr);
        _moveCurr.copy(getMouseOnCircle(event.touches[0].pageX, event.touches[0].pageY));
        break;

      default: { // 2 or more
        const dx = event.touches[0].pageX - event.touches[1].pageX;
        const dy = event.touches[0].pageY - event.touches[1].pageY;
        _touchZoomDistanceEnd = Math.sqrt(dx * dx + dy * dy);

        const x = (event.touches[0].pageX + event.touches[1].pageX) / 2;
        const y = (event.touches[0].pageY + event.touches[1].pageY) / 2;
        _panEnd.copy(getMouseOnScreen(x, y));
        break;
      }
    }
  }

  function touchend(event) {
    if (self.enabled === false) return;

    switch (event.touches.length) {
      case 0:
        _state = STATE.NONE;
        break;

      case 1:
        _state = STATE.TOUCH_ROTATE;
        _moveCurr.copy(getMouseOnCircle(event.touches[0].pageX, event.touches[0].pageY));
        _movePrev.copy(_moveCurr);
        break;
      default:
        break;
    }

    self.dispatchEvent(endEvent);
  }

  function contextmenu(event) {
    if (self.enabled === false) return;

    event.preventDefault();
  }

  this.dispose = () => {
    this.domElement.removeEventListener('contextmenu', contextmenu, false);
    this.domElement.removeEventListener('mousedown', mousedown, false);
    this.domElement.removeEventListener('wheel', mousewheel, false);

    this.domElement.removeEventListener('touchstart', touchstart, false);
    this.domElement.removeEventListener('touchend', touchend, false);
    this.domElement.removeEventListener('touchmove', touchmove, false);

    document.removeEventListener('mousemove', mousemove, false);
    document.removeEventListener('mouseup', mouseup, false);

    window.removeEventListener('keydown', keydown, false);
    window.removeEventListener('keyup', keyup, false);
  };

  this.domElement.addEventListener('contextmenu', contextmenu, false);
  this.domElement.addEventListener('mousedown', mousedown, false);
  this.domElement.addEventListener('wheel', mousewheel, false);

  this.domElement.addEventListener('touchstart', touchstart, false);
  this.domElement.addEventListener('touchend', touchend, false);
  this.domElement.addEventListener('touchmove', touchmove, false);

  window.addEventListener('keydown', keydown, false);
  window.addEventListener('keyup', keyup, false);

  this.handleResize();

  // force an update at start
  this.update();
}

TrackballControls.prototype = Object.create(THREE.EventDispatcher.prototype);
TrackballControls.prototype.constructor = TrackballControls;
