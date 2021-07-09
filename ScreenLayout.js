import * as THREE from '../../components/three/build/three.module.js';
import { OrbitControls } from '../../components/three/examples/jsm/controls/OrbitControls.js';
import { LineGeometry } from '../../components/three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from '../../components/three/examples/jsm/lines/LineMaterial.js';
import { Line2 } from '../../components/three/examples/jsm/lines/Line2.js';

//

const SupportedCameraControls = {
  OrbitControls: OrbitControls
}

//

function rgb(hue, optionalPastel) {

  hue /= 360;

  const s = 1;
  const l = optionalPastel ? 0.875 : 0.5;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const onethird = 1 / 3;

  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  return {
    r: hue2rgb(p, q, hue + onethird),
    g: hue2rgb(p, q, hue),
    b: hue2rgb(p, q, hue - onethird)
  }

}

// Viewport projects 3D space to a 2D portion of the screen using a camera.
// It can be used to build ScreenLayouts.
// When this is tested enough it should be moved to three-utils.

// Todo:
// Viewport is like magic glasses.
// It can add things to the scene.
// It should be able to remove things from the scene.
// It should be able to change the appearance of things.

export class Viewport {
  
  constructor(arg1, arg2) {

    this.x = 0;
    this.y = 0;
    this.w = window.innerWidth;
    this.h = window.innerHeight;

    //Todo delete all webgl-viewport-helpers first
    
    this.domElement = document.createElement('div');

    this.domElement.style.position = 'fixed';

    this.domElement.style.pointerEvents = 'none';

    this.domElement.classList.add('webgl-viewport-helper');

    document.body.appendChild(this.domElement);

    //

    if (typeof arg1 === 'string') {
      this.domElement.style.pointerEvents = arg1;
      this.acceptPointerEvents = arg1 !== 'none';
    }

    if (typeof arg2 === 'string') {
      this.domElement.style.pointerEvents = arg2;
      this.acceptPointerEvents = arg2 !== 'none';
    }

    if (typeof arg1 === 'object') {
      this.setCamera(arg1);
    } else {
      this.setOrthographic();
    }

    this.objects3D = new THREE.Scene();
    this.backgroundObjects3D = new THREE.Scene();

    // Uncomment to visualize viewports
    // var hue = Math.floor(Math.random() * 360);
    // var pastel = 'hsl(' + hue + ', 100%, 87.5%)';
    // this.domElement.style.background = pastel;

    this.lineMaterials = [];
  }

  // Pixel size lines according to:
  // https://github.com/mrdoob/three.js/blob/dev/examples/webgl_geometry_spline_editor.html#L270

  Line(points, optionalHue) {

    const neon = rgb(optionalHue || 0);

    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color(neon.r, neon.g, neon.b)
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute( 'position', new THREE.BufferAttribute(new Float32Array( points.length * 3 ), 3) );

    for (let i = 0; i < points.length; i++) {
      geometry.attributes.position.setXYZ(i, points[i].x, points[i].y, points[i].z);
    }

    const mesh = new THREE.Line( geometry.clone(), material);

    return mesh;

  }

  //Todo: Smoothly curved lines with color buffer
  // https://threejs.org/examples/?q=line#webgl_lines_colors

  // Pixel size lines with thickness
  
  FatLine(points, hue = 0) {

    const color = rgb(hue);

    const positions = [];
    const colors = [];

    points.forEach(p => {
      positions.push(p.x, p.y, p.z)
      colors.push(color.r, color.g, color.b)
    });

    const geo = new LineGeometry();
    geo.setPositions(positions);
    geo.setColors(colors);
    const mat = new LineMaterial({

      color: 0xffffff,
      linewidth: 5, // in pixels
      vertexColors: true,
      //resolution:  // to be set by renderer, eventually
      dashed: false,
      alphaToCoverage: true,

    });

    this.lineMaterials.push(mat);

    const line = new Line2(geo, mat);
    line.computeLineDistances();
    line.scale.set(1, 1, 1);

    return line;

  }

  //

  update() {

    //Todo: Finish thick line rendering according to
    // https://github.com/mrdoob/three.js/blob/master/examples/webgl_lines_fat.html#L170

    this.lineMaterials.forEach(mat => mat.resolution.set(this.w, this.h));

    //

    this.domElement.style.width = this.w + 'px';
    this.domElement.style.height = this.h + 'px';
    this.domElement.style.left = this.x + 'px';
    this.domElement.style.bottom = this.y + 'px';

    //

    if ( this.camera.isOrthographicCamera ) {

      this.camera.setViewOffset(window.innerWidth, window.innerHeight, this.x, this.y, this.w, this.h);

    } else {

      this.camera.fov = this.w < 750 ? 70 : 50;
      this.camera.aspect = this.w / this.h;
      this.camera.updateProjectionMatrix();

    }

  }

  //

  setPerspective() {

    const cam = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 8000);

