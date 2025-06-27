import { Raycaster, Vector2 } from 'three';
import Action from './Action';
import Box3D from '../common/objects/Box3D';

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
      const object = this.getObject(event);
      if (object) {
        this.viewer.shareScene.selectObject(object);
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

  getObject(event: MouseEvent) {
    this.updateProjectPos(event);
    const annotate3D = this.viewer.shareScene.getAnnotations3D();

    _raycaster.setFromCamera(_upPos, this.viewer.camera);
    const intersects = _raycaster.intersectObjects<Box3D>(annotate3D);
    if (intersects.length > 0) return intersects[0].object;
  }

  updateProjectPos(event: MouseEvent) {
    const x = (event.offsetX / this.viewer.width) * 2 - 1;
    const y = (-event.offsetY / this.viewer.height) * 2 + 1;
    _upPos.set(x, y);
  }
}
