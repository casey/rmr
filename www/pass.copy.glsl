//!name copy

precision highp float;
precision highp int;

uniform sampler2D pass_input;

varying vec2 uv;

//!vertex

attribute vec4 position;

void main() {
  gl_Position = position;
  uv = position.xy * 0.5 + 0.5;
}

//!fragment

void main() {
  gl_FragColor = texture2D(pass_input, uv);
}
