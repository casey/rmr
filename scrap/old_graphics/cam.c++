#import "cam.h"
#import "win.h"
#import "rmr.h"
#import "gl.h"
#import "color.h"
#import "ephemera.h"
#import "syphon.h"
#import "quat.h"

#import <ctime>
#import <OpenGL/gl3.h>
#import <GLFW/glfw3.h>

constexpr float trackball_size = 2.0 / 3.0;

static vec3 trackball_project(const vec2 v) {
  float radius = trackball_size;
  float m = v.magnitude();
  float z;
  if (m < radius * rmr.sqrt(1.0 / 2.0)) { // on sphere
    z = rmr.sqrt(radius * radius - m * m);
  } else { // on hyperbola
    float t = radius / rmr.sqrt(2);
    z = t * t / m;
  }
  return v.extend(z);
}

quat trackball(vec2 start, vec2 end) {
  if (start == end) return quat::identity();

  // First, figure out z-coordinates for projection of start and end to "trackball" surface
  vec3 s = trackball_project(start);
  vec3 e = trackball_project(end  );

  // axis of rotation
  vec3 a = e.cross(s);

  // angle of rotation
  vec3 d = s - e;
  float t = d.magnitude() / (2.0 * trackball_size);

  t = rmr.clamp(t, -1.0, 1.0);

  float phi = 2.0 * rmr.asin(t);

  return quat::from_aa(a, phi);
}

// track state of keys
// do simple camera movement (trackball, fps, rts, drag, etc)
// process event updates
// do simple vim-like keyboard commands

struct nav_t {
  vec2  _size;
  bool  _cursor_down       = false;
  bool  _cursor_out        = false;
  vec2  _cursor            = {0.0, 0.0};
  vec2  _drag              = {0.0, 0.0};
  vec2  _drag_start        = {0.0, 0.0};
  vec2  _drag_end          = {0.0, 0.0};
  vec2  _last_cursor       = {0.0, 0.0};
  mat4  _trackball         = mat4::identity();
  mat4  _trackball_current = mat4::identity();
  mat4  _fps               = mat4::identity();
  float _zoom              = 0.0;
  map<int, bool> _keys = {};

  vec2  cursor()       { return _cursor;                         }
  vec2  size()         { return _size;                           }
  float zoom()         { return _zoom;                           }
  vec2  drag()         { return _drag;                           }
  vec2  drag_start()   { return _drag_start;                     }
  vec2  drag_end()     { return _drag_end;                       }
  mat4  trackball()    { return _trackball * _trackball_current; }
  mat4  fps()          { return _fps;                            }
  float width()        { return size().x();                      }
  float height()       { return size().y();                      }
  float aspect_ratio() { return width() / height();              }
  bool  cursor_down()  { return _cursor_down;                    }

  nav_t(float width, float height) : _size(width, height) {
  }

