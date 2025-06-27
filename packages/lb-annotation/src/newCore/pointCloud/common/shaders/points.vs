precision highp float;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform float size;
uniform float brightness;

attribute vec3 position;

#ifdef USE_GRADIENT_TEXTURE
  uniform sampler2D gradientTexture;
  uniform vec2 gradientRange;
#elif defined(USE_COLOR)
  uniform vec3 color;
#else
  attribute vec3 color;
#endif

#ifdef USE_HIGHLIGHT_BOX
  struct FilterBox {
    vec3 min;
    vec3 max;
    vec3 color;
    mat4 inverseMatrix;
  };
  uniform FilterBox highlightBox;
  bool isInBox(vec3 pos, vec3 min, vec3 max){
    return pos.x >= min.x && pos.x <= max.x && pos.y >= min.y && pos.y <= max.y && pos.z >= min.z && pos.z <= max.z;
  }
#endif

varying vec3 vColor;

void main() {
  #ifdef USE_GRADIENT_TEXTURE
    float range = max(gradientRange.y - gradientRange.x, 1e-6);
    float t = clamp((position.z - gradientRange.x) / range, 0.0, 1.0);
    vColor = texture2D(gradientTexture, vec2(t, 0.5)).rgb;
  #else
    vColor = color;
  #endif

  #ifdef USE_HIGHLIGHT_BOX
    vec4 boxPos = highlightBox.inverseMatrix *  vec4( position, 1.0 );
    if(isInBox(boxPos.xyz,highlightBox.min,highlightBox.max)){
      vColor = highlightBox.color;
    }
  #endif

  vColor *= brightness;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = size;
}
