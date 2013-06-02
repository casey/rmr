//!name flatform

precision highp float;
precision highp int;

varying vec4 v_color;
varying vec2 uv;

uniform mat4 transform;

uniform sampler2D cam_wave;
uniform sampler2D cam_freq;

//!vertex

attribute vec4 position;

void main() {
  gl_Position = transform * position;
  uv = position.xy * 0.5 + 0.5;
}

//!fragment

void main() {
  float f = texture2D(cam_wave, uv.yx).r;
  gl_FragColor = vec4(f, f, f, 1.0);
}
