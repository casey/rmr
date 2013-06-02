//!name color

precision highp float;
precision highp int;

varying vec2 uv;

uniform float cam_elapsed;
uniform float cam_now;

uniform mat4 transform;
uniform sampler2D cam_wave;
uniform float cam_intensity;

//!vertex

attribute vec4 position;

void main() {
  gl_Position = transform * position;
  uv = position.xy * 0.5 + 0.5;
}

//!fragment

void main() {
  gl_FragColor = vec4(uv, sin(cam_elapsed) * 0.5 + cam_intensity, 1.0 - cam_intensity);
}
