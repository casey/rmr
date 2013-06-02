//!name fxaa

precision mediump float;
precision mediump int;

uniform sampler2D pass_input;
uniform vec2 pass_resolution;

vec2 step = 1.0 / pass_resolution;

varying vec2 uv;

//!vertex

attribute vec4 position;

void main() {
  gl_Position  = position;
  uv = position.xy * 0.5 + 0.5;
}

//!fragment

void main() {
  float FXAA_SPAN_MAX   = 8.0;
  const float FXAA_REDUCE_MUL = 1.0 / 8.0;
  float FXAA_REDUCE_MIN = 1.0 / 128.0;

  vec3 rgbNW = texture2D(pass_input, uv + (vec2(-1.0, -1.0) * step)).xyz;
  vec3 rgbNE = texture2D(pass_input, uv + (vec2(+1.0, -1.0) * step)).xyz;
  vec3 rgbSW = texture2D(pass_input, uv + (vec2(-1.0, +1.0) * step)).xyz;
  vec3 rgbSE = texture2D(pass_input, uv + (vec2(+1.0, +1.0) * step)).xyz;
  vec3 rgbM  = texture2D(pass_input, uv                            ).xyz;

  vec3 luma = vec3(0.299, 0.587, 0.114);
  float lumaNW = dot(rgbNW, luma);
  float lumaNE = dot(rgbNE, luma);
  float lumaSW = dot(rgbSW, luma);
  float lumaSE = dot(rgbSE, luma);
  float lumaM  = dot(rgbM,  luma);

  float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
  float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));

  vec2 dir;
  dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));
  dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));

  float dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) * (0.25 * FXAA_REDUCE_MUL), FXAA_REDUCE_MIN);

  float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);

  dir = min(vec2(FXAA_SPAN_MAX, FXAA_SPAN_MAX), max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX), dir * rcpDirMin)) * step;

  vec3 rgbA = (1.0 / 2.0) * (
    texture2D(pass_input, uv + dir * (1.0 / 3.0 - 0.5)).xyz +
    texture2D(pass_input, uv + dir * (2.0 / 3.0 - 0.5)).xyz);

  vec3 rgbB = rgbA * (1.0/2.0) + (1.0/4.0) * (
    texture2D(pass_input, uv + dir * (0.0 / 3.0 - 0.5)).xyz +
    texture2D(pass_input, uv + dir * (3.0 / 3.0 - 0.5)).xyz);

  float lumaB = dot(rgbB, luma);

  if ((lumaB < lumaMin) || (lumaB > lumaMax)) {
    gl_FragColor.xyz = rgbA;
  } else {
    gl_FragColor.xyz = rgbB;
  }

  gl_FragColor.a = 1.0;
}
