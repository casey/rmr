//!name gray

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
  float g = dot(c.rgb, vec3(0.299, 0.587, 0.114));
  gl_FragColor = vec4(g, g, g, c.a);
}
