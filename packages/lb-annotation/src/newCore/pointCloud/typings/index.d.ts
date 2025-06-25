import { Object3D, ShaderMaterialUniformJSON, BufferGeometry, Material, Object3DEventMap, Texture } from 'three';

export {};

declare global {
  type Axis = 'x' | 'y' | 'z' | '-x' | '-y' | '-z';

  type PositiveAxis<T> = T extends `-${infer _}` ? _ : T;

  type EmptyObject = {};

  type UniformType = ShaderMaterialUniformJSON extends infer U ? (U extends { type: string } ? U : never) : never;
  type UniformValueMap = {
    [K in UniformType as K['type']]: K['value'];
  } & {
    texture: Texture;
  };

  interface Box3DLike<
    TGeometry extends BufferGeometry = BufferGeometry,
    TMaterial extends Material | Material[] = Material | Material[],
    TEventMap extends Object3DEventMap = Object3DEventMap,
  > extends Object3D<TEventMap> {
    geometry: TGeometry;
    material: TMaterial;
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
