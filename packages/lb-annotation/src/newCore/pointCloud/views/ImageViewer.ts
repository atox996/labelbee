import { CameraHelper, Mesh, OrthographicCamera } from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';

import type ShareScene from '../common/ShareScene';
import Viewer from './Viewer';

interface ViewerConfig {
  img: string;
  name?: string;
}

export default class ImageViewer extends Viewer {
  camera: OrthographicCamera;

  controls: OrbitControls;

  imageMesh?: Mesh;

  cameraHelper: CameraHelper;

  constructor(container: HTMLElement, shareScene: ShareScene, config: ViewerConfig) {
    super(container, shareScene, config.name);

    this.camera = new OrthographicCamera();
    // this.camera.layers.set(1);
    this.camera.layers.enable(1);
    this.cameraHelper = new CameraHelper(this.camera);
    this.cameraHelper.visible = false;
    // shareScene.scene.add(this.cameraHelper);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableRotate = false;
    this.controls.addEventListener('change', () => this.render());
  }

  initEvent(): void {
    console.log('initEvent');
  }

  resize(): void {
    super.resize();
  }

  focus(object = this.focusObject): void {
    const action = super.getAction('OrbitControls');
    if (action) action.focus(object?.position);

    this.focusObject = object;
    if (!object) return;
    // TODO: 聚焦相机到元素
  }

  renderFrame(): void {
    this.cameraHelper?.update();
    // TODO: 定制化渲染
    const { scene } = this.shareScene;
    this.renderer.render(scene, this.camera);
  }
}