  void update(old_event_t e) {
    if (e.type.mousedown ) _cursor_down = true;
    if (e.type.mouseup   ) _cursor_down = false;
    if (e.type.mouseleave) _cursor_out  = true;
    if (e.type.mouseenter) _cursor_out  = false;

    if (e.type.mouseup) {
      _trackball         = trackball();
      _trackball_current = mat4::identity();
      _drag_end          = _cursor;
    }

    if (e.type.resize                   ) _size               = vec2(e.width, e.height);
    if (e.type.mousemove                ) _cursor             = (vec2(e.mousex, e.mousey) / _size) * 2.0 - 1.0;
    if (e.type.mousedown                ) _drag_start         = _cursor;
    if (_cursor_down && e.type.mousemove) _drag              += (_cursor - _last_cursor) * -0.5;
    if (e.type.mousemove                ) _last_cursor        = _cursor;
    if (e.type.scroll                   ) _zoom              += e.scrolly;
    if (_cursor_down && e.type.mousemove) _trackball_current  = ::trackball(_drag_start, _cursor).to_matrix();

    if (e.type.keyup  ) _keys[e.key] = false;
    if (e.type.keydown) _keys[e.key] = true;

    float dt             = 1.0 / 60.0;
    float speed_factor   = dt;
    float movement_speed = speed_factor;
    float rotation_speed = speed_factor * 0.5;

    if (e.type.tick) {
      if (_keys[GLFW_KEY_D    ]) _fps.translate_x( movement_speed);
      if (_keys[GLFW_KEY_A    ]) _fps.translate_x(-movement_speed);

      if (_keys[GLFW_KEY_E    ]) _fps.translate_y( movement_speed);
      if (_keys[GLFW_KEY_C    ]) _fps.translate_y(-movement_speed);

      if (_keys[GLFW_KEY_S    ]) _fps.translate_z( movement_speed);
      if (_keys[GLFW_KEY_W    ]) _fps.translate_z(-movement_speed);

      if (_keys[GLFW_KEY_UP   ]) _fps.rotate_x   ( rotation_speed);
      if (_keys[GLFW_KEY_DOWN ]) _fps.rotate_x   (-rotation_speed);
      if (_keys[GLFW_KEY_LEFT ]) _fps.rotate_y   ( rotation_speed);
      if (_keys[GLFW_KEY_RIGHT]) _fps.rotate_y   (-rotation_speed);
    }
  }
};

struct cam_t::data_t {
  win_t&         w;
  gl_t&          gl;
  cam_t*         parent;
  population_t   pop      = {};
  nav_t*         nav      = nullptr;
  vector<cam_t*> children = {};
  int            beat     = 0;
  double         now      = 0.0;
  double         elapsed  = 0.0;
  double         start    = 0.0;
  double         width    = 1.0;
  double         height   = 1.0;
  double         top      = 0.0;
  double         left     = 0.0;
  bool           hidden   = false;
};

static ephemera_t<cam_t*> begetter;

using _ = cam_t&;

cam_t::cam_t(win_t& w) : __(*new data_t{w, w.gl().spawn(), nullptr}) {
  // todo:  __.nav is a pointer because of this clang bug:
  //        http://llvm.org/bugs/show_bug.cgi?id=19190
  __.nav = new nav_t(w.width(), w.height());

  w.handler([&](old_event_t e) { __.nav->update(e); });

  gl()
  .new_vbo("quad")
  .upload_ccw_quad("quad")
  .supplier("cam_elapsed",         [&](gl_t& gl, sym_t var) { gl.value(var, __.elapsed                             ); })
  .supplier("cam_now",             [&](gl_t& gl, sym_t var) { gl.value(var, __.now                                 ); })
  .supplier("cam_beat",            [&](gl_t& gl, sym_t var) { gl.value(var, __.beat                                ); })
  .supplier("cam_intensity",       [&](gl_t& gl, sym_t var) { gl.value(var, rmr.intensity()                        ); })
  .supplier("cam_resolution",      [&](gl_t& gl, sym_t var) { gl.value(var, __.nav->size()                         ); })
  .supplier("cam_aspect_ratio",    [&](gl_t& gl, sym_t var) { gl.value(var, __.nav->aspect_ratio()                 ); })
  .supplier("cam_drag",            [&](gl_t& gl, sym_t var) { gl.value(var, __.nav->drag()                         ); })
  .supplier("cam_drag_start",      [&](gl_t& gl, sym_t var) { gl.value(var, __.nav->drag_start()                   ); })
  .supplier("cam_cursor",          [&](gl_t& gl, sym_t var) { gl.value(var, __.nav->cursor()                       ); })
  .supplier("cam_zoom",            [&](gl_t& gl, sym_t var) { gl.value(var, __.nav->zoom()                         ); })
  .supplier("cam_trackball",       [&](gl_t& gl, sym_t var) { gl.value(var, __.nav->trackball()                    ); })
  .supplier("cam_trackball_start", [&](gl_t& gl, sym_t var) { gl.value(var, trackball_project(__.nav->drag_start())); })
  .supplier("cam_trackball_end",   [&](gl_t& gl, sym_t var) { gl.value(var, trackball_project(__.nav->cursor())    ); })
  .supplier("cam_fps",             [&](gl_t& gl, sym_t var) { gl.value(var, __.nav->fps()                          ); })
  .supplier("cam_rts",             [&](gl_t& gl, sym_t var) { gl.value(var, mat4::identity()                       ); })
  // shader toy variables
  .supplier("iGlobalTime",         [&](gl_t& gl, sym_t var) { gl.value(var, __.elapsed                             ); })
  .supplier("iResolution",         [&](gl_t& gl, sym_t var) { gl.value(var, __.nav->width(), __.nav->height(), 0.0 ); })
  .supplier("iMouse",              [&](gl_t& gl, sym_t var) { 
    if (__.nav->cursor_down()) {
      gl.value(var, 
        (__.nav->cursor    ().x() * 0.5 + 0.5) * __.nav->width (),
        (__.nav->cursor    ().y() * 0.5 + 0.5) * __.nav->height(),
        (__.nav->drag_start().x() * 0.5 + 0.5) * __.nav->width (),
        (__.nav->drag_start().y() * 0.5 + 0.5) * __.nav->height()
      );
    } else {
      gl.value(var, 
        (__.nav->drag_end  ().x() * 0.5 + 0.5) *  __.nav->width (),
        (__.nav->drag_end  ().y() * 0.5 + 0.5) *  __.nav->height(),
        (__.nav->drag_start().x() * 0.5 + 0.5) * -__.nav->width (),
        (__.nav->drag_start().y() * 0.5 + 0.5) * -__.nav->height()
      );
    }
  })
  .supplier("iDate", [&](gl_t& gl, sym_t var) { 
    time_t t      = time(NULL);
    tm* p         = localtime(&t);
    float year    = p->tm_year + 1900;
    float month   = p->tm_mon;
    float day     = p->tm_mday;
    float seconds = p->tm_hour * 60.0 * 60.0 + p->tm_min * 60.0 + p->tm_sec;
    gl.value(var, year, month, day, seconds);
  })
  ;
};

