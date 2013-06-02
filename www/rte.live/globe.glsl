//!name globe

precision highp float;
precision highp int;

varying vec4 v_color;
varying vec2 uv;

uniform mat4 transform;

uniform float cam_elapsed;
uniform float cam_now;
uniform float cam_aspect;

uniform sampler2D cam_wave;
uniform sampler2D cam_freq;

uniform float cam_intensity;
uniform float cam_beat;


const vec4 black = vec4(0.0, 0.0, 0.0, 1.0);
const vec4 white = vec4(1.0, 1.0, 1.0, 1.0);
const vec4 red   = vec4(1.0, 0.0, 0.0, 1.0);
const vec4 green = vec4(0.0, 1.0, 0.0, 1.0);
const vec4 blue  = vec4(0.0, 0.0, 1.0, 1.0);
const vec4 gray  = vec4(0.5, 0.5, 0.5, 1.0);
const vec4 grey  = vec4(0.3, 0.3, 0.3, 1.0);

const float pi  = 3.14159265;
const float tau = 6.28318530;

float turns(float x) { return pi * 2.0 * x; }

vec3 transform_direction(mat4 m, vec3 v                   ) { return (m * vec4(v, 0.0)).xyz;                }
vec3 transform_point    (mat4 m, vec3 v                   ) { return (m * vec4(v, 1.0)).xyz;                }
vec3 transform_direction(mat4 m, float x, float y, float z) { return transform_direction(m, vec3(x, y, z)); }
vec3 transform_point    (mat4 m, float x, float y, float z) { return transform_point(m, vec3(x, y, z));     }

float op_u     (float a, float b         ) { return min(a, b);                    }
float op_u     (float a, float b, float c) { return min(min(a, b), c);            }
float op_sub   (float a, float b         ) { return max(a, -b);                   }
vec3  op_repeat(vec3 p, vec3 c           ) { return mod(p, c) - 0.5 * c;          }
vec3  op_repeat(vec3 p, float c          ) { return op_repeat(p, vec3(c, c, c));  }
float d_sphere (vec3 p, float radius     ) { return length(p) - radius;           }
float d_sphere (vec3 p                   ) { return d_sphere(p, 1.0);             }
float d_box    (vec3 p, vec3 b           ) { return length(max(abs(p) - b, 0.0)); }
float d_cube   (vec3 p, float l          ) { return d_box(p, vec3(l, l, l));      }
float d_cube   (vec3 p                   ) { return d_box(p, vec3(1, 1, 1));      }
float d_half   (vec3 p                   ) { return p.x;                          }

float d_torus(vec3 p, float radius, float diameter) {
  vec2 q = vec2(length(p.xz)-radius,p.y);
  return length(q)-diameter;
}

struct march_cam_t {
  vec3 origin;
  vec3 ray;
};

march_cam_t march_cam(
  mat4 transform,
  vec3 camera_position,
  float aspect_ratio,
  vec2 uv
) {
  vec3 cam_pos      = transform_point    (transform, camera_position);
  vec3 cam_look     = transform_direction(transform, 0.0, 0.0, -1.0);
  vec3 cam_up       = transform_direction(transform, 0.0, 1.0,  0.0);
  vec3 side_norm    = normalize(cross(cam_look, cam_up));
  vec3 up_norm      = normalize(cross(side_norm, cam_look));
  vec3 world_facing = cam_pos + cam_look;
  vec2 ruv          = uv - 0.5;
  vec3 world_pix    = world_facing + ruv.x * side_norm * aspect_ratio + ruv.y * up_norm;
  vec3 rel_vec      = normalize(world_pix - cam_pos);
  march_cam_t result;
  result.origin = cam_pos;
  result.ray    = rel_vec;
  return result;
}

uniform float win_now;
uniform float win_elapsed;
uniform int   win_beat;
uniform float win_intensity;
uniform vec2  win_resolution;
uniform vec2  win_inv_resolution;
uniform float win_aspect_ratio;

uniform vec2  win_cursor;
uniform mat4  win_trackball;
uniform mat4  win_fps;
uniform mat4  win_rts;
uniform vec2  win_drag;
uniform vec2  win_drag_start;
uniform float win_zoom;

uniform vec3 win_trackball_start;
uniform vec3 win_trackball_end;

