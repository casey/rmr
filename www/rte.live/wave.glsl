//!name wave

precision highp float;
precision highp int;

varying vec4 v_color;
varying vec2 uv;

uniform mat4 transform;
uniform sampler2D cam_wave;
uniform sampler2D cam_dia;

//!vertex

attribute vec4 position;

void main() {
  gl_Position = transform * position;
  uv = position.xy * 0.5 + 0.5;
}

//!fragment

void main() {
  float f1 = (texture2D(cam_wave, uv).r - 0.5) * 3.0 + 0.5;
  float f2 = abs(uv.y - f1) < 0.05 ? 0.0 : 1.0;
  gl_FragColor = vec4(1.0, f2 * 0.8, f2 * 0.4, 1.0);
}
