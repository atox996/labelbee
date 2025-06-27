import { Vector3Like, Color, DataTexture, FloatType, LinearFilter, RGBAFormat, RGBFormat } from 'three';
import Box3D from '../common/objects/Box3D';

export const createBox3D = <T extends EmptyObject = EmptyObject>(
  center: Vector3Like,
  size: Vector3Like,
  rotation: Vector3Like,
  color: { r: number; g: number; b: number },
  userData?: T,
) => {
  const box3D = new Box3D();
  box3D.position.copy(center);
  box3D.scale.copy(size);
  box3D.rotation.set(rotation.x, rotation.y, rotation.z);
  box3D.color.set(color.r, color.g, color.b);
  box3D.userData = userData || {};
  return box3D;
};

const COLOR_STOPS = [
  new Color(1, 0, 0), // 红
  new Color(1, 1, 0), // 黄
  new Color(0, 1, 0), // 绿
  new Color(0, 1, 1), // 青
  new Color(0, 0, 1), // 蓝
];

/**
 * 生成渐变纹理数据 (Float32Array)
 * @param {Color[]} colorStops - 关键颜色点数组, 默认由低到高 红 → 黄 → 绿 → 青 → 蓝
 * @param {number[] | 'linear'} stops - 每个颜色点的位置数组 (0~1)，或 'linear' 表示均匀分布, 默认 'linear'
 * @param {number} textureSize - 输出纹理采样长度，默认256，若 colorStops 数量大于此数，则自动调整为 colorStops.length
 * @returns {Float32Array} - RGB纹理数据 (长度为 textureSize * 3)
 */
export const generateGradientTextureData = (
  colorStops: Color[] = COLOR_STOPS,
  stops: number[] | 'linear' = 'linear',
  textureSize: number = 256,
): Float32Array => {
  const numColors = colorStops.length;
  if (numColors === 0) {
    throw new Error('generateJetColormapData: colorStops cannot be empty');
  }
  // 处理有效 stops
  let effectiveStops: number[];
  if (stops === 'linear' || !Array.isArray(stops) || stops.length !== numColors) {
    if (stops !== 'linear' && Array.isArray(stops)) {
      console.warn(
        'generateJetColormapData: stops length does not match colorStops length, using linear positions instead',
      );
    }
    effectiveStops = colorStops.map((_, i) => i / (numColors - 1));
  } else {
    effectiveStops = stops;
  }
  // 插值函数
  function interpolateColor(t: number): [number, number, number] {
    let index = 0;
    for (; index < effectiveStops.length - 1; index++) {
      if (t >= effectiveStops[index] && t <= effectiveStops[index + 1]) break;
    }

    // 防止越界
    index = Math.min(index, effectiveStops.length - 2);

    const t0 = effectiveStops[index];
    const t1 = effectiveStops[index + 1];
    const localT = (t - t0) / (t1 - t0);

    const c0 = colorStops[index];
    const c1 = colorStops[index + 1];
    const resultColor = c0.clone().lerp(c1, localT);

    return [resultColor.r, resultColor.g, resultColor.b];
  }
  // 确定最终纹理尺寸
  const finalSize = Math.max(textureSize, numColors);
  const data = new Float32Array(finalSize * 3);
  for (let i = 0; i < finalSize; i++) {
    const t = i / (finalSize - 1);
    const [r, g, b] = interpolateColor(t);
    data[i * 3] = r;
    data[i * 3 + 1] = g;
    data[i * 3 + 2] = b;
  }
  return data;
};

/**
 * 创建渐变纹理 (DataTexture)
 * @param {Float32Array} data - 渐变纹理数据
 * @returns {DataTexture} - RGB纹理数据 (长度为 textureSize * 3)
 */
export function createGradientTexture(data: Float32Array): DataTexture {
  const texture = new DataTexture(data, data.length / 3, 1, RGBFormat, FloatType);
  texture.minFilter = texture.magFilter = LinearFilter;
  texture.internalFormat = 'RGB32F';
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;

  return texture;
}

