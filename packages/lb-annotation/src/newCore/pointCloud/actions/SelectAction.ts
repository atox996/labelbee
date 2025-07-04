import { Raycaster, Vector2 } from 'three';

import Action from './Action';

const _downPos = new Vector2();
const _upPos = new Vector2();
const _raycaster = new Raycaster();

export default class SelectAction extends Action {
  private _mouseDown = false;

  onPointerDown = (event: PointerEvent) => {
    if (!this.enabled || event.button !== 2) return;
    this._mouseDown = true;
    _downPos.set(event.offsetX, event.offsetY);
  };

  onPointerUp = (event: PointerEvent) => {
    if (!this.enabled) return;
    const distance = _upPos.set(event.offsetX, event.offsetY).distanceTo(_downPos);
    if (this._mouseDown && distance < 10) {
      const instanceId = this.getInstanceId(event);
      if (instanceId) {
        this.viewer.shareScene.selectObject([instanceId]);
      }
    }
    this._mouseDown = false;
  };

  init(): void {
    this._mouseDown = false;
    const { container } = this.viewer;
    container.addEventListener('pointerdown', this.onPointerDown);
    container.addEventListener('pointerup', this.onPointerUp);
  }

  dispose(): void {
    const { container } = this.viewer;
    container.removeEventListener('pointerdown', this.onPointerDown);
    container.removeEventListener('pointerup', this.onPointerUp);
  }

  getInstanceId(event: PointerEvent) {
    this.updateProjectPos(event);
    const { boxes } = this.viewer.shareScene;
    _raycaster.setFromCamera(_upPos, this.viewer.camera);
    const intersects = _raycaster.intersectObjects([boxes.line], false);
    if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
      return boxes.getInstanceIdFromRenderId(intersects[0].instanceId);
    }
  }

  updateProjectPos(event: PointerEvent) {
    const x = (event.offsetX / this.viewer.width) * 2 - 1;
    const y = (-event.offsetY / this.viewer.height) * 2 + 1;
    _upPos.set(x, y);
  }
}
