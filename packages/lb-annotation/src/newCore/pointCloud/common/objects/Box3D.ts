import {
  Box3,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  type Intersection,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Ray,
  Raycaster,
  Sphere,
  Uint16BufferAttribute,
  Vector3,
} from 'three';

const defaultMaterial = new LineBasicMaterial({
  color: 0xffffff,
  toneMapped: false,
});

// defaultMaterial.depthTest = false;
function getBoxInfo() {
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

  const lineDistance = [
    // box index  +z
    0, 1, 2, 1,
    // box index  -z
    1, 2, 3, 2,
    //  line
    0, 2,
    // arrow
    0.2, 0.2, 0.2, 0.2,
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

  return { indices, positions, lineDistance };
}

const { indices, positions, lineDistance } = getBoxInfo();
const emptyGeometry = new BufferGeometry();
emptyGeometry.setAttribute('position', new Float32BufferAttribute([], 3));

const defaultGeometry = new BufferGeometry();
defaultGeometry.setIndex(new Uint16BufferAttribute(indices, 1));
defaultGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
defaultGeometry.setAttribute('lineDistance', new Float32BufferAttribute(lineDistance, 1));
defaultGeometry.boundingSphere = new Sphere(new Vector3(0, 0, 0), 0.8660254037844386);
defaultGeometry.boundingBox = new Box3(new Vector3(-0.5, -0.5, -0.5), new Vector3(0.5, 0.5, 0.5));

const _sphere = new Sphere();
const _matrix = new Matrix4();
const _ray = new Ray();
const _pos = new Vector3();

export default class Box3D extends LineSegments implements Box3DLike {
  color: Color;

  constructor() {
    super(defaultGeometry, defaultMaterial);
    this.color = new Color();
  }

  raycast(raycaster: Raycaster, intersects: Intersection<Box3D>[]) {
    if (!this.visible) return;

    const { geometry } = this;
    const { matrixWorld } = this;

    _sphere.copy(geometry.boundingSphere!).applyMatrix4(matrixWorld);

    if (raycaster.ray.intersectsSphere(_sphere) === false) return;

    const _inverseMatrix = _matrix.copy(matrixWorld).invert();
    _ray.copy(raycaster.ray).applyMatrix4(_inverseMatrix);

    if (geometry.boundingBox === null) geometry.computeBoundingBox();

    if (_ray.intersectsBox(geometry.boundingBox!) === false) return;

    const pos = _pos.set(0, 0, 0).applyMatrix4(matrixWorld);
    const distance = pos.distanceTo(raycaster.ray.origin);
    intersects.push({ object: this, distance, point: pos });
  }
}
