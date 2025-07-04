import {
  Box3,
  BufferGeometry,
  Color,
  DataTexture,
  FloatType,
  InstancedBufferAttribute,
  type Intersection,
  LineSegments,
  Material,
  Matrix4,
  type Object3DEventMap,
  Raycaster,
  RedFormat,
  Sphere,
} from 'three';
import { lineSegmentsRaycast } from '.';

interface InstancedLineEventMap extends Object3DEventMap {
  dispose: object;
}

const _instanceLocalMatrix = /*@__PURE__*/ new Matrix4();
const _instanceWorldMatrix = /*@__PURE__*/ new Matrix4();

const _instanceIntersects: Intersection[] = [];

const _box3 = /*@__PURE__*/ new Box3();
const _identity = /*@__PURE__*/ new Matrix4();
const _mesh = /*@__PURE__*/ new LineSegments();
_mesh.raycast = lineSegmentsRaycast;
const _sphere = /*@__PURE__*/ new Sphere();

/**
 * A special version of a mesh with instanced rendering support. Use
 * this class if you have to render a large number of objects with the same
 * geometry and material(s) but with different world transformations. The usage
 * of 'InstancedLine' will help you to reduce the number of draw calls and thus
 * improve the overall rendering performance in your application.
 *
 * @augments LineSegments
 */
class InstancedLine<
  TGeometry extends BufferGeometry = BufferGeometry,
  TMaterial extends Material | Material[] = Material | Material[],
  TEventMap extends InstancedLineEventMap = InstancedLineEventMap,
