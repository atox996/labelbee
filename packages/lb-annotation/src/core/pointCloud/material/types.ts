import { Box3, Color, IUniform, Matrix4, Vector2Tuple } from 'three';

export interface IBox {
  bbox: Box3;
  matrix: Matrix4;
  color: Color;
  opacity: number;
}

export type IUniforms = {
  /**
   * 点大小
   */
  pointSize: IUniform<number>;
  /**
   * 透明度
   */
  opacity: IUniform<number>;
  /**
   * 渐变
   * @description 采用JET颜色渐变 Z轴范围[最小值, 最大值]
   * @example [-7, 3]
   */
  gradient: IUniform<Vector2Tuple>;
  /**
   * 3D框
   */
  boxes: IUniform<IBox[]>;
};

export interface IDefines {
  boxesLength?: number;
}

export type IUniformKeys = keyof IUniforms;
export type IUniformValue<K extends IUniformKeys> = IUniforms[K]['value'];

export type IParameters = {
  [K in IUniformKeys]?: IUniformValue<K>;
};
