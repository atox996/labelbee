import Viewer from '../views/Viewer';

export default abstract class Action {
  enabled = true;

  viewer: Viewer;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  toggle(enabled?: boolean) {
    this.enabled = enabled === undefined ? !this.enabled : enabled;
  }

  abstract init(): void;

  abstract dispose(): void;
}
