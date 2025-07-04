import { Box3, OrthographicCamera, Vector3 } from 'three';

import type { ActionName } from '../actions';
import type ShareScene from '../common/ShareScene';
import Viewer from './Viewer';

interface ViewerConfig {
  axis: Axis;
  name?: string;
  actions?: ActionName[];
  paddingPercent?: number;
}

const _vector3 = new Vector3();

const AXIS_UP_MAPPING: Record<Axis, Vector3> = {
  x: new Vector3(0, 0, 1),
  '-x': new Vector3(0, 0, 1),
  y: new Vector3(0, 0, 1),
  '-y': new Vector3(0, 0, 1),
  z: new Vector3(1, 0, 0),
  '-z': new Vector3(1, 0, 0),
};

const DEFAULT_ACTIONS: ActionName[] = ['OrbitControls'];

export default class OrthographicViewer extends Viewer {
  axis: Axis;

  viewDirection: Vector3;

  camera: OrthographicCamera;

  paddingPercent: number;

  projectRect: Box3;

  constructor(container: HTMLElement, shareScene: ShareScene, config: ViewerConfig) {
    super(container, shareScene, config.name);

    this.camera = new OrthographicCamera();
    this.axis = config.axis;
    this.paddingPercent = config.paddingPercent ?? 1;
    this.viewDirection = new Vector3();
    this.projectRect = new Box3();

    this.setAxis(this.axis);
    this.setActions(...(config.actions || DEFAULT_ACTIONS));
    this.initEvent();
  }

  resize() {
    this.updateCameraProject();
    super.resize();
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

  setAxis(axis: Axis) {
    this.axis = axis;

    this.camera.up.copy(AXIS_UP_MAPPING[axis]);

    // 使用正则解析方向轴名并设置 viewDirection
    const match = axis.match(/^(-?)([x-z])$/i);
    if (!match) throw new Error(`Invalid axis: ${axis}`);

    const [, sign, letter] = match;
    this.viewDirection.setScalar(0);
    this.viewDirection[letter as PositiveAxis<Axis>] = sign === '-' ? -1 : 1;

    if (this.focusInstanceId) this.focus();
    this.render();
  }

  focus(instanceId = this.focusInstanceId) {
    if (!instanceId) return;
    this.focusInstanceId = instanceId;

    const matrixWorld = this.shareScene.boxes.getWorldMatrix(instanceId);

    _vector3.copy(this.viewDirection).multiplyScalar(0.5).applyMatrix4(matrixWorld);
    this.camera.position.copy(_vector3);

    _vector3.copy(AXIS_UP_MAPPING[this.axis]).applyMatrix4(matrixWorld).sub(new Vector3().applyMatrix4(matrixWorld));
    this.camera.up.copy(_vector3);

    _vector3.setScalar(0).applyMatrix4(matrixWorld);

    const action = this.getAction('OrbitControls');
    if (action) {
      action.focus(_vector3, true);
    } else {
      this.camera.lookAt(_vector3);
    }
    this.camera.zoom = 1;
    // === 更新投影盒与投影矩阵 ===
    this.updateProjectRect();
    this.updateCameraProject();
  }

  updateProjectRect() {
    if (!this.focusInstanceId) return;

    const { focusInstanceId, camera } = this;

    camera.updateMatrixWorld();

    const matrixWorld = this.shareScene.boxes.getWorldMatrix(focusInstanceId);
    const bbox = this.shareScene.boxes.getGeometryBoundingBox();

    // === min 点投影到相机空间 ===
    _vector3.copy(bbox.min).applyMatrix4(matrixWorld).applyMatrix4(camera.matrixWorldInverse);
    const xMin = _vector3.x;
    const yMin = _vector3.y;
    const zMin = _vector3.z;

    // === max 点投影到相机空间 ===
    _vector3.copy(bbox.max).applyMatrix4(matrixWorld).applyMatrix4(camera.matrixWorldInverse);
    const xMax = _vector3.x;
    const yMax = _vector3.y;
    const zMax = _vector3.z;

    this.projectRect.min.set(Math.min(xMin, xMax), Math.min(yMin, yMax), Math.min(zMin, zMax));
    this.projectRect.max.set(Math.max(xMin, xMax), Math.max(yMin, yMax), Math.max(zMin, zMax));
  }

  updateCameraProject() {
    const { projectRect, aspect } = this;
    const rectWidth = projectRect.max.x - projectRect.min.x;
    const rectHeight = projectRect.max.y - projectRect.min.y;

    const padding = Math.min(rectWidth, rectHeight) * this.paddingPercent;

    const cameraW = Math.max(rectWidth + padding, (rectHeight + padding) * aspect);
    const cameraH = Math.max(rectHeight + padding, (rectWidth + padding) / aspect);

    this.camera.left = -cameraW / 2;
    this.camera.right = cameraW / 2;
    this.camera.top = cameraH / 2;
    this.camera.bottom = -cameraH / 2;
    this.camera.near = 0;
    this.camera.far = projectRect.max.z - projectRect.min.z;
    this.camera.updateProjectionMatrix();
  }

  renderFrame(): void {
    const { pointsGroup, material } = this.shareScene;
    // TODO: 点云颜色

    if (this.focusInstanceId) {
      const oldDepthTest = material.depthTest;
      material.depthTest = false;
      this.renderer.render(pointsGroup, this.camera);
      material.depthTest = oldDepthTest;
      const mesh = this.shareScene.boxes.getVirtualLine(this.focusInstanceId);
      this.renderer.render(mesh, this.camera);
    } else {
      this.renderer.render(pointsGroup, this.camera);
    }
    this.updateProjectRect();
  }
}
