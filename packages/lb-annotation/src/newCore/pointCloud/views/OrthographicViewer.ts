import { Box3, CameraHelper, OrthographicCamera, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';

import Box3D from '../common/objects/Box3D';
import type ShareScene from '../common/ShareScene';
import Viewer from './Viewer';

interface ViewerConfig {
  axis: Axis;
  name?: string;
  paddingPercent?: number;
}

const AXIS_UP_MAPPING: Record<Axis, Vector3> = {
  x: new Vector3(0, 0, 1),
  '-x': new Vector3(0, 0, 1),
  y: new Vector3(0, 0, 1),
  '-y': new Vector3(0, 0, 1),
  z: new Vector3(1, 0, 0),
  '-z': new Vector3(1, 0, 0),
};

export default class OrthographicViewer extends Viewer {
  axis: Axis;

  viewDirection: Vector3;

  camera: OrthographicCamera;

  cameraHelper: CameraHelper;

  controls: OrbitControls;

  paddingPercent: number;

  projectRect: Box3;

  constructor(container: HTMLElement, shareScene: ShareScene, config: ViewerConfig) {
    super(container, shareScene, config.name);

    this.camera = new OrthographicCamera();
    this.cameraHelper = new CameraHelper(this.camera);
    this.cameraHelper.visible = false;
    shareScene.scene.add(this.cameraHelper);

    this.axis = config.axis;
    this.paddingPercent = config.paddingPercent ?? 1;
    this.viewDirection = new Vector3();
    this.projectRect = new Box3();
    this.setAxis(this.axis);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableRotate = false;
    this.controls.addEventListener('change', () => this.shareScene.render());
  }

  initEvent(): void {
    this.shareScene.addEventListener('select', ({ selection, target }) => {
      const object = selection.find((o) => o instanceof Box3D);
      console.log(target);

      if (object) {
        this.focus(object);
      } else {
        this.focusObject = undefined;
      }
      this.render();
    });
  }

  setAxis(axis: Axis) {
    this.axis = axis;

    this.camera.up.copy(AXIS_UP_MAPPING[axis]);

    // 使用正则解析方向轴名并设置 viewDirection
    const match = axis.match(/^(-?)([x-z])$/i);
    if (!match) throw new Error(`Invalid axis: ${axis}`);

    const [, sign, letter] = match;
    this.viewDirection.setScalar(0);
    this.viewDirection[letter as PositiveAxis<Axis>] = sign === '-' ? -1 : 1;

    if (this.focusObject) this.focus();
    this.render();
  }

  focus(object = this.focusObject) {
    this.focusObject = object;
    if (!object) return;

    object.updateMatrixWorld();

    const temp = new Vector3();
    temp.copy(this.viewDirection);
    temp.applyMatrix4(object.matrixWorld);
    this.camera.position.copy(temp);

    temp
      .copy(AXIS_UP_MAPPING[this.axis])
      .applyMatrix4(object.matrixWorld)
      .sub(new Vector3().applyMatrix4(object.matrixWorld));
    this.camera.up.copy(temp);

    temp.set(0, 0, 0);
    temp.applyMatrix4(object.matrixWorld);
    this.camera.lookAt(temp);

    this.updateProjectRect();
    this.updateCameraProject();
  }

  updateProjectRect() {
    if (!this.focusObject) return;

    const { focusObject, camera } = this;

    camera.updateMatrixWorld();
    focusObject.updateMatrixWorld();

    if (!focusObject.geometry.boundingBox) focusObject.geometry.computeBoundingBox();
    const bbox = focusObject.geometry.boundingBox!;

    const minProject = new Vector3().copy(bbox.min);
    const maxProject = new Vector3().copy(bbox.max);

    minProject.applyMatrix4(focusObject.matrixWorld).applyMatrix4(camera.matrixWorldInverse);
    maxProject.applyMatrix4(focusObject.matrixWorld).applyMatrix4(camera.matrixWorldInverse);

    const min = new Vector3();
    const max = new Vector3();

    const xMin = Math.min(minProject.x, maxProject.x);
    const xMax = Math.max(minProject.x, maxProject.x);
    const yMin = Math.min(minProject.y, maxProject.y);
    const yMax = Math.max(minProject.y, maxProject.y);
    const zMin = Math.min(minProject.z, maxProject.z);
    const zMax = Math.max(minProject.z, maxProject.z);

    min.set(xMin, yMin, zMin);
    max.set(xMax, yMax, zMax);

    this.projectRect.min.copy(min);
    this.projectRect.max.copy(max);
  }

  updateCameraProject() {
    const { projectRect } = this;
    const rectWidth = projectRect.max.x - projectRect.min.x;
    const rectHeight = projectRect.max.y - projectRect.min.y;
    const aspect = this.width / this.height;

    // debugger
    const padding = Math.min(rectWidth, rectHeight) * this.paddingPercent;
    // let padding = (200 * rectWidth) / this.width;
    const cameraW = Math.max(rectWidth + padding, (rectHeight + padding) * aspect);
    const cameraH = Math.max(rectHeight + padding, (rectWidth + padding) / aspect);

    this.camera.left = (-cameraW / 2) * this.camera.zoom;
    this.camera.right = (cameraW / 2) * this.camera.zoom;
    this.camera.top = (cameraH / 2) * this.camera.zoom;
    this.camera.bottom = (-cameraH / 2) * this.camera.zoom;
    // debugger
    this.camera.far = projectRect.max.z - projectRect.min.z;
    this.camera.updateProjectionMatrix();

    // this.camera.position.add(this.cameraOffset);
    // this.camera.updateMatrixWorld();
    // this.camera.far = 0;
    this.cameraHelper?.update();
  }

  renderFrame(): void {
    this.cameraHelper.update();
    // TODO: 定制化渲染
    this.renderer.render(this.shareScene.scene, this.camera);
  }
}