/**
 * 生成与旧版 createColorMapJet 对应的 Jet 颜色渐变数据，长度固定 256
 * 返回归一化的 Float32Array (RGB)
 */
export function generateLegacyJetTextureData(): Float32Array {
  const p: number[][] = [];

  for (let s = 0; s < 32; s++) p[s] = [128 + 4 * s, 0, 0];
  p[32] = [255, 0, 0];
  for (let s = 0; s < 63; s++) p[33 + s] = [255, 4 + 4 * s, 0];
  p[96] = [254, 255, 2];
  for (let s = 0; s < 62; s++) p[97 + s] = [250 - 4 * s, 255, 6 + 4 * s];
  p[159] = [1, 255, 254];
  for (let s = 0; s < 64; s++) p[160 + s] = [0, 252 - s * 4, 255];
  for (let s = 0; s < 32; s++) p[224 + s] = [0, 0, 252 - 4 * s];

  const data = new Float32Array(256 * 3);
  for (let i = 0; i < 256; i++) {
    data[i * 3] = p[i][0] / 255;
    data[i * 3 + 1] = p[i][1] / 255;
    data[i * 3 + 2] = p[i][2] / 255;
  }

  return data;
}

export const createLegacyJetTextureData = (data: Float32Array) => {
  const texture = new DataTexture(data, data.length / 3, 1, RGBFormat, FloatType);
  texture.minFilter = texture.magFilter = LinearFilter;
  texture.internalFormat = 'RGB32F';
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;

  return texture;
};

/**
 * 生成Box信息纹理数据 (Float32Array)
 * @param boxes - BoxData数组
 * @returns RGBA纹理数据
 */
export function generateBoxTextureData(boxes: BoxTextureData[]) {
  const boxCount = boxes.length;
  if (boxCount === 0) {
    throw new Error('generateBoxInfoTextureData: boxes array is empty');
  }

  const floatsPerBox = 28; // 原数据里每 box 占 28 float
  const floatsPerTexel = 4; // RGBA = 4 float

  const texelsPerBox = Math.ceil(floatsPerBox / floatsPerTexel); // 每box需要几个texel
  const texWidth = texelsPerBox; // 每行宽度
  const texHeight = boxCount; // 每行对应一个 box

  const totalTexelCount = texWidth * texHeight;
  const totalFloatCount = totalTexelCount * floatsPerTexel;

  const data = new Float32Array(totalFloatCount);

  boxes.forEach((boxData, i) => {
    const baseIndex = i * texWidth * floatsPerTexel;

    // bbox min/max (6 floats)
    data[baseIndex + 0] = boxData.bbox.min.x;
    data[baseIndex + 1] = boxData.bbox.min.y;
    data[baseIndex + 2] = boxData.bbox.min.z;

    data[baseIndex + 3] = boxData.bbox.max.x;
    data[baseIndex + 4] = boxData.bbox.max.y;
    data[baseIndex + 5] = boxData.bbox.max.z;

    // 2个float(6,7)留空0填充
    data[baseIndex + 6] = 0;
    data[baseIndex + 7] = 0;

    // inverseMatrix 16 floats，按列主序展开
    const m = boxData.inverseMatrix.elements;
    for (let j = 0; j < 16; j++) {
      data[baseIndex + 8 + j] = m[j];
    }

    // color (3 floats)
    data[baseIndex + 24] = boxData.color.r;
    data[baseIndex + 25] = boxData.color.g;
    data[baseIndex + 26] = boxData.color.b;

    // opacity (1 float)
    data[baseIndex + 27] = boxData.opacity;
  });

  return { data, width: texWidth, height: texHeight };
}

export function createBoxTexture(data: Float32Array, width: number, height: number): DataTexture {
  const texture = new DataTexture(data, width, height, RGBAFormat, FloatType);
  texture.minFilter = texture.magFilter = LinearFilter;
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;

  return texture;
}
