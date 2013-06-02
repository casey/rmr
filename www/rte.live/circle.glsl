//!name circle

precision highp float;
precision highp int;

varying vec4 v_color;
varying vec2 uv;

uniform mat4 transform;

uniform sampler2D cam_wave;
uniform sampler2D cam_freq;

uniform float cam_intensity;
uniform float cam_beat;

//!vertex

attribute vec4 position;

void main() {
  gl_Position = transform * position;
  uv = position.xy * 0.5 + 0.5;
}

//!fragment

void main() {
  vec2 muv = fract(uv * (cam_beat * 2.0 + 1.0));

  float dx = muv.x - 0.5;
  float dy = muv.y - 0.5;

  float d = sqrt(dx * dx + dy * dy);

  float size = cam_intensity * 0.3 + 0.1;

  if (d < size) {
    discard;
  } else {
    gl_FragColor = vec4(1.0);
  }
}