// shadertoy uniforms
uniform vec3        iResolution;           // viewport resolution (in pixels)
uniform float       iGlobalTime;           // shader playback time (in seconds)
uniform vec4        iMouse;                // mouse pixel coords. xy: current (if MLB down), zw: click
uniform vec4        iDate;                 // (year, month, day, time in seconds)
//uniform sampler2D iChannel0..3;          // input channel. XX = 2D/Cube
//uniform float     iChannelTime[4];       // channel playback time (in seconds)
//uniform vec3      iChannelResolution[4]; // channel resolution (in pixels)


//!vertex

attribute vec4 position;

void main(void) {
  uv = position.xy * 0.5 + 0.5;
  gl_Position = position;
}

//!fragment

float d_quarter(vec3 p) {
  return max(-p.x, p.z);
}

vec3 rotate_vector(vec4 quat, vec3 vec) {
  return vec + 2.0 * cross( cross( vec, quat.xyz ) + quat.w * vec, quat.xyz );
}

vec4 quat_from_aa(vec3 v, float angle) {
	float s = sin(angle * 0.5);
  return vec4( 
    v.x * s,
    v.y * s,
    v.z * s,
    cos(angle * 0.5)
  );
}

float df(vec3 p) {
  vec3  rotation_axis = normalize(vec3(-1, 1, 0));
  float angle         = cam_elapsed;
  vec4  q             = quat_from_aa(rotation_axis, angle);
  vec3  v             = normalize(vec3(1, 1, 0)) * 1.40;
  vec3 rotated        = rotate_vector(q, v);

  return op_u(
    op_sub(d_sphere(p), d_quarter(p)),
    d_sphere(p, 0.4 * (1.0 + cam_intensity)),
    d_sphere(p - rotated, 0.1 + cam_intensity * 0.2)
  );
}

vec3 sat(vec3 c, float factor) {
  float p = sqrt(c.r * c.r * .299+ c.g * c.g * .587 + c.b * c.b * .114);
  return vec3(
    p + (c.r - p) * factor,
    p + (c.g - p) * factor,
    p + (c.b - p) * factor
  );
}

void main(void) {
  march_cam_t cam       = march_cam(transform, vec3(0, 0, 3), cam_aspect, uv);
	float       dist      = 0.02;
	float       t         = 0.5;
	float       max_depth = 12.0;
  float       delta     = 0.001;
	vec3        pos       = vec3(0);
	
	for (int i = 0; i < 180; i++) {
		pos = cam.origin + cam.ray * t;
		dist = df(pos);
		t += dist;
    if (abs(dist) < delta || t > max_depth) break;
	}

  float l = length(pos);

  if (t > max_depth) {
    discard;
  }
	
	vec3 small  = vec3(delta, 0, 0);
	vec3 normal = vec3(dist - df(pos - small.xyy), dist - df(pos - small.yxy), dist - df(pos - small.yyx));
	normal = normalize(normal);

  vec3 diffuse  = l > 1.10 ? vec3(0.9,   0.8,   0.7  ) :
                  l > 1.00 ? vec3(0.200, 0.400, 0.600) :
                  l > 0.97 ? vec3(0.180, 0.749, 0.855) :
                  l > 0.90 ? vec3(0.576, 0.239, 0.102) :
                  l > 0.75 ? vec3(0.894, 0.353, 0.110) :
                  l > (0.401 * (1.0 + cam_intensity)) ? vec3(0.984, 0.671, 0.322) :
                              vec3(0.992, 0.945, 0.510) ;

  diffuse = sat(diffuse, 1.25);

  vec3  light_pos   = vec3(25, 25, 0);
  vec3  light_dir   = normalize(light_pos - pos);
  vec3  reflect_dir = reflect(-light_dir, normal);
  vec3  view_dir    = normalize(-pos);
  float lambertian  = max(dot(light_dir, normal), 0.0);
  float specular    = 0.0;

  if(lambertian > 0.0) {
    float spec_angle = max(dot(reflect_dir, view_dir), 0.0);
    specular = pow(spec_angle, 8.0);
  }

  vec3 specular_color = vec3(white) * 0.2;

  gl_FragColor = vec4(diffuse * 0.5 + lambertian * diffuse + specular * specular_color, 1.0);
}
