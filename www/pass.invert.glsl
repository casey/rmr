//!name invert

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
  vec4 c = texture2D(pass_input, uv);
  gl_FragColor = vec4(1.0 - c.r, 1.0 - c.g, 1.0 - c.b, c.a);
}
