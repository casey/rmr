//!name square

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

  float dx = abs(muv.x - 0.5);
  float dy = abs(muv.y - 0.5);

  float size = cam_intensity * 0.3 + 0.1;

  if (dx < size && dy < size) {
    discard;
  } else {
    gl_FragColor = vec4(1.0);
  }

/*
  float d = max(muv.x - 0.5, muv.y - 0.5);

  if (d < (0.01 + cam_intensity * 0.2)) {
    gl_FragColor = vec4(1.0);
  } else {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
  }
*/
}
