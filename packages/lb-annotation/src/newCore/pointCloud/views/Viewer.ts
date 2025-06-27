import { Camera, EventDispatcher, MathUtils, WebGLRenderer } from 'three';

import { debounce } from 'lodash';
import type ShareScene from '../common/ShareScene';
import { ActionInstanceMap, ActionName, Actions } from '../actions';

interface TEventMap {
  renderBefore: EmptyObject;
  renderAfter: EmptyObject;
}

export default abstract class Viewer extends EventDispatcher<TEventMap> {
  enabled = true;

  container: HTMLElement;

  shareScene: ShareScene;

  renderer: WebGLRenderer;

  autoFocus = true;

  focusObject?: Box3DLike;

  get width() {
    return this.container.clientWidth || 10;
  }

  get height() {
    return this.container.clientHeight || 10;
  }

  get aspect() {
    return this.width / this.height;
  }

  actionMap = new Map<ActionName, ActionInstanceMap[ActionName]>();

  abstract camera: Camera;

  readonly id: string;

  readonly name: string;

  private _resizeObserver: ResizeObserver;

  private _renderTimer = 0;

  constructor(container: HTMLElement, shareScene: ShareScene, name = '') {
    super();
    this.id = MathUtils.generateUUID();
    this.name = name;

    this.container = container;
    this.shareScene = shareScene;
    shareScene.addView(this);

    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.autoClear = false;
    this.renderer.sortObjects = false;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    this._resizeObserver = new ResizeObserver(
      debounce(() => {
        this.resize();
      }, 100),
    );
    this._resizeObserver.observe(this.container);

    this.initEvent();
  }

  resize() {
    this.renderer.setSize(this.width, this.height);
    this.render();
  }

  toggle(enabled?: boolean) {
    this.enabled = enabled === undefined ? !this.enabled : enabled;
    if (this.enabled) this.render();
  }

  render() {
    if (!this.enabled || this._renderTimer) return;
    this._renderTimer = requestAnimationFrame(() => {
      this.dispatchEvent({ type: 'renderBefore' });
      this.renderer.clear();
      this.renderFrame();
      this.dispatchEvent({ type: 'renderAfter' });
      this._renderTimer = 0;
    });
  }

  dispose() {
    this.enabled = false;
    this.camera.removeFromParent();
    this.shareScene.removeView(this);
    this.actionMap.forEach((action) => {
      action.dispose();
    });
    this.actionMap.clear();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this._resizeObserver.disconnect();
  }

  getAction<T extends ActionName>(name: T) {
    return this.actionMap.get(name) as ActionInstanceMap[T] | undefined;
  }

  setActions(...actionNames: ActionName[]) {
    actionNames.forEach((name) => {
      const ActionCtr = Actions.get(name);
      if (!ActionCtr) return;
      const action = new ActionCtr(this);
      action.init();
      this.actionMap.set(name, action);
    });
  }

  disableAction(...actionNames: ActionName[]) {
    if (actionNames.length) {
      actionNames.forEach((name) => {
        const action = this.actionMap.get(name);
        if (action) action.toggle(false);
      });
    } else {
      this.actionMap.forEach((action) => {
        action.toggle(false);
      });
    }
  }

  enableAction(...actionNames: ActionName[]) {
    if (actionNames.length) {
      actionNames.forEach((name) => {
        const action = this.actionMap.get(name);
        if (action) action.toggle(true);
      });
    } else {
      this.actionMap.forEach((action) => {
        action.toggle(true);
      });
    }
  }

  abstract initEvent(): void;

  abstract focus(object?: Box3DLike): void;

  abstract renderFrame(): void;
}
