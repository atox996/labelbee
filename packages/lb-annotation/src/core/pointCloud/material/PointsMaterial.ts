import { RawShaderMaterial } from 'three';
import { IDefines, IParameters, IUniformKeys, IUniforms, IUniformValue } from './types';

const vertexShader = `
precision mediump float;
precision mediump int;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
attribute vec3 position;

uniform vec2 gradient;

struct BBox {
  vec3 min;
  vec3 max;
};

struct BoxesItem {
  BBox bbox;
  mat4 matrix;
  vec3 color;
  float opacity;
};

#ifdef boxes_length
  uniform BoxesItem boxes[boxes_length];
#endif

uniform float pointSize;
uniform float opacity;

varying vec3 vColor;
varying float vOpacity;

bool isInBox(vec3 pos, vec3 min, vec3 max){
  return pos.x >= min.x && pos.x <= max.x && pos.y >= min.y && pos.y <= max.y && pos.z >= min.z && pos.z <= max.z;
}

void main() {
  gl_PointSize = pointSize;
  vOpacity = opacity;
  // 获取归一化的Z值 [0,1] 范围内
  float normalizedZ = 1.0 - (position.z - gradient.x) / (gradient.y - gradient.x);
  normalizedZ = clamp(normalizedZ, 0.0, 1.0);

  // Jet 颜色映射计算
  vec3 color;
  if (normalizedZ < 0.125) {
      color = vec3(0.0, 0.0, 0.5 + 0.5 * normalizedZ / 0.125);
  } else if (normalizedZ < 0.375) {
      color = vec3(0.0, (normalizedZ - 0.125) / 0.25, 1.0);
  } else if (normalizedZ < 0.625) {
      color = vec3((normalizedZ - 0.375) / 0.25, 1.0, 1.0 - (normalizedZ - 0.375) / 0.25);
  } else if (normalizedZ < 0.875) {
      color = vec3(1.0, 1.0 - (normalizedZ - 0.625) / 0.25, 0.0);
  } else {
      color = vec3(1.0 - 0.5 * (normalizedZ - 0.875) / 0.125, 0.0, 0.0);
  }

  vColor = color;

  #ifdef boxes_length
    for (int i = 0; i < boxes_length; i++) {
      BoxesItem box = boxes[i];
      vec3 min = box.bbox.min;
      vec3 max = box.bbox.max;
      vec4 boxPos = box.matrix * vec4(position, 1.0);
      if (isInBox(boxPos.xyz, min, max)) {
        vColor = box.color;
        vOpacity = box.opacity;
      }
    }
  #endif

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const fragmentShader = `
precision mediump float;
precision mediump int;

varying vec3 vColor;
varying float vOpacity;

void main() {
  gl_FragColor = vec4(vColor, vOpacity);
}

`;

export default class PointsMaterial extends RawShaderMaterial {
  @uniform declare pointSize: IUniformValue<'pointSize'>;

  @uniform declare opacity: IUniformValue<'opacity'>;

  @uniform declare gradient: IUniformValue<'gradient'>;

  @uniform declare boxes: IUniformValue<'boxes'>;

  uniforms: IUniforms = {
    pointSize: { value: 1.0 },
    opacity: { value: 1.0 },
    gradient: { value: [-7, 3] },
    boxes: { value: [] },
  };

  defines = {} as IDefines;

  constructor(parameters: IParameters = {}) {
    super({ vertexShader, fragmentShader });

    this.pointSize = parameters.pointSize ?? this.getUniform('pointSize');
    this.opacity = parameters.opacity ?? this.getUniform('opacity');
    this.gradient = parameters.gradient ?? this.getUniform('gradient');
    this.boxes = parameters.boxes ?? this.getUniform('boxes');

    this.transparent = true;
    this.update();
  }

  getUniform<K extends IUniformKeys>(name: K): IUniformValue<K> {
    return this.uniforms?.[name].value;
  }

  setUniform<K extends IUniformKeys>(name: K, value: IUniformValue<K>) {
    if (!this.uniforms) return;

    this.uniforms[name].value = value;

    this.update();
  }

  update() {
    this.defines = {};

    if (this.boxes.length) {
      this.defines.boxesLength = this.boxes.length;
    }

    this.needsUpdate = true;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
function uniform(target: object, propertyKey: string | symbol) {
  Object.defineProperty(target, propertyKey, {
    get() {
      return this.getUniform(propertyKey);
    },
    set(value) {
      if (value !== this.getUniform(propertyKey)) {
        this.setUniform(propertyKey, value);
      }
    },
  });
}
