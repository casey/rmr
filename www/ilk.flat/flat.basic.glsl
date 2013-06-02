//!name flat.basic

precision highp float;

varying vec4 v_color;

//!vertex

uniform mat4 transform;

attribute vec4 position;
attribute vec4 color;

// add point size support

void main() {
  v_color = color;
  gl_Position = transform * position;
}

//!fragment

void main() {
  gl_FragColor = v_color;
}
