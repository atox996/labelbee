import { Camera, CameraHelper, Controls, EventDispatcher, MathUtils, WebGLRenderer } from 'three';

import type ShareScene from '../common/ShareScene';

interface TEventMap {
  renderBefore: EmptyObject;
  renderAfter: EmptyObject;
}

export default abstract class Viewer extends EventDispatcher<TEventMap> {
  enabled = true;

  container: HTMLElement;

  shareScene: ShareScene;

  renderer: WebGLRenderer;

  focusObject?: Box3DLike;

  get width() {
    return this.container.clientWidth;
  }

  get height() {
    return this.container.clientHeight;
  }

  abstract camera: Camera;

  abstract controls: Controls<EmptyObject>;

  cameraHelper?: CameraHelper;

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
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    this._resizeObserver = new ResizeObserver(() => {
      this.resize();
    });
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
      this.renderFrame();
      this.dispatchEvent({ type: 'renderAfter' });
      this._renderTimer = 0;
    });
  }

  dispose() {
    this.enabled = false;
    this.camera.removeFromParent();
    this.cameraHelper?.removeFromParent();
    this.shareScene.removeView(this);
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this._resizeObserver.disconnect();
  }

  abstract initEvent(): void;

  abstract focus(object?: Box3DLike): void;

  abstract renderFrame(): void;
}
