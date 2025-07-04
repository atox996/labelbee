import type { Texture, Matrix4, Color, Vector2, Vector3, Vector4, Matrix3 } from 'three';

export {};

declare global {
  type Axis = 'x' | 'y' | 'z' | '-x' | '-y' | '-z';

  type PositiveAxis<T> = T extends `-${infer _}` ? _ : T;

  type EmptyObject = {};
  interface UniformValueMap {
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
