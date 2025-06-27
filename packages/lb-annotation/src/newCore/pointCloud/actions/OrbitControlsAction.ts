import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { Vector3 } from 'three';
import Viewer from '../views/Viewer';
import Action from './Action';

export default class OrbitControlsAction extends Action {
  controller: OrbitControls;

  constructor(viewer: Viewer) {
    super(viewer);

    this.controller = new OrbitControls(viewer.camera, viewer.renderer.domElement);
    // 透视相机才可以旋转
    this.controller.enableRotate = 'isPerspectiveCamera' in viewer.camera;
    this.controller.addEventListener('change', () => viewer.render());
  }

  focus(pos?: Vector3) {
    if (pos) {
      this.controller.target.copy(pos);
    } else {
      this.controller.target.setScalar(0);
    }
  }

  toggle(enabled?: boolean): void {
    super.toggle(enabled);
    this.controller.enabled = this.enabled;
  }

  init(): void {}

  dispose(): void {
    this.controller.dispose();
  }
}