cam_t::cam_t(cam_t* begetter) : __(*new data_t{begetter->__.w, begetter->__.gl.spawn(), begetter}) {
  parent().__.children.push_back(this);
}

cam_t::cam_t() : cam_t(begetter.get()) {
}

cam_t::~cam_t() {
  for (auto child : __.children) {
    delete child;
  }

  delete __.nav;
  delete &__;
}

_ cam_t::imprint() {
  begetter.set(this);
  return *this;
};

_ cam_t::parent() {
  __.parent || rmr.die("cam.parent: no parent");
  return *__.parent;
};

_ cam_t::up() {
  return parent();
}

_ cam_t::root() {
  if (__.parent) return __.parent->root();
  return *this;
}

bool cam_t::is_root() {
  return *this == root();
}

bool cam_t::is_leaf() {
  return __.children.size() == 0;
}

bool cam_t::hidden() {
  return __.hidden;
}

_ cam_t::hidden(bool x) {
  __.hidden = x;
  return *this;
}

_ cam_t::toggle() {
  return hidden(!hidden());
}

_ cam_t::beat() {
  __.beat++;
  return *this;
}

_ cam_t::show() {
  hidden(false);
  return *this;
}
_ cam_t::hide() {
  hidden(true);
  return *this;
}

gl_t& cam_t::gl() {
  return __.gl;
}

win_t& cam_t::win() {
  return __.w;
}

_ cam_t::operator[](int i) {
  i < 0 && rmr.die("cam.operator[]: negative index");
  i >= child_count() && rmr.die("cam.operator[]: index out of bounds");
  return *__.children[i];
}

int cam_t::child_count() {
  return __.children.size();
}

_ cam_t::width (double x) { __.width  = x; return *this; }
_ cam_t::height(double x) { __.height = x; return *this; }
_ cam_t::top   (double x) { __.top    = x; return *this; }
_ cam_t::left  (double x) { __.left   = x; return *this; }

