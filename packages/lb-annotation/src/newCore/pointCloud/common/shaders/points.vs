precision highp float;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform float size;
uniform float brightness;

attribute vec3 position;

#ifdef USE_JET_TEXTURE
  uniform vec2 jetRange;
  varying float vJetT;
#else
  varying vec3 vColor;
#endif

#ifdef USE_COLOR
  uniform vec3 color;
#else
  attribute vec3 color;
#endif

void main() {
  #ifdef USE_JET_TEXTURE
    vJetT = clamp((position.z - jetRange.x) / (jetRange.y - jetRange.x), 0.0, 1.0);
  #else
    vColor = color * brightness;
  #endif

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = size;
}