> extends LineSegments<TGeometry, TMaterial, InstancedLineEventMap & TEventMap> {
  /**
   * This flag can be used for type testing.
   *
   * @type {true}
   * @readonly
   * @default true
   */
  readonly isInstancedLine: true = true as const;

  /**
   * This flag can be used for type testing.
   *
   * @type {true}
   * @readonly
   * @default true
   */
  readonly isInstancedMesh: true = true as const;

  /**
   * Represents the local transformation of all instances. You have to set its
   * {@link BufferAttribute#needsUpdate} flag to true if you modify instanced data
   * via {@link InstancedLine#setMatrixAt}.
   *
   * @type {InstancedBufferAttribute}
   */
  instanceMatrix: InstancedBufferAttribute;

  /**
   * Represents the color of all instances. You have to set its
   * {@link BufferAttribute#needsUpdate} flag to true if you modify instanced data
   * via {@link InstancedLine#setColorAt}.
   *
   * @type {?InstancedBufferAttribute}
   * @default null
   */
  instanceColor: InstancedBufferAttribute | null;

  /**
   * Represents the morph target weights of all instances. You have to set its
   * {@link Texture#needsUpdate} flag to true if you modify instanced data
   * via {@link InstancedLine#setMorphAt}.
   *
   * @type {?DataTexture}
   * @default null
   */
  morphTexture: DataTexture | null;

  /**
   * The number of instances.
   *
   * @type {number}
   */
  count: number;

  /**
   * The bounding box of the instanced mesh. Can be computed via {@link InstancedLine#computeBoundingBox}.
   *
   * @type {?Box3}
   * @default null
   */
  boundingBox: Box3 | null;

  /**
   * The bounding sphere of the instanced mesh. Can be computed via {@link InstancedLine#computeBoundingSphere}.
   *
   * @type {?Sphere}
   * @default null
   */
  boundingSphere: Sphere | null;

  /**
   * Constructs a new instanced mesh.
   *
   * @param {TGeometry} [geometry] - The mesh geometry.
   * @param {TMaterial} [material] - The mesh material.
   * @param {number} count - The number of instances.
   */
  constructor(geometry: TGeometry, material: TMaterial, count: number) {
    super(geometry, material);

    this.instanceMatrix = new InstancedBufferAttribute(new Float32Array(count * 16), 16);
    this.instanceColor = null;
    this.morphTexture = null;

    this.count = count;

    this.boundingBox = null;
    this.boundingSphere = null;

    for (let i = 0; i < count; i++) {
      this.setMatrixAt(i, _identity);
    }
  }

  /**
   * Computes the bounding box of the instanced mesh, and updates {@link InstancedLine#boundingBox}.
   * The bounding box is not automatically computed by the engine; this method must be called by your app.
   * You may need to recompute the bounding box if an instance is transformed via {@link InstancedLine#setMatrixAt}.
   */
  computeBoundingBox() {
    const { geometry } = this;
    const { count } = this;

    if (this.boundingBox === null) {
      this.boundingBox = new Box3();
    }

    if (geometry.boundingBox === null) {
      geometry.computeBoundingBox();
    }

    this.boundingBox.makeEmpty();

    for (let i = 0; i < count; i++) {
      this.getMatrixAt(i, _instanceLocalMatrix);

      _box3.copy(geometry.boundingBox!).applyMatrix4(_instanceLocalMatrix);

      this.boundingBox.union(_box3);
    }
  }

  /**
   * Computes the bounding sphere of the instanced mesh, and updates {@link InstancedLine#boundingSphere}
   * The engine automatically computes the bounding sphere when it is needed, e.g., for ray casting or view frustum culling.
   * You may need to recompute the bounding sphere if an instance is transformed via {@link InstancedLine#setMatrixAt}.
   */
  computeBoundingSphere() {
    const { geometry } = this;
    const { count } = this;

    if (this.boundingSphere === null) {
      this.boundingSphere = new Sphere();
    }

    if (geometry.boundingSphere === null) {
      geometry.computeBoundingSphere();
    }

    this.boundingSphere.makeEmpty();

    for (let i = 0; i < count; i++) {
      this.getMatrixAt(i, _instanceLocalMatrix);

      _sphere.copy(geometry.boundingSphere!).applyMatrix4(_instanceLocalMatrix);

      this.boundingSphere.union(_sphere);
    }
  }

  copy(source: InstancedLine, recursive?: boolean) {
    super.copy(source, recursive);

    this.instanceMatrix.copy(source.instanceMatrix);

    if (source.morphTexture !== null) this.morphTexture = source.morphTexture.clone();
    if (source.instanceColor !== null) this.instanceColor = source.instanceColor.clone() as InstancedBufferAttribute;

    this.count = source.count;

    if (source.boundingBox !== null) this.boundingBox = source.boundingBox.clone();
    if (source.boundingSphere !== null) this.boundingSphere = source.boundingSphere.clone();

    return this;
  }

  /**
   * Gets the color of the defined instance.
   *
   * @param {number} index - The instance index.
   * @param {Color} color - The target object that is used to store the method's result.
   */
  getColorAt(index: number, color: Color) {
    if (!this.instanceColor) throw new Error('InstancedLine: instanceColor is not defined.');
    color.fromArray(this.instanceColor.array, index * 3);
  }

  /**
   * Gets the local transformation matrix of the defined instance.
   *
   * @param {number} index - The instance index.
   * @param {Matrix4} matrix - The target object that is used to store the method's result.
   */
  getMatrixAt(index: number, matrix: Matrix4) {
    matrix.fromArray(this.instanceMatrix.array, index * 16);
  }

  /**
   * Gets the morph target weights of the defined instance.
   *
   * @param {number} index - The instance index.
   * @param {LineSegments} object - The target object that is used to store the method's result.
   */
  getMorphAt(index: number, object: LineSegments) {
    if (!this.morphTexture) throw new Error('InstancedLine: morphTexture is not defined.');
    if (!object.morphTargetInfluences) throw new Error('InstancedLine: object.morphTargetInfluences is not defined.');
    const objectInfluences = object.morphTargetInfluences;

    const array = this.morphTexture.source.data.data;

    const len = objectInfluences.length + 1; // All influences + the baseInfluenceSum

    const dataIndex = index * len + 1; // Skip the baseInfluenceSum at the beginning

    for (let i = 0; i < objectInfluences.length; i++) {
      objectInfluences[i] = array[dataIndex + i];
    }
  }

  raycast(raycaster: Raycaster, intersects: Intersection[]) {
    const { matrixWorld } = this;
    const raycastTimes = this.count;

    _mesh.geometry = this.geometry;
    _mesh.material = this.material;

    if (_mesh.material === undefined) return;

    // test with bounding sphere first

    if (this.boundingSphere === null) this.computeBoundingSphere();

    _sphere.copy(this.boundingSphere!);
    _sphere.applyMatrix4(matrixWorld);

    if (raycaster.ray.intersectsSphere(_sphere) === false) return;

    // now test each instance

    for (let instanceId = 0; instanceId < raycastTimes; instanceId++) {
      // calculate the world matrix for each instance

      this.getMatrixAt(instanceId, _instanceLocalMatrix);

      _instanceWorldMatrix.multiplyMatrices(matrixWorld, _instanceLocalMatrix);

      // the mesh represents this single instance

      _mesh.matrixWorld = _instanceWorldMatrix;

      _mesh.raycast(raycaster, _instanceIntersects);

      // process the result of raycast

      for (let i = 0, l = _instanceIntersects.length; i < l; i++) {
        const intersect = _instanceIntersects[i];
        intersect.instanceId = instanceId;
        intersect.object = this;
        intersects.push(intersect);
      }

      _instanceIntersects.length = 0;
    }
  }

  /**
   * Sets the given color to the defined instance. Make sure you set the `needsUpdate` flag of
   * {@link InstancedLine#instanceColor} to `true` after updating all the colors.
   *
   * @param {number} index - The instance index.
   * @param {Color} color - The instance color.
   */
  setColorAt(index: number, color: Color) {
    if (this.instanceColor === null) {
      this.instanceColor = new InstancedBufferAttribute(new Float32Array(this.instanceMatrix.count * 3).fill(1), 3);
    }

    color.toArray(this.instanceColor.array, index * 3);
  }

  /**
   * Sets the given local transformation matrix to the defined instance. Make sure you set the `needsUpdate` flag of
   * {@link InstancedLine#instanceMatrix} to `true` after updating all the colors.
   *
   * @param {number} index - The instance index.
   * @param {Matrix4} matrix - The local transformation.
   */
  setMatrixAt(index: number, matrix: Matrix4) {
    matrix.toArray(this.instanceMatrix.array, index * 16);
  }

  /**
   * Sets the morph target weights to the defined instance. Make sure you set the `needsUpdate` flag of
   * {@link InstancedLine#morphTexture} to `true` after updating all the influences.
   *
   * @param {number} index - The instance index.
   * @param {LineSegments} object -  A mesh which `morphTargetInfluences` property containing the morph target weights
   * of a single instance.
   */
  setMorphAt(index: number, object: LineSegments) {
    if (!object.morphTargetInfluences) throw new Error('InstancedLine: object.morphTargetInfluences is not defined.');
    const objectInfluences = object.morphTargetInfluences;

    const len = objectInfluences.length + 1; // morphBaseInfluence + all influences

    if (this.morphTexture === null) {
      this.morphTexture = new DataTexture(new Float32Array(len * this.count), len, this.count, RedFormat, FloatType);
    }

    const array = this.morphTexture.source.data.data;

    let morphInfluencesSum = 0;

    for (const influence of objectInfluences) {
      morphInfluencesSum += influence;
    }

    const morphBaseInfluence = this.geometry.morphTargetsRelative ? 1 : 1 - morphInfluencesSum;

    const dataIndex = len * index;

    array[dataIndex] = morphBaseInfluence;

    array.set(objectInfluences, dataIndex + 1);
  }

  updateMorphTargets() {
    // no-op
  }

  /**
   * Frees the GPU-related resources allocated by this instance. Call this
   * method whenever this instance is no longer used in your app.
   */
  dispose() {
    this.dispatchEvent({ type: 'dispose' });

    if (this.morphTexture !== null) {
      this.morphTexture.dispose();
      this.morphTexture = null;
    }
  }
}

export { InstancedLine };
