import {
  Box3,
  BufferGeometry,
  DynamicDrawUsage,
  Float32BufferAttribute,
  InstancedBufferAttribute,
  LineBasicMaterial,
  Sphere,
  Uint16BufferAttribute,
  Vector3,
} from 'three';
import InstancedLineManager from '../../utils/InstancedLineManager';

const arrowLen = 0.4;
const arrowWidth = 0.15;
const dirStartX = 0.25;
const dirEndX = 1.0 + arrowLen;

const indices = [
  // box index  +z
  0, 1, 1, 2, 2, 3, 3, 0,
  // box index  -z
  4, 5, 5, 6, 6, 7, 7, 4,
  // box line
  0, 4, 1, 5, 2, 6, 3, 7,
  //  line
  8, 9,
  // arrow
  9, 10, 10, 11, 11, 9, 9, 12, 13, 12, 13, 9,
];
const positions = [
  // box points +z
  1,
  1,
  1,
  -1,
  1,
  1,
  -1,
  -1,
  1,
  1,
  -1,
  1,
  // box points -z
  1,
  1,
  -1,
  -1,
  1,
  -1,
  -1,
  -1,
  -1,
  1,
  -1,
  -1,
  // line
  dirStartX,
  0,
  0,
  dirEndX,
  0,
  0,
  // arrow pos 1
  1.0,
  arrowWidth,
  0,
  // arrow pos 2
  1.0,
  -arrowWidth,
  0,
  // arrow pos 3
  1.0,
  0,
  arrowWidth,
  //  arrow pos 4
  1.0,
  0,
  -arrowWidth,
];
positions.forEach((e, index) => {
  positions[index] *= 0.5;
});
const defaultGeometry = new BufferGeometry();
defaultGeometry.setIndex(new Uint16BufferAttribute(indices, 1));
defaultGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
defaultGeometry.boundingSphere = new Sphere(new Vector3(0, 0, 0), 0.8660254037844386);
defaultGeometry.boundingBox = new Box3(new Vector3(-0.5, -0.5, -0.5), new Vector3(0.5, 0.5, 0.5));

export default class Boxes extends InstancedLineManager {
  constructor(count = 1000) {
    super(
      defaultGeometry,
      new LineBasicMaterial({
        color: 0xffffff,
        toneMapped: false,
      }),
      count,
    );
    this.line.instanceColor = new InstancedBufferAttribute(new Float32Array(count * 3), 3);
    this.line.instanceColor.setUsage(DynamicDrawUsage);
    this.line.geometry.setAttribute('color', this.line.instanceColor);
  }
}
