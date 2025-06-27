import type {
  Object3D,
  BufferGeometry,
  Material,
  Object3DEventMap,
  Texture,
  Box3,
  Matrix4,
  Color,
  Vector2,
  Vector3,
  Vector4,
  Matrix3,
} from 'three';

export {};

declare global {
  type Axis = 'x' | 'y' | 'z' | '-x' | '-y' | '-z';

  type PositiveAxis<T> = T extends `-${infer _}` ? _ : T;

  type EmptyObject = {};
  type UniformValueMap = {
    t: Texture;
    c: Color;
    f: number;
    v2: Vector2;
    v3: Vector3;
    v4: Vector4;
    m3: Matrix3;
    m4: Matrix4;
    highlightBox: {
      min: Vector3;
      max: Vector3;
      color: Color;
      inverseMatrix: Matrix4;
    };
  };

  interface Box3DLike<
    TGeometry extends BufferGeometry = BufferGeometry,
    TMaterial extends Material | Material[] = Material | Material[],
    TEventMap extends Object3DEventMap = Object3DEventMap,
  > extends Object3D<TEventMap> {
    geometry: TGeometry;
    material: TMaterial;
  }

  interface BoxTextureData {
    bbox: Box3; // 包含 min/max
    inverseMatrix: Matrix4; // 逆矩阵4x4
    color: Color; // RGB颜色
    opacity: number; // 透明度
  }

  declare module '*.fs' {
    const value: string;
    export default value;
  }

  declare module '*.vs' {
    const value: string;
    export default value;
  }
}
