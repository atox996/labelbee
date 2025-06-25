precision highp float;

uniform float opacity;

#ifdef USE_JET_TEXTURE
  uniform sampler2D jetTexture;
  varying float vJetT;
#else
  varying vec3 vColor;
#endif

void main() {
  vec2 coord = gl_PointCoord - 0.5;
  if (length(coord) > 0.5) discard;

  vec3 finalColor;

  #ifdef USE_JET_TEXTURE
    finalColor = texture2D(jetTexture, vec2(vJetT, 0.5)).rgb;
  #else
    finalColor = vColor;
  #endif

  gl_FragColor = vec4(finalColor * opacity, opacity);
}
