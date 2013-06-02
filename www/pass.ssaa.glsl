//!name ssaa

uniform sampler2D pass_input;

precision highp float;
precision highp int;

varying vec2 uv;

uniform vec2 pass_resolution;

vec2 step = 1.0 / pass_resolution;

//!vertex

attribute vec4 position;

void main() {
  gl_Position = position;
  uv = position.xy * 0.5 + 0.5;
}

//!fragment

void main() {
  gl_FragColor = texture2D(pass_input, uv + vec2(0.25, 0.25) * step) +
                 texture2D(pass_input, uv + vec2(0.25, 0.75) * step) +
                 texture2D(pass_input, uv + vec2(0.75, 0.25) * step) +
                 texture2D(pass_input, uv + vec2(0.75, 0.75) * step);

  gl_FragColor *= 0.25;
}
