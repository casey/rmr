//!name basic

precision highp float;

varying vec4 v_color;

//!vertex

attribute vec4 position;
attribute vec4 color;

attribute vec4 tc0;
attribute vec4 tc1;
attribute vec4 tc2;
attribute vec4 tc3;

attribute vec4 misc;

void main() {
  v_color  = color;

  gl_Position = tc0 * position.x
              + tc1 * position.y
              + tc2 * position.z
              + tc3;

  gl_PointSize = misc.w;
}

//!fragment

void main() {
  gl_FragColor = v_color;
}
