import Box3D from '../common/objects/Box3D';
import ShareScene from '../common/ShareScene';
import OrthographicViewer from './OrthographicViewer';

export default class OverheadViewer extends OrthographicViewer {
  constructor(container: HTMLElement, shareScene: ShareScene) {
    super(container, shareScene, {
      axis: 'z',
      name: 'overhead',
    });
  }

  initEvent(): void {
    this.shareScene.addEventListener('select', ({ selection, target }) => {
      const object = selection.find((o) => o instanceof Box3D);
      console.log(target, object);

      //   if (object) {
      //     this.focus(object);
      //   } else {
      //     this.focusObject = undefined;
      //   }
      this.render();
    });
  }

  // TODO: 相机聚焦不要缩放, 保持当时视图, 仅平移到聚焦元素

  renderFrame(): void {
    this.cameraHelper.update();
    // TODO: 定制化渲染
    this.renderer.render(this.shareScene.scene, this.camera);
  }
}
