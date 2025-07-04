precision highp float;

uniform float opacity;

varying vec3 vColor;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  if (dot(coord, coord) > 0.25) discard;

  gl_FragColor = vec4(vColor, opacity);
}
