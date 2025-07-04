import { RawShaderMaterial, Vector2 } from 'three';

import fragmentShader from './shaders/points.fs';
import vertexShader from './shaders/points.vs';
import { createLegacyJetTextureData, generateLegacyJetTextureData } from '../utils';

interface IDefines {
  USE_COLOR?: boolean;
  USE_GRADIENT_TEXTURE?: boolean;
  USE_HIGHLIGHT_BOX?: boolean;
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
      size: makeUniform('f', 1.0),
      /** 亮度 */
      brightness: makeUniform('f', 1.0),
      /** 透明度 */
      opacity: makeUniform('f', 1.0),
      /** 纯色 */
      color: makeNullableUniform('c', null),
      /** 渐变纹理: 优先级高于color */
      gradientTexture: makeNullableUniform('t', null),
      gradientRange: makeNullableUniform('v2', new Vector2(-7, 3)),
      /** 高亮盒子 */
      highlightBox: makeNullableUniform('highlightBox', null),
    };

    // 默认使用渐变纹理
    // const textureData = generateGradientTextureData();
    const textureData = generateLegacyJetTextureData();
    this.setGradientTexture(textureData);
  }

  setGradientTexture(data: Float32Array | null) {
    const oldTexture = this.uniforms.gradientTexture.value;
    if (data === null) {
      oldTexture?.dispose();
      this.uniforms.gradientTexture.value = null;
    } else if (oldTexture?.image.data.length === data.length) {
      // 复用旧 texture，只替换数据
      oldTexture.image.data.set(data);
      oldTexture.needsUpdate = true;
    } else {
      // 创建新的纹理
      oldTexture?.dispose();

      const gradientTexture = createLegacyJetTextureData(data);

      this.uniforms.gradientTexture.value = gradientTexture;
    }
  }

  update() {
    this.defines = {};
    if (this.uniforms.gradientTexture.value) {
      this.defines.USE_GRADIENT_TEXTURE = true;
    } else if (this.uniforms.color.value) {
      this.defines.USE_COLOR = true;
    }
    if (this.uniforms.highlightBox.value) {
      this.defines.USE_HIGHLIGHT_BOX = true;
    }

    this.needsUpdate = true;
  }

  dispose() {
    this.setGradientTexture(null);
    super.dispose();
  }
}
