import { PerspectiveCamera, Vector3 } from 'three';

import type ShareScene from '../common/ShareScene';
import Viewer from './Viewer';
import { ActionName } from '../actions';
import Box3D from '../common/objects/Box3D';
import { createTween } from '../utils/tween';

interface ViewerConfig {
  name?: string;
  actions?: ActionName[];
}

const _vec3a = new Vector3();
const _vec3b = new Vector3();
const _vec3c = new Vector3();

const tween = createTween();

const DEFAULT_ACTIONS: ActionName[] = ['Select', 'OrbitControls'];

export default class PerspectiveViewer extends Viewer {
  camera: PerspectiveCamera;

  constructor(container: HTMLElement, shareScene: ShareScene, config: ViewerConfig = {}) {
    super(container, shareScene, config.name);

    this.camera = new PerspectiveCamera(45, this.aspect, 1, 30000);
    this.camera.position.set(-0.01, 0, 100);

    this.setActions(...(config.actions || DEFAULT_ACTIONS));
  }

  initEvent(): void {
    this.shareScene.addEventListener('select', ({ selection }) => {
      const object = selection.find((o) => o instanceof Box3D);

      if (object) {
        if (this.autoFocus) this.focus(object);
      } else {
        this.focusObject = undefined;
      }
      this.render();
    });
  }

  resize(): void {
    this.camera.aspect = this.aspect;
    this.camera.updateProjectionMatrix();
    super.resize();
  }

  focus(object = this.focusObject): void {
    if (!object) return;
    this.focusObject = object;

    object.getWorldPosition(_vec3a);

    const action = this.getAction('OrbitControls');
    if (action) {
      _vec3b.copy(action.controller.target);
    } else {
      _vec3b.setScalar(0);
    }
    _vec3c.subVectors(this.camera.position, _vec3b).add(_vec3a);

    tween.start({
      from: this.camera.position,
      to: _vec3c,
      duration: 200,
      onUpdate: (_, elapsed) => {
        if (action) {
          _vec3b.copy(_vec3a).multiplyScalar(elapsed);
          action.focus(_vec3b);
        }
        this.render();
      },
    });
  }

  renderFrame(): void {
    // TODO: 定制化渲染
    const { scene } = this.shareScene;
    this.renderer.render(scene, this.camera);
  }
}
