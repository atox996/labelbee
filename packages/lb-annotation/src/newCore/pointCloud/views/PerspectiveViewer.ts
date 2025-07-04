import { PerspectiveCamera, Vector3 } from 'three';

import type { ActionName } from '../actions';
import type ShareScene from '../common/ShareScene';
import Viewer from './Viewer';

interface ViewerConfig {
  name?: string;
  actions?: ActionName[];
}

const _vec3a = new Vector3();
const _vec3b = new Vector3();

const DEFAULT_ACTIONS: ActionName[] = ['Select', 'OrbitControls'];

export default class PerspectiveViewer extends Viewer {
  camera: PerspectiveCamera;

  constructor(container: HTMLElement, shareScene: ShareScene, config: ViewerConfig = {}) {
    super(container, shareScene, config.name);

    this.camera = new PerspectiveCamera(45, this.aspect, 1, 30000);
    this.camera.position.set(-0.01, 0, 100);

    this.setActions(...(config.actions || DEFAULT_ACTIONS));
    this.initEvent();
  }

  private _onSelect = () => {
    const instanceId = [...this.shareScene.selection.values()].at(-1);

    if (instanceId) {
      if (this.autoFocus) this.focus(instanceId);
    } else {
      this.focusInstanceId = undefined;
    }
    this.render();
  };

  initEvent(): void {
    this.shareScene.addEventListener('select', this._onSelect);
  }

  disposeEvent(): void {
    this.shareScene.removeEventListener('select', this._onSelect);
  }

  resize(): void {
    this.camera.aspect = this.aspect;
    this.camera.updateProjectionMatrix();
    super.resize();
  }

  focus(instanceId = this.focusInstanceId): void {
    if (!instanceId) return;
    this.focusInstanceId = instanceId;

    _vec3a.copy(this.shareScene.boxes.getWorldPosition(instanceId));

    const action = this.getAction('OrbitControls');
    if (action) {
      _vec3b.copy(action.controller.target);
      action.focus(_vec3a);
    } else {
      _vec3b.setScalar(0);
      this.camera.lookAt(_vec3a);
    }
    _vec3b.subVectors(this.camera.position, _vec3b).add(_vec3a);

    this.tween({
      from: this.camera.position,
      to: _vec3b,
    });
  }

  renderFrame(): void {
    // TODO: 定制化渲染
    const { scene } = this.shareScene;
    this.renderer.render(scene, this.camera);
  }
}
