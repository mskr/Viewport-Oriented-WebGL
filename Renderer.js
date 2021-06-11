import * as THREE from '../../components/three/build/three.module.js';
import renderCanvas from './renderCanvas.js';
import Viewport from './Viewport.js';

// Interface class

export class ScreenLayout {
  constructor() {
    this.viewports = [];
  }
  update() {
  }
}

// A screen layout with only one viewport

export class SingleScreen extends ScreenLayout {

  constructor(viewport0) {
    super();
    this.viewports = [viewport0];
  }

  update() {
    this.viewports[0].update();
  }

}

// A screen layout splitting the screen in two halfs

export class SplitScreen extends ScreenLayout {

  constructor(viewport0, viewport1) {
    super();
    this.viewports = [viewport0, viewport1];
  }

  update() {
    if (window.innerHeight > window.innerWidth) {
      // viewport0 = top
      this.viewports[0].x = 0;
      this.viewports[0].y = 0.5 * window.innerHeight;
      this.viewports[0].w = window.innerWidth;
      this.viewports[0].h = window.innerHeight * 0.5;
      // viewport1 = bottom
      this.viewports[1].x = 0;
      this.viewports[1].y = 0;
      this.viewports[1].w = window.innerWidth;
      this.viewports[1].h = window.innerHeight * 0.5;
    } else {
      // viewport0 = left
      this.viewports[0].x = 0;
      this.viewports[0].y = 0;
      this.viewports[0].w = window.innerWidth * 0.5;
      this.viewports[0].h = window.innerHeight;
      // viewport1 = right
      this.viewports[1].x = 0.5 * window.innerWidth;
      this.viewports[1].y = 0;
      this.viewports[1].w = window.innerWidth * 0.5;
      this.viewports[1].h = window.innerHeight;
    }
    this.viewports[0].update();
    this.viewports[1].update();
  }

}

// This renderer can render a scene in multiple viewports

export class Renderer extends THREE.WebGLRenderer {

  constructor(scene) {

    super({
      canvas: renderCanvas(),
      antialias: true
    });

    this.scene = scene;
    this.clock = new THREE.Clock();

    this.setPixelRatio(window.devicePixelRatio);
    this.setSize(window.innerWidth, window.innerHeight);
    window.addEventListener('resize', event => {
      this.setSize(window.innerWidth, window.innerHeight);
    });

  }

  renderLayout(screenLayout) {

    const dt = this.clock.getDelta();

    screenLayout.update();

    this.setScissorTest(true);
    
    for (let i in screenLayout.viewports) {

      this.setViewport(
        screenLayout.viewports[i].x, 
        screenLayout.viewports[i].y, 
        screenLayout.viewports[i].w, 
        screenLayout.viewports[i].h);

      this.setScissor(
        screenLayout.viewports[i].x, 
        screenLayout.viewports[i].y, 
        screenLayout.viewports[i].w, 
        screenLayout.viewports[i].h);

      if (screenLayout.viewports[i].camera.userData.controls) {
        screenLayout.viewports[i].camera.userData.controls.update(dt);
      }

      this.render(this.scene, screenLayout.viewports[i].camera);
    }

  }
}

//TODO create LowEndRenderer and HighEndRenderer with switch based on device detection