//!name ex

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
  //gl_FragColor = vec4(f, f, f, 1.0);

  vec2 muv = fract(uv * (cam_beat * 2.0 + 1.0));

  float d = min(abs((1.0 - muv.x) - muv.y), abs(muv.x - muv.y));

  if (d < (0.1 + cam_intensity * 0.2)) {
    //gl_FragColor = vec4(1.0);
    discard;
  } else {
    gl_FragColor = vec4(1.0);
  }
}
