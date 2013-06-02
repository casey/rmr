//!name bay

precision highp float;
precision highp int;

varying vec4 v_color;
varying vec2 uv;

uniform float cam_elapsed;
uniform float cam_now;

uniform mat4 transform;
uniform sampler2D cam_wave;
uniform sampler2D cam_bay;
uniform float cam_intensity;

//!vertex

attribute vec4 position;

void main() {
  gl_Position = transform * position;
  uv = position.xy * 0.5 + 0.5;
}

//!fragment

void main() {
  vec4 sample = texture2D(cam_bay, uv);
  
  float x = sample.x;

  if (x == 1.0 || x > (cam_elapsed + cam_intensity * 5.0) / 20.0) {
    discard;
  } else {
    float t = 1.0 - fract((cam_elapsed + cam_intensity * 5.0) / 20.0 - x);
    gl_FragColor = vec4(t, t, t, 1.0);
  }
}
