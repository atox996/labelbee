import { AxesHelper, Box3, Box3Helper, EventDispatcher, Group, Plane, PlaneHelper, Scene, Vector3 } from 'three';

import type Viewer from '../views/Viewer';
import type Box3D from './objects/Box3D';
import Points, { PointsData } from './Points';
import PointsMaterial from './PointsMaterial';

interface TEventMap {
  addObject: { objects: Box3D[] };
  removeObject: { objects: Box3D[] };
  select: { selection: Box3D[]; preSelection: Box3D[] };
  clearData: EmptyObject;
  pointsChange: EmptyObject;
  renderBefore: EmptyObject;
  renderAfter: EmptyObject;
}

export default class ShareScene extends EventDispatcher<TEventMap> {
  scene: Scene;

  pointsGroup: Group;

  annotations3D: Group;

  ground: PlaneHelper;

  selection: Box3D[] = [];

  selectionMap = new Map<string, Box3D>();

  views: Viewer[] = [];

  material = new PointsMaterial();

  originHelper: Box3Helper;

  private _renderTimer = 0;

  constructor() {
    super();
    this.scene = new Scene();
    this.pointsGroup = new Group();
    this.pointsGroup.name = 'pointsGroup';
    this.annotations3D = new Group();
    this.annotations3D.name = 'annotations3D';

    this.ground = new PlaneHelper(new Plane(new Vector3(0, 0, -1), 0), 100, 0xeeeeee);
    this.ground.visible = false;

    this.originHelper = new Box3Helper(new Box3(new Vector3(-100, -100, -100), new Vector3(100, 100, 100)), 0xffff00);
    this.originHelper.visible = false;

    const axesHelper = new AxesHelper(100);
    axesHelper.visible = false;

    this.scene.add(this.pointsGroup, this.annotations3D, this.ground, this.originHelper, axesHelper);
  }

  addObject(...objects: Box3D[]) {
    objects.forEach((obj) => {
      if (!this.annotations3D.children.includes(obj)) this.annotations3D.add(obj);
    });
    this.dispatchEvent({ type: 'addObject', objects });
    this.render();
  }

  removeObject(...objects: Box3D[]) {
    let selectFlag = false;
    objects.forEach((obj) => {
      this.annotations3D.remove(obj);
      if (this.selectionMap.has(obj.uuid)) {
        selectFlag = true;
        this.selectionMap.delete(obj.uuid);
      }
    });
    this.dispatchEvent({ type: 'removeObject', objects });
    if (selectFlag) {
      const selection = this.selection.filter((item) => this.selectionMap.has(item.uuid));
      this.selectObject(...selection);
    }
    this.render();
  }

  selectObject(...objects: Box3D[]) {
    const preSelection = this.selection;
    this.selection = objects;
    this.selectionMap.clear();
    this.selection.forEach((obj) => {
      this.selectionMap.set(obj.uuid, obj);
    });
    this.dispatchEvent({ type: 'select', selection: this.selection, preSelection });
  }

  selectObjectByUUID(...uuids: string[]) {
    const selection = this.getAnnotations3D().filter((child) => uuids.includes(child.uuid));
    this.selectObject(...selection);
  }

  getAnnotations3D() {
    return this.annotations3D.children as Box3D[];
  }

  clearData() {
    this.selectObject();
    this.annotations3D.clear();
    this.dispatchEvent({ type: 'clearData' });
    this.render();
  }

  addView(viewer: Viewer) {
    if (this.views.includes(viewer)) return;
    this.views.push(viewer);
  }

  removeView(viewer: Viewer) {
    const index = this.views.indexOf(viewer);
    if (index === -1) return;
    this.views.splice(index, 1);
  }

  setPointCloud(data: PointsData) {
    let points: Points;
    if (this.pointsGroup.children.length > 0) {
      points = this.pointsGroup.children[0] as Points;
    } else {
      points = new Points(this.material);
      this.pointsGroup.add(points);
    }
    points.updateData(data);
    this.render();
  }

  loadPointCloud(url: string, onProgress?: (e: ProgressEvent) => void) {
    let points: Points;
    if (this.pointsGroup.children.length > 0) {
      points = this.pointsGroup.children[0] as Points;
    } else {
      points = new Points(this.material);
      points.addEventListener('pointsChange', () => {
        this.dispatchEvent({ type: 'pointsChange' });
        this.render();
      });
      this.pointsGroup.add(points);
    }
    return points?.load(url, onProgress);
  }

  render() {
    if (this._renderTimer) return;
    this._renderTimer = requestAnimationFrame(() => {
      this.dispatchEvent({ type: 'renderBefore' });
      this.views.forEach((view) => {
        view.render();
      });
      this.dispatchEvent({ type: 'renderAfter' });
      this._renderTimer = 0;
    });
  }
}
