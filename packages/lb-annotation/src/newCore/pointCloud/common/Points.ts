import {
  BufferGeometry,
  Float32BufferAttribute,
  Int32BufferAttribute,
  type Object3DEventMap,
  Points as BasicPoints,
} from 'three';
import { PCDLoader } from 'three/examples/jsm/Addons.js';

import type PointsMaterial from './PointsMaterial';

interface TEventMap extends Object3DEventMap {
  pointsChange: EmptyObject;
}

export interface PointsData {
  position?: ArrayLike<number>;
  normal?: ArrayLike<number>;
  color?: ArrayLike<number>;
  intensity?: ArrayLike<number>;
  label?: ArrayLike<number>;
}

function createGeometry({ position = [], normal = [], color = [], intensity = [], label = [] }: PointsData = {}) {
  const geometry = new BufferGeometry();
  if (position.length > 0) geometry.setAttribute('position', new Float32BufferAttribute(position, 3));
  if (normal.length > 0) geometry.setAttribute('normal', new Float32BufferAttribute(normal, 3));
  if (color.length > 0) geometry.setAttribute('color', new Float32BufferAttribute(color, 3));
  if (intensity.length > 0) geometry.setAttribute('intensity', new Float32BufferAttribute(intensity, 1));
  if (label.length > 0) geometry.setAttribute('label', new Int32BufferAttribute(label, 1));

  geometry.computeBoundingSphere();

  return geometry;
}

export default class Points extends BasicPoints<BufferGeometry, PointsMaterial, TEventMap> {
  loader = new PCDLoader();

  constructor(material: PointsMaterial) {
    super(createGeometry(), material);
  }

  public updateData(data: PointsData) {
    this.geometry.dispose();
    this.geometry = createGeometry(data);
    this.dispatchEvent({ type: 'pointsChange' });
  }

  async load(url: string, onProgress?: (event: ProgressEvent) => void) {
    const points = await this.loader.loadAsync(url, onProgress);
    const { geometry } = points;
    const position = geometry.getAttribute('position')?.array || [];
    const normal = geometry.getAttribute('normal')?.array || [];
    const color = geometry.getAttribute('color')?.array || [];
    const intensity = geometry.getAttribute('intensity')?.array || [];
    const label = geometry.getAttribute('label')?.array || [];
    this.updateData({
      position,
      normal,
      color,
      intensity,
      label,
    });
    return this;
  }
}
