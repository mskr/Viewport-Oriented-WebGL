import * as THREE from '../../components/three/build/three.module.js';

// Viewport projects 3D space to a 2D portion of the screen using a camera.
// It can be used to build ScreenLayouts.

export default class Viewport {
  
  constructor(camera) {
    this.camera = camera;
    this.x = 0;
    this.y = 0;
    this.w = window.innerWidth;
    this.h = window.innerHeight;
  }

  getNDC2(x, y) {
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    let ndc = new THREE.Vector2();
    ndc.x = ( x / (this.w + this.x) ) * 2 - 1;
    ndc.y = (y / this.h * (-1) + 0.5) * 2; // top half
    return ndc;
  }

  toLocalNDC2(pointer) {
    let coord = Object.assign({}, pointer);
    const xFactor = this.w / window.innerWidth;
    const xOffset = this.x / window.innerWidth;
    const yFactor = this.h / window.innerHeight;
    const yOffset = this.y / window.innerHeight;
    if (xFactor < 1) {
      coord.x = (pointer.x + xFactor) / xFactor - (4 * xOffset);
    }
    if (yFactor < 1) {
      coord.y = (pointer.y - yOffset) / yFactor;
    }
    return coord;
  }

  monkeypatchPointer(thisArg, fn) {
    const that = this;
    return function(pointer) {
      return fn.call(thisArg, that.toLocalNDC2(pointer));
    }
  }

  // Check if pointer event happened inside viewport.
  // Can be used to get the viewport for an event.
  // Can also be used to prevent triggering events in other viewports.

  checkPointerEvent(event) {
    const ndc = this.getNDC2(event.clientX, event.clientY);
    if (ndc.x < -1 || ndc.x > 1 || ndc.y < -1 || ndc.y > 1) {
      event.stopPropagation();
      event.preventDefault();
      return false;
    }
    return true;
  }

  update() {
    this.camera.fov = this.w < 750 ? 70 : 50;
    this.camera.aspect = this.w / this.h;
    this.camera.updateProjectionMatrix();
  }

}