    this.setCamera(cam);

  }

  //

  setOrthographic() {

    const cam = new THREE.OrthographicCamera(this.w / - 2, this.w / 2, this.h / 2, this.h / - 2, 0, 8000);

    this.setCamera(cam);

  }

  //

  setCamera(cam) {

    this.camera = cam;

    this.setCameraControls();

  }

  //

  setUpVector(up) {
    this.camera.up.copy(up);
  }

  //

  setCameraControls(name) {

    if (this.acceptPointerEvents) {

      if (this.camera) {
        if (this.camera.userData.controls) {
          this.camera.userData.controls.dispose();
        }
      }

      const C = SupportedCameraControls[name];

      if (C) {

        this.camera.userData.controls = new C(this.camera, this.domElement);

      } else {

        this.camera.userData.controls = new OrbitControls(this.camera, this.domElement);
        this.camera.userData.controls.movementSpeed = 100;
        this.camera.userData.controls.zoomSpeed = 0.9;
        this.camera.userData.controls.dragToLook = true;
        this.camera.userData.controls.mouseButtons = {
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.PAN,
          RIGHT: THREE.MOUSE.PAN
        };

      }

    }

  }

  //

  enable() {
    this.domElement.style.display = 'block';
  }

  disable() {
    this.domElement.style.display = 'none';
  }
  
  // normalize mouse / touch pointer and remap {x,y} to view space.
  //  - taken from THREE.TransformControls

  getPointer( event ) {

    if ( this.domElement.ownerDocument.pointerLockElement ) {

      return {
        x: 0,
        y: 0,
        button: event.button
      };

    } else {

      var pointer = event.changedTouches ? event.changedTouches[ 0 ] : event;

      var rect = this.domElement.getBoundingClientRect();

      return {
        x: ( pointer.clientX - rect.left ) / rect.width * 2 - 1,
        y: - ( pointer.clientY - rect.top ) / rect.height * 2 + 1,
        button: event.button
      };

    }

  }

  // Check if pointer event happened inside viewport.
  // Can be used to get the viewport for an event.
  // Can also be used to prevent triggering events in other viewports.

  capturePointerEvent(event) {
    const ndc2 = new THREE.Vector2( this.ndcX(event.clientX), this.ndcY(event.clientY) );
    if (ndc2.x < -1 || ndc2.x > 1 || ndc2.y < -1 || ndc2.y > 1) {
      event.stopPropagation();
      return true;
    }
    return false;
  }

  ndcX(clientX, space = 'window') {
    const scaling = x => x * (this.w / window.innerWidth);
    const translation = x => x + (this.x / window.innerWidth);
    switch (space) {
      case 'globalNDC':
        return scaling(translation(clientX));
      case 'window': 
      default:
        return ( clientX / (this.w + this.x) ) * 2 - 1;
    }
  }

  ndcY(clientY, space = 'window') {
    const scaling = y => y * (this.h / window.innerHeight);
    const translation = y => y + (this.y / window.innerHeight);
    switch (space) {
      case 'globalNDC':
        return scaling(translation(clientY));
      case 'window': 
      default:
        return (clientY / this.h * (-1) + 0.5) * 2; // top half
    }
  }

}

// -----------

// Raycaster

// -----------

// This raycaster takes all its config from a viewport.
// Usage: const raycaster = new Raycaster(viewport = new Viewport('auto'));
// Usage: viewport.domElement.addEventListener('click', raycaster.intersect(obj => obj.material.color = 0xff0000))

export class Raycaster extends THREE.Raycaster {

  constructor(viewport) {
    super();
    this.viewport = viewport;
    this.intersect = this.intersect.bind(this);
  }

  compute(event) {

    this.setFromCamera(
      this.viewport.getPointer(event), 
      this.viewport.camera);

    return this.intersectObjects(this.viewport.objects3D.children);

  }

  intersect(callback) {
    return event => {
      callback(this.compute(event)[0]);
    }
  }

}

// -----------

// SceenLayout

// -----------

// Interface class

export class ScreenLayout {
  constructor() {
    this.viewports = [];
  }
  update() {
  }
}

//

export const Borders = {
  top: 48,
  bottom: 16,
  left: 0,
  right: 100
}

// Base class for border layouts.
// Border layout allows to make space for toolbars, statusbars and sidebars.

export class BorderLayout extends ScreenLayout {
  
  constructor(borders) {
    super();
    this.borders = borders || { top: 0, bottom: 0, left: 0, right: 0 };
  }

  update() {
  }

}

// A screen layout with only one viewport.

export class SingleScreen extends BorderLayout {

  constructor(viewport0, optionalBorders) {
    super(optionalBorders);
    this.viewports = [viewport0];
  }

  update() {
    this.viewports[0].update();
  }

}

// A screen layout splitting the screen in two halfs (50:50).
// This layout is responsive, i.e.
// wide screens will have side by side,
// portrait screens will have top/bottom layout.

export class SplitScreen extends BorderLayout {

  constructor(viewport0, viewport1, optionalBorders) {
    super(optionalBorders);
    this.viewports = [viewport0, viewport1];
  }

  update() {
    const wiH = window.innerHeight - this.borders.bottom - this.borders.top;
    const wiW = window.innerWidth - this.borders.left - this.borders.right;
    if (wiH > wiW) {
      // viewport0 = top
      this.viewports[0].x = this.borders.left;
      this.viewports[0].y = this.borders.bottom + 0.5 * wiH;
      this.viewports[0].w = wiW;
      this.viewports[0].h = wiH * 0.5;
      // viewport1 = bottom
      this.viewports[1].x = this.borders.left;
      this.viewports[1].y = this.borders.bottom;
      this.viewports[1].w = wiW;
      this.viewports[1].h = wiH * 0.5;
    } else {
      // viewport0 = left
      this.viewports[0].x = this.borders.left;
      this.viewports[0].y = this.borders.bottom;
      this.viewports[0].w = wiW * 0.5;
      this.viewports[0].h = wiH;
      // viewport1 = right
      this.viewports[1].x = this.borders.left + 0.5 * wiW;
      this.viewports[1].y = this.borders.bottom;
      this.viewports[1].w = wiW * 0.5;
      this.viewports[1].h = wiH;
    }
    this.viewports[0].update();
    this.viewports[1].update();
  }

}