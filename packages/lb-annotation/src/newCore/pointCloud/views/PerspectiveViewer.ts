import { Box3, MathUtils, PerspectiveCamera, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';

import type ShareScene from '../common/ShareScene';
import Viewer from './Viewer';

interface ViewerConfig {
  name?: string;
}

export default class PerspectiveViewer extends Viewer {
  camera: PerspectiveCamera;

  controls: OrbitControls;

  constructor(container: HTMLElement, shareScene: ShareScene, config: ViewerConfig = {}) {
    super(container, shareScene, config.name);

    this.camera = new PerspectiveCamera(45, this.width / this.height, 1, 30000);
    this.camera.position.set(-0.01, 0, 100);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.addEventListener('change', () => this.render());
  }

  initEvent(): void {
    console.log('initEvent');
  }

  resize(): void {
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    super.resize();
  }

  focus(object = this.focusObject): void {
    this.focusObject = object;
    if (!object) return;
    const box = new Box3().setFromObject(object);
    const center = box.getCenter(new Vector3());
    const size = box.getSize(new Vector3());
    const radius = size.length() * 0.5;
    const fov = MathUtils.degToRad(this.camera.fov);
    const distance = radius / Math.sin(fov / 2);
    // 设置相机位置（从当前方向退远到 distance）
    const direction = new Vector3().copy(this.camera.position).sub(this.controls.target).normalize();
    const newPosition = center.clone().addScaledVector(direction, distance);
    this.camera.position.copy(newPosition);
    this.controls.target.copy(center);

    this.camera.updateProjectionMatrix();

    this.controls.update();
    this.render();
  }

  renderFrame(): void {
    // TODO: 定制化渲染
    this.renderer.render(this.shareScene.scene, this.camera);
  }
}
