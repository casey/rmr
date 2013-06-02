//!name glow

// shader by this guy: http://myheroics.wordpress.com/2008/09/04/glsl-bloom-shader/

uniform sampler2D pass_input;

precision highp float;
precision highp int;

varying vec2 uv;

//!vertex

attribute vec4 position;

void main() {
  gl_Position = position;
  uv = position.xy * 0.5 + 0.5;
}

//!fragment

void main() {
  vec4 sum = vec4(0);

  for (int i = -4 ;i < 4; i++) {
    for (int j = -4; j < 4; j++) {
      vec4 sample = texture2D(pass_input, uv + vec2(i, j) * 0.004) * 0.25;
      sum += sample * (1.0 - sample.a);
    }
  }

  vec4 color = texture2D(pass_input, uv);

  float r = color.r;
  float f = r < 0.3 ? 0.012 :
            r < 0.5 ? 0.009 :
                      0.0075 ;

  gl_FragColor = sum * sum * f + color;
}
