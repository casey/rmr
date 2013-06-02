//!name smooth

precision highp float;
precision highp int;

varying vec4 v_color;
varying vec2 uv;

uniform mat4 transform;

uniform sampler2D cam_wave;
uniform sampler2D cam_freq;

uniform float cam_intensity;
uniform float cam_beat;
uniform float cam_aspect;

//!vertex

attribute vec4 position;

void main() {
  gl_Position = transform * position;
  uv = position.xy * 0.5 + 0.5;
}

//!fragment

#define smoothing .1
#define num_bands 256
#define pixel_scale 1  

float getAmp(float x)
{
  return texture2D(cam_freq, vec2(x,0)).x;;
}

vec3 vignetteEffect(vec2 _pos, vec2 _center, float amount)
{
  float d = distance(_pos, _center);
  d*=amount;
  d = 1.-d;
  d*=d;
  return vec3(d,d,d);
}

vec3 gridEffect(vec3 _pos, float multiplier)
{
  float value = sin(multiplier*_pos.x)/(multiplier*_pos.y);  
  return vec3(value,value,value);
}

void main()
{
  vec2 center = vec2(.5*cam_aspect, .5); 
  vec2 pos = vec2(uv.x*cam_aspect, uv.y);

  float freq = texture2D(cam_freq, uv).x;
  vec3 vignette = vignetteEffect(pos, center, 1.0);

  float mult = 4.5; 
  vec3 grid = gridEffect(vec3(pos.x, pos.y, 0), mult);

  for(int i = 0; i < 4; i++)
  {
    grid+=gridEffect(grid,distance(grid,vec3(i*1,getAmp(.25),getAmp(.5))));
 
  }
  gl_FragColor = vec4(vignette*grid,1.0); 
}
