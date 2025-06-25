import { DataTexture, FloatType, LinearFilter, RawShaderMaterial, RGBFormat } from 'three';

import fragmentShader from './shaders/points.fs';
import vertexShader from './shaders/points.vs';
import { createLegacyJetTextureData } from '../utils';

interface IDefines {
  USE_COLOR?: boolean;
  USE_JET_TEXTURE?: boolean;
}

function makeUniform<T extends keyof UniformValueMap>(type: T, value: UniformValueMap[T]) {
  return { type, value };
}

function makeNullableUniform<T extends keyof UniformValueMap>(type: T, value: UniformValueMap[T] | null) {
  return { type, value };
}

export function watchUniforms(execute: (ctx: PointsMaterial) => void) {
  return function watchUniformsDecorator(target: PointsMaterial, propertyKey: string) {
    const privateKey = Symbol(`private__${propertyKey}`);

    Object.defineProperty(target, propertyKey, {
      configurable: true,
      enumerable: true,
      get() {
        return this[privateKey];
      },
      set(value) {
        for (const key in value) {
          if (!Object.prototype.hasOwnProperty.call(value, key)) continue;

          const uniform = value[key];

          value[key] = new Proxy(uniform, {
            set: (targetUniform, prop, val, receiver) => {
              if (prop === 'type') {
                console.warn(`${propertyKey}.${key}.type is readonly`);
                return true;
              }
              const result = Reflect.set(targetUniform, prop, val, receiver);
              execute(this);
              return result;
            },
          });
        }

        this[privateKey] = value;
      },
    });
  };
}

// const COLOR_STOPS = [
//   new Color(1, 0, 0), // 红
//   new Color(1, 1, 0), // 黄
//   new Color(0, 1, 0), // 绿
//   new Color(0, 1, 1), // 青
//   new Color(0, 0, 1), // 蓝
// ];

export default class PointsMaterial extends RawShaderMaterial {
  @watchUniforms((ctx) => ctx.update()) declare uniforms;

  defines: IDefines = {};

  constructor() {
    super({
      vertexShader,
      fragmentShader,
      transparent: true,
    });

    this.uniforms = {
      /** 点大小 */
      size: makeUniform('c', 1.0),
      /** 亮度 */
      brightness: makeUniform('c', 1.0),
      /** 透明度 */
      opacity: makeUniform('c', 1.0),
      /** 纯色 */
      color: makeNullableUniform('v3', null),
      /** jet渐变纹理 */
      jetTexture: makeNullableUniform('texture', null),
      jetRange: makeNullableUniform('v2', [-7, 3]),
    };

    // const textureData = generateJetTextureData(COLOR_STOPS, 'linear');
    const textureData = createLegacyJetTextureData();
    this.setJetTexture(textureData);
  }

  setJetTexture(data: Float32Array | null) {
    if (data === null) {
      this.uniforms.jetTexture.value?.dispose();
      this.uniforms.jetTexture.value = null;
    } else {
      const oldTexture = this.uniforms.jetTexture.value;

      if (oldTexture?.image.data.length === data.length) {
        // 复用旧 texture，只替换数据
        oldTexture.image.data.set(data);
        oldTexture.needsUpdate = true;
      } else {
        // 创建新的纹理
        oldTexture?.dispose();

        const jetTexture = new DataTexture(data, data.length / 3, 1, RGBFormat, FloatType);
        jetTexture.minFilter = LinearFilter;
        jetTexture.magFilter = LinearFilter;
        jetTexture.internalFormat = 'RGB32F';
        jetTexture.unpackAlignment = 1;
        jetTexture.needsUpdate = true;

        this.uniforms.jetTexture.value = jetTexture;
      }
    }
  }

  update() {
    this.defines = {};
    if (this.uniforms.jetTexture.value) {
      this.defines.USE_JET_TEXTURE = true;
    } else if (this.uniforms.color.value) {
      this.defines.USE_COLOR = true;
    }
  }
}
