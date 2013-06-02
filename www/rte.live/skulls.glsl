//!name skulls

precision highp float;
precision highp int;

varying vec4 v_color;
varying vec2 uv;

uniform mat4 transform;
uniform sampler2D cam_wave;
uniform sampler2D cam_dia;

uniform float cam_beat;

//!vertex

attribute vec4 position;

void main() {
  gl_Position = transform * position;
  uv = position.xy * 0.5 + 0.5;
}

//!fragment

void main() {
  vec2 muv = fract(uv * (cam_beat + 1.0) * 2.0);

  vec4 dia = texture2D(cam_dia, muv);

  if (dia.a > 0.0) {
    gl_FragColor = dia;
  } else {
    float bottom = 0.18;
    float top    = 1.0 - 0.73;
    float left   = 0.39;
    float right  = 1.0 - 0.39;

    if (muv.x < left || muv.x > right || muv.y < bottom || muv.y > top) {
      discard;
    } else {
      float x = (muv.x - left  ) / (right - left);
      float y = (muv.y - bottom) / (top   - bottom);
      vec2 auv = vec2(x, y);
      float f1 = (texture2D(cam_wave, auv).r - 0.5) * 3.0 + 0.5;
      float f2 = abs(auv.y - f1) < 0.1 ? 0.0 : 1.0;
      gl_FragColor = vec4(0.0, f2, f2, 1.0);
      //gl_FragColor = vec4(x, y, 0.0, 1.0);
    }
  }

  if ((uv.x > 0.5 && uv.y > 0.5) || (uv.x < 0.5 && uv.y < 0.5)) {
    gl_FragColor = vec4(1.0 - gl_FragColor.rgb, 1.0);
  }
}
