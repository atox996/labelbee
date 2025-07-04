import { Vector3 } from 'three';

import type { ActionName } from '../actions';
import ShareScene from '../common/ShareScene';
import OrthographicViewer from './OrthographicViewer';

interface ViewerConfig {
  /**
   * 轴向
   * @description 相机所在的轴向, 视图将看向轴的反方向
   * @default 'z' 俯视图
   */
  axis?: Extract<Axis, 'z' | '-z'>;
  name?: string;
  actions?: ActionName[];
  /**
   * 视图半径
   * @description 视图半径, 用于初始化相机视锥体
   * @default 50
   */
  viewRadius?: number;
}

const _vec3a = new Vector3();
const _vec3b = new Vector3();
const _vec3c = new Vector3();

const DEFAULT_CONFIG: Required<ViewerConfig> = {
  axis: 'z',
  name: 'OverheadViewer',
  actions: ['Select', 'OrbitControls'],
  viewRadius: 50,
};

export default class OverheadViewer extends OrthographicViewer {
  private _viewRadius: number;

  constructor(container: HTMLElement, shareScene: ShareScene, config = DEFAULT_CONFIG) {
    super(container, shareScene, {
      ...config,
      ...DEFAULT_CONFIG,
    });
    this._viewRadius = config.viewRadius || DEFAULT_CONFIG.viewRadius;
    this.setGlobalProjection();
  }

  /**
   * 设置正交相机的投影参数及初始位置
   */
  setGlobalProjection() {
    const { viewDirection, _viewRadius, camera } = this;
    const { far } = camera;

    // 将相机放置到观察方向上方的某个位置（距离为 far / 2）
    camera.position.copy(viewDirection.clone().multiplyScalar(far / 2));

    // 设置一个固定的视口范围（世界空间单位）
    camera.left = -_viewRadius;
    camera.right = _viewRadius;
    camera.top = _viewRadius;
    camera.bottom = -_viewRadius;

    this.resize();
  }

  /**
   * 视口尺寸变化时调用，调整投影矩阵以保持正确比例
   */
  resize() {
    const { camera, aspect } = this;

    const halfShortest = Math.min(camera.right - camera.left, camera.top - camera.bottom) / 2;

    const newHalfWidth = halfShortest * Math.max(aspect, 1);
    const newHalfHeight = halfShortest * Math.max(1, 1 / aspect);

    camera.left = -newHalfWidth;
    camera.right = newHalfWidth;
    camera.top = newHalfHeight;
    camera.bottom = -newHalfHeight;

    camera.updateProjectionMatrix();

    super.resize();
  }

  /**
   * 聚焦到指定对象（默认为当前 focusObject）
   * 只移动相机的 x, y 位置，保持俯视角度看地面 (z=0)
   */
  override focus(instanceId = this.focusInstanceId) {
    if (!instanceId) return;
    this.focusInstanceId = instanceId;

    _vec3a.copy(this.shareScene.boxes.getWorldPosition(instanceId));

    const xMask = Math.abs(this.viewDirection.x);
    const yMask = Math.abs(this.viewDirection.y);
    const zMask = Math.abs(this.viewDirection.z);

    _vec3b.copy(_vec3a).multiply({ x: 1 - xMask, y: 1 - yMask, z: 1 - zMask });

    _vec3c.copy(this.camera.position).multiply({ x: xMask, y: yMask, z: zMask }).add(_vec3b);

    const action = this.getAction('OrbitControls');
    if (action) {
      action.focus(_vec3b);
    } else {
      this.camera.lookAt(_vec3b);
    }

    this.tween({
      from: this.camera.position,
      to: _vec3c,
    });
  }

  /**
   * 重写禁用父类的自动更新投影行为，
   * 由自身维护相机投影参数
   */
  override updateCameraProject() {
    // no-op
  }

  /**
   * 每帧渲染前更新 cameraHelper 并调用渲染
   */
  override renderFrame(): void {
    const { scene } = this.shareScene;
    this.renderer.render(scene, this.camera);
  }
}