_ cam_t::position(double w, double h, double l, double t) {
  width(w);
  height(h);
  left(l);
  top(t);
  return *this;
}

bool cam_t::operator==(cam_t& c) {
  auto that = &c;
  return that == this;
}

using iterator_t = cam_t::iterator_t;

iterator_t cam_t::begin() {
  return iterator_t(&*__.children.begin());
}

iterator_t cam_t::end() {
  return iterator_t(&*__.children.end());
}

_ cam_t::tree(int indent) {
  cerr << string(indent, ' ') << "cam" << endl;
  for (auto child : __.children) child->tree(indent + 2);
  return *this;
}

cam_t& cam_t::spawn() {
  return spawn<cam_t>();
};

void cam_t::tick() {
  double now = __.now = rmr.now();
  if (__.start == 0.0) __.start = now;
  __.elapsed  = now - __.start;

  __.parent && rmr.die("cam.render: only root camera can be rendered");

  int current_width  = win().width();
  int current_height = win().height();

  static uint fbo = 0;
  static uint tex = 0;
  static uint rbo = 0;

  static int allocated_width  = 0;
  static int allocated_height = 0;

  if (fbo == 0) {
    glGenTextures(1, &tex);
    glActiveTexture(GL_TEXTURE10);
    glBindTexture(GL_TEXTURE_2D, tex);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);

    glGenFramebuffers(1, &fbo);
    glBindFramebuffer(GL_FRAMEBUFFER, fbo);
    glFramebufferTexture(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, tex, 0);

    glGenRenderbuffers(1, &rbo);
    glBindRenderbuffer(GL_RENDERBUFFER, rbo);
    glFramebufferRenderbuffer(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_RENDERBUFFER, rbo);

    GLenum buffer = GL_COLOR_ATTACHMENT0;
    glDrawBuffers(1, &buffer);
  }

  glActiveTexture(GL_TEXTURE10);
  glBindTexture(GL_TEXTURE_2D, tex);
  glBindFramebuffer(GL_FRAMEBUFFER, fbo);
  glBindRenderbuffer(GL_RENDERBUFFER, rbo);

  if (allocated_width != current_width || allocated_height != current_height) {
    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, current_width, current_height, 0, GL_RGBA, GL_UNSIGNED_BYTE, 0);
    glRenderbufferStorage(GL_RENDERBUFFER, GL_DEPTH_COMPONENT, current_width, current_height);
    allocated_width  = current_width;
    allocated_height = current_height;
  }

  args_t args {
    win().frame(),
    0,
    0,
    current_width,
    current_height,
    __.start,
    now,
    now - __.start
  };

  tick(args);

  glBindFramebuffer(GL_FRAMEBUFFER, 0);

  gl()
  .prepare("copy")
  .value("source", texture_unit_t{10})
  .pack({"position"}, "quad")
  .ready()
  .triangles()
  .draw_arrays()
  .done()
  ;

  static bool had_clients = false;
  bool has_clients = win().syphon().has_clients();
  if (has_clients && !had_clients) { rmr << "cam.tick: +syphon"; }
  if (had_clients && !has_clients) { rmr << "cam.tick: -syphon"; }
  had_clients = has_clients;

  if (has_clients) {
    win().syphon().bind();
    gl()
    .prepare("copy")
    .value("source", texture_unit_t{10})
    .pack({"position"}, "quad")
    .ready()
    .triangles()
    .draw_arrays()
    .done()
    ;
    win().syphon().publish();
  }
}

void cam_t::tick(const args_t& args) {
  if (hidden()) return;

  args_t copy = args;

  copy.x = rmr.round(args.w * __.left + args.x);
  copy.y = rmr.round(args.h * __.top  + args.y);
  copy.w = rmr.round(args.w * __.width);
  copy.h = rmr.round(args.h * __.height);

  gl().aperture(copy.x, copy.y, copy.w, copy.h);

  render(args);

  for (auto child : __.children) {
    child->tick(copy);
  }
}

void cam_t::render(const args_t& a) {
  gl().clear_color(0x333_c).clear();
}
