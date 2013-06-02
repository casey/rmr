#import "win.h"
#import "gl.h"
#import "rmr.h"
#import "timer.h"
#import "event.h"
#import "fmt.h"
#import "cam.h"
#import "img.h"
#import "syphon.h"
#import "once.h"

#import <queue>
using std::queue;

#import <GLFW/glfw3.h>
#import <GLFW/glfw3native.h>

using _ = win_t&;

bool glfw_initialized = false;
int  window_count     = 0;

struct win_t::data_t {
  u64                     frame             = 0;
  int                     ms                = 0;
  string                  name              = "";
  gl_t*                   gl                = nullptr;
  cam_t*                  cam               = nullptr;
  syphon_t*               syphon            = nullptr;
  GLFWwindow*             w                 = nullptr;
  CGLContextObj           context           = nullptr;
  queue<old_event_t>          event_queue       = {};
  timer_t                 frame_timer       = {};
  vector<event_handler_t> handlers          = {};
  map<int, fun_t<void()>> shortcuts         = {};
  vector<fun_t<void()>>   tick_handlers     = {};
  population_t            pop               = {};
};

old_event_t& win_t::push() {
  auto& queue = __.event_queue;
  queue.push({});
  return queue.front();
}

old_event_t& push_event(GLFWwindow *w) {
  return ((win_t*)glfwGetWindowUserPointer(w))->push();
}

win_t::win_t(int width, int height, const string& name, bool resizable, bool hide) : __(*new data_t) {
  if (!glfw_initialized) {
    if (!glfwInit()) rmr.die("wint_t(): glfwInit failed");
    glfw_initialized = true;

    glfwSetErrorCallback([](int error, const char* description) {
      rmr.die("win_t: glfw error %: %"_fmt % error % description);
    });

    glfwSetMonitorCallback([](GLFWmonitor* monitor, int event){
      rmr.info("win_t: monitor %"_fmt % (event == GLFW_CONNECTED ? "connected" : "disconnected"));
    });
  }

  glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 4);
  glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 1);
  glfwWindowHint(GLFW_OPENGL_PROFILE       , GLFW_OPENGL_CORE_PROFILE);
  glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, true);
  glfwWindowHint(GLFW_RESIZABLE,             resizable);
  glfwWindowHint(GLFW_VISIBLE,               !hide);

  __.w = glfwCreateWindow(width, height, name.c_str(), nullptr, nullptr);
  __.w || rmr.die("win_t(): failed to create window \"%\""_fmt % name);
  __.name = name;
  glfwSetWindowUserPointer(__.w, this);
  glfwMakeContextCurrent(__.w);

  // todo: initialize cursor state. perhaps generate a synthetic cursor move event?

  __.gl = new gl_t(*this);

  glfwSetKeyCallback(__.w, [](GLFWwindow* w, int key, int code, int action, int mods) {
    auto& e          = push_event(w);
    e.type.keydown   = action == GLFW_PRESS;
    e.type.keyup     = action == GLFW_RELEASE;
    e.type.keyrepeat = action == GLFW_REPEAT;
    e.key            = key;
    e.shift          = mods & GLFW_MOD_SHIFT;
    e.control        = mods & GLFW_MOD_CONTROL;
    e.alt            = mods & GLFW_MOD_ALT;
    e.super          = mods & GLFW_MOD_SUPER;
  });

  glfwSetCharCallback(__.w, [](GLFWwindow* w, unsigned int codepoint) {
    auto& e          = push_event(w);
    e.type.character = true;
    e.codepoint      = codepoint;
  });

  glfwSetWindowFocusCallback(__.w, [](GLFWwindow* w, int focused) {
    auto& e      = push_event(w);
    e.type.focus = focused;
    e.type.blur  = !focused;
  });

  glfwSetMouseButtonCallback(__.w, [](GLFWwindow* w, int b, int a, int mods) {
    auto& e          = push_event(w);
    e.type.mousedown = a == GLFW_PRESS;
    e.type.mouseup   = a == GLFW_RELEASE;
    e.button         = b;
    e.shift          = mods & GLFW_MOD_SHIFT;
    e.control        = mods & GLFW_MOD_CONTROL;
    e.alt            = mods & GLFW_MOD_ALT;
    e.super          = mods & GLFW_MOD_SUPER;
  });

  glfwSetCursorEnterCallback(__.w, [](GLFWwindow* w, int entered) {
    auto& e           = push_event(w);
    e.type.mouseenter =  entered;
    e.type.mouseleave = !entered;
  });

  glfwSetCursorPosCallback(__.w, [](GLFWwindow* w, double x, double y) {
    int width, height;
    glfwGetWindowSize(w, &width, &height);
    auto& e          = push_event(w);
    e.type.mousemove = true;
    e.mousex         = x;
    e.mousey         = height - y;
  });

  glfwSetWindowSizeCallback(__.w, [](GLFWwindow* w, int width, int height) {
    auto& e       = push_event(w);
    e.type.resize = true;
    e.width       = width;
    e.height      = height;
  });

  glfwSetScrollCallback(__.w, [](GLFWwindow* w, double x, double y) {
    auto& e       = push_event(w);
    e.type.scroll = true;
    e.scrollx     = x;
    e.scrolly     = y;
  });

  glfwSetWindowCloseCallback    (__.w, [](GLFWwindow* w                       ) { rmr.info("window close");   });
  glfwSetWindowRefreshCallback  (__.w, [](GLFWwindow* w                       ) { rmr.info("window refresh"); });
  glfwSetWindowIconifyCallback  (__.w, [](GLFWwindow* w, int iconified        ) { rmr.info("iconify");        });
  glfwSetFramebufferSizeCallback(__.w, [](GLFWwindow* w, int width, int height) { rmr.info("buffer size");    });
  glfwSetWindowPosCallback      (__.w, [](GLFWwindow* w, int x, int y         ) { rmr.info("window pos");     });

  NSOpenGLContext* ns_ctx = glfwGetNSGLContext(__.w);
  CGLContextObj ctx_a = (CGLContextObj)[ns_ctx CGLContextObj];
  CGLContextObj ctx_b = CGLGetCurrentContext();

  ctx_a == ctx_b || rmr.die("win: retrieving cgl context failed");

  __.context = ctx_b;

  __.cam     = new cam_t(*this);
  __.syphon  = new syphon_t(*this);

  window_count++;
}

win_t::~win_t() {
  delete __.cam;
  delete __.syphon;
  delete __.gl;

  window_count--;
  if (window_count == 0) {
    glfwTerminate();
    glfw_initialized = false;
  }

  delete &__;
}

CGLContextObj& win_t::context() {
  return __.context;
}

_ win_t::open() {
  return *this;
}

gl_t& win_t::gl() {
  __.gl || rmr.die("win.gl: gl context not initialized");
  return *__.gl;
}

cam_t& win_t::cam() {
  __.cam || rmr.die("win.cam: camera not initialized");
  return *__.cam;
}

syphon_t& win_t::syphon() {
  return *__.syphon;
}

int           win_t::width()        const { int w, h; glfwGetWindowSize(__.w, &w, &h); return w;              }
int           win_t::height()       const { int w, h; glfwGetWindowSize(__.w, &w, &h); return h;              }
double        win_t::aspect_ratio() const { return double(width()) / height();                                }
double        win_t::cursor_x()     const { double x, y; glfwGetCursorPos(__.w, &x, &y); return x;            }
double        win_t::cursor_y()     const { double x, y; glfwGetCursorPos(__.w, &x, &y); return height() - y; }
vec2          win_t::cursor()       const { return vec2(cursor_x(), cursor_y());                              }
const string& win_t::name()         const { return __.name;                                                   }
bool          win_t::current()      const { return glfwGetCurrentContext() == __.w;                           }
bool          win_t::first()        const { return __.frame == 0;                                             }

_ win_t::left(int l) {
  int top;
  glfwGetWindowPos(__.w, &rmr.ti(), &top);
  glfwSetWindowPos(__.w, l,          top);
  return *this;
}

_ win_t::top(int t) {
  int left;
  glfwGetWindowPos(__.w, &left, &rmr.ti());
  glfwSetWindowPos(__.w,  left,  t       );
  return *this;
}

_ win_t::size(int w, int h) {
  glfwSetWindowSize(__.w, w, h);
  return *this;
}

_ win_t::name(string n) {
  __.name = n;
  glfwSetWindowTitle(__.w, __.name.c_str());
  return *this;
}

bool win_t::closing() const {
  return glfwWindowShouldClose(__.w);
}

win_t::operator bool() const {
  return !closing();
}

_ win_t::closing(bool c) {
  glfwSetWindowShouldClose(__.w, c);
  return *this;
}

constexpr int FAKE_MOD_UP     = GLFW_MOD_SUPER << 1;
constexpr int FAKE_MOD_DOWN   = GLFW_MOD_SUPER << 2;
constexpr int FAKE_MOD_REPEAT = GLFW_MOD_SUPER << 3;

_ win_t::tick() {
  auto& e = push_event(__.w);
  e.type.tick = true;
  glfwPollEvents();
  while (!__.event_queue.empty()) {
    auto e = __.event_queue.front();
    __.event_queue.pop();

    int key = e.key << 16;
    e.shift          && (key |= GLFW_MOD_SHIFT  );
    e.control        && (key |= GLFW_MOD_CONTROL);
    e.alt            && (key |= GLFW_MOD_ALT    );
    e.super          && (key |= GLFW_MOD_SUPER  );
    e.type.keyup     && (key |= FAKE_MOD_UP     );
    e.type.keydown   && (key |= FAKE_MOD_DOWN   );
    e.type.keyrepeat && (key |= FAKE_MOD_REPEAT );

    if (__.shortcuts.count(key)) __.shortcuts[key]();
    for (auto f : __.handlers) f(e);
  }
  for (auto f : __.tick_handlers) f(); // todo: get rid of tick handlers in favor of tick event
  cam().tick();
  if (first()) screenshot();
  glfwSwapBuffers(__.w); 
  __.ms = __.frame_timer.ms();
  __.frame_timer.reset();
  rmr.info("frame %: %ms"_fmt % __.frame % __.ms);
  __.frame++;
  if (frame() < 10) gl().check();
  gl().done();
  return *this;
};

u64 win_t::frame() { return __.frame; }

_ win_t::screenshot(img_t& dest) {
  dest.resize(width(), height());
  glReadPixels(0, 0, width(), height(), GL_RGBA, GL_UNSIGNED_BYTE, dest.bytes());
  return *this;
}

_ win_t::screenshot() {
  current() || rmr.die("win_t.screenshot: window not current");

  string dir = rmr.cfg("base") + "dat/screens";
  
  if (!rmr.is_dir(dir)) {
    rmr << "win.screenshot: dat/screens directory does not exist";
    return *this;
  }

  string filename = dir + "/%.%.png"_fmt(rmr.ms(), rmr.git_head());

  img_t dest;
  screenshot(dest);

  write_png(filename.c_str(), dest);
  return *this;
}

int win_t::ms() { return __.ms; }

_ win_t::handler(fun_t<void(const old_event_t&)> f) {
  __.handlers.push_back(f);
  return *this;
}

_ win_t::on(const string& shortcut, fun_t<void()> handler) {
  auto s = shortcut;
  int mods = 0;

  auto mod = [&](const string& prefix, int flag){
    if (s.find(prefix) == 0) {
      s.erase(0, prefix.length());
      mods |= flag;
    }
  };

  for(;;) {
    int l = s.length();
    mod("ctrl-",    GLFW_MOD_CONTROL);
    mod("control-", GLFW_MOD_CONTROL);
    mod("shift-",   GLFW_MOD_SHIFT  );
    mod("alt-",     GLFW_MOD_ALT    );
    mod("super-",   GLFW_MOD_SUPER  );
    mod("up-",      FAKE_MOD_UP     );
    mod("down-",    FAKE_MOD_DOWN   );
    mod("repeat-",  FAKE_MOD_REPEAT );
    if (s.length() == l) break;
  }

  (mods & FAKE_MOD_UP | mods & FAKE_MOD_DOWN | mods & FAKE_MOD_REPEAT) || (mods |= FAKE_MOD_DOWN);

  int code;

  if (s.length() == 1) {
    code = s[0];
    if (code >= 97 && code <= 122) code -= 32;
  }
  else if (s == "tab"   ) code = GLFW_KEY_TAB;
  else if (s == "space" ) code = GLFW_KEY_SPACE;
  else if (s == "enter" ) code = GLFW_KEY_ENTER;
  else if (s == "return") code = GLFW_KEY_ENTER;
  else rmr.die("win.on: unrecognized shortcut: "s + s);

  int key = mods | (code << 16);
  __.shortcuts.count(key) == 0 or rmr.die("remapping shortcuts not supported");
  __.shortcuts[key] = handler;

  return *this;
}

_ win_t::on_tick(fun_t<void()> handler) {
  __.tick_handlers.push_back(handler);
  return *this;
}

_ win_t::run() {
  while (*this) tick();
  return *this;
};

bool old_event_t::printable() const { return key >= 0   && key <= 256;           }
bool old_event_t::function() const  { return key >= 256 && key <= GLFW_KEY_LAST; }

bool old_event_t::key_space() const         { return key == GLFW_KEY_SPACE;         }  // printable
bool old_event_t::key_apostrophe() const    { return key == GLFW_KEY_APOSTROPHE;    } 
bool old_event_t::key_comma() const         { return key == GLFW_KEY_COMMA;         } 
bool old_event_t::key_minus() const         { return key == GLFW_KEY_MINUS;         } 
bool old_event_t::key_period() const        { return key == GLFW_KEY_PERIOD;        } 
bool old_event_t::key_slash() const         { return key == GLFW_KEY_SLASH;         } 
bool old_event_t::key_0() const             { return key == GLFW_KEY_0;             } 
bool old_event_t::key_1() const             { return key == GLFW_KEY_1;             } 
bool old_event_t::key_2() const             { return key == GLFW_KEY_2;             } 
bool old_event_t::key_3() const             { return key == GLFW_KEY_3;             } 
bool old_event_t::key_4() const             { return key == GLFW_KEY_4;             } 
bool old_event_t::key_5() const             { return key == GLFW_KEY_5;             } 
bool old_event_t::key_6() const             { return key == GLFW_KEY_6;             } 
bool old_event_t::key_7() const             { return key == GLFW_KEY_7;             } 
bool old_event_t::key_8() const             { return key == GLFW_KEY_8;             } 
bool old_event_t::key_9() const             { return key == GLFW_KEY_9;             } 
bool old_event_t::key_semicolon() const     { return key == GLFW_KEY_SEMICOLON;     } 
bool old_event_t::key_equal() const         { return key == GLFW_KEY_EQUAL;         } 
bool old_event_t::key_a() const             { return key == GLFW_KEY_A;             } 
bool old_event_t::key_b() const             { return key == GLFW_KEY_B;             } 
bool old_event_t::key_c() const             { return key == GLFW_KEY_C;             } 
bool old_event_t::key_d() const             { return key == GLFW_KEY_D;             } 
bool old_event_t::key_e() const             { return key == GLFW_KEY_E;             } 
bool old_event_t::key_f() const             { return key == GLFW_KEY_F;             } 
bool old_event_t::key_g() const             { return key == GLFW_KEY_G;             } 
bool old_event_t::key_h() const             { return key == GLFW_KEY_H;             } 
bool old_event_t::key_i() const             { return key == GLFW_KEY_I;             } 
bool old_event_t::key_j() const             { return key == GLFW_KEY_J;             } 
bool old_event_t::key_k() const             { return key == GLFW_KEY_K;             } 
bool old_event_t::key_l() const             { return key == GLFW_KEY_L;             } 
bool old_event_t::key_m() const             { return key == GLFW_KEY_M;             } 
bool old_event_t::key_n() const             { return key == GLFW_KEY_N;             } 
bool old_event_t::key_o() const             { return key == GLFW_KEY_O;             } 
bool old_event_t::key_p() const             { return key == GLFW_KEY_P;             } 
bool old_event_t::key_q() const             { return key == GLFW_KEY_Q;             } 
bool old_event_t::key_r() const             { return key == GLFW_KEY_R;             } 
bool old_event_t::key_s() const             { return key == GLFW_KEY_S;             } 
bool old_event_t::key_t() const             { return key == GLFW_KEY_T;             } 
bool old_event_t::key_u() const             { return key == GLFW_KEY_U;             } 
bool old_event_t::key_v() const             { return key == GLFW_KEY_V;             } 
bool old_event_t::key_w() const             { return key == GLFW_KEY_W;             } 
bool old_event_t::key_x() const             { return key == GLFW_KEY_X;             } 
bool old_event_t::key_y() const             { return key == GLFW_KEY_Y;             } 
bool old_event_t::key_z() const             { return key == GLFW_KEY_Z;             } 
bool old_event_t::key_left_bracket() const  { return key == GLFW_KEY_LEFT_BRACKET;  } 
bool old_event_t::key_backslash() const     { return key == GLFW_KEY_BACKSLASH;     } 
bool old_event_t::key_right_bracket() const { return key == GLFW_KEY_RIGHT_BRACKET; } 
bool old_event_t::key_grave_accent() const  { return key == GLFW_KEY_GRAVE_ACCENT;  } 
bool old_event_t::key_world_1() const       { return key == GLFW_KEY_WORLD_1;       } 
bool old_event_t::key_world_2() const       { return key == GLFW_KEY_WORLD_2;       } 

bool old_event_t::key_escape() const        { return key == GLFW_KEY_ESCAPE;        } // function
bool old_event_t::key_enter() const         { return key == GLFW_KEY_ENTER;         } 
bool old_event_t::key_tab() const           { return key == GLFW_KEY_TAB;           } 
bool old_event_t::key_backspace() const     { return key == GLFW_KEY_BACKSPACE;     } 
bool old_event_t::key_insert() const        { return key == GLFW_KEY_INSERT;        } 
bool old_event_t::key_delete() const        { return key == GLFW_KEY_DELETE;        } 
bool old_event_t::key_right() const         { return key == GLFW_KEY_RIGHT;         } 
bool old_event_t::key_left() const          { return key == GLFW_KEY_LEFT;          } 
bool old_event_t::key_down() const          { return key == GLFW_KEY_DOWN;          } 
bool old_event_t::key_up() const            { return key == GLFW_KEY_UP;            } 
bool old_event_t::key_page_up() const       { return key == GLFW_KEY_PAGE_UP;       } 
bool old_event_t::key_page_down() const     { return key == GLFW_KEY_PAGE_DOWN;     } 
bool old_event_t::key_home() const          { return key == GLFW_KEY_HOME;          } 
bool old_event_t::key_end() const           { return key == GLFW_KEY_END;           } 
bool old_event_t::key_caps_lock() const     { return key == GLFW_KEY_CAPS_LOCK;     } 
bool old_event_t::key_scroll_lock() const   { return key == GLFW_KEY_SCROLL_LOCK;   } 
bool old_event_t::key_num_lock() const      { return key == GLFW_KEY_NUM_LOCK;      } 
bool old_event_t::key_print_screen() const  { return key == GLFW_KEY_PRINT_SCREEN;  } 
bool old_event_t::key_pause() const         { return key == GLFW_KEY_PAUSE;         } 
bool old_event_t::key_f1() const            { return key == GLFW_KEY_F1;            } 
bool old_event_t::key_f2() const            { return key == GLFW_KEY_F2;            } 
bool old_event_t::key_f3() const            { return key == GLFW_KEY_F3;            } 
bool old_event_t::key_f4() const            { return key == GLFW_KEY_F4;            } 
bool old_event_t::key_f5() const            { return key == GLFW_KEY_F5;            } 
bool old_event_t::key_f6() const            { return key == GLFW_KEY_F6;            } 
bool old_event_t::key_f7() const            { return key == GLFW_KEY_F7;            } 
bool old_event_t::key_f8() const            { return key == GLFW_KEY_F8;            } 
bool old_event_t::key_f9() const            { return key == GLFW_KEY_F9;            } 
bool old_event_t::key_f10() const           { return key == GLFW_KEY_F10;           } 
bool old_event_t::key_f11() const           { return key == GLFW_KEY_F11;           } 
bool old_event_t::key_f12() const           { return key == GLFW_KEY_F12;           } 
bool old_event_t::key_f13() const           { return key == GLFW_KEY_F13;           } 
bool old_event_t::key_f14() const           { return key == GLFW_KEY_F14;           } 
bool old_event_t::key_f15() const           { return key == GLFW_KEY_F15;           } 
bool old_event_t::key_f16() const           { return key == GLFW_KEY_F16;           } 
bool old_event_t::key_f17() const           { return key == GLFW_KEY_F17;           } 
bool old_event_t::key_f18() const           { return key == GLFW_KEY_F18;           } 
bool old_event_t::key_f19() const           { return key == GLFW_KEY_F19;           } 
bool old_event_t::key_f20() const           { return key == GLFW_KEY_F20;           } 
bool old_event_t::key_f21() const           { return key == GLFW_KEY_F21;           } 
bool old_event_t::key_f22() const           { return key == GLFW_KEY_F22;           } 
bool old_event_t::key_f23() const           { return key == GLFW_KEY_F23;           } 
bool old_event_t::key_f24() const           { return key == GLFW_KEY_F24;           } 
bool old_event_t::key_f25() const           { return key == GLFW_KEY_F25;           } 
bool old_event_t::key_kp_0() const          { return key == GLFW_KEY_KP_0;          } 
bool old_event_t::key_kp_1() const          { return key == GLFW_KEY_KP_1;          } 
bool old_event_t::key_kp_2() const          { return key == GLFW_KEY_KP_2;          } 
bool old_event_t::key_kp_3() const          { return key == GLFW_KEY_KP_3;          } 
bool old_event_t::key_kp_4() const          { return key == GLFW_KEY_KP_4;          } 
bool old_event_t::key_kp_5() const          { return key == GLFW_KEY_KP_5;          } 
bool old_event_t::key_kp_6() const          { return key == GLFW_KEY_KP_6;          } 
bool old_event_t::key_kp_7() const          { return key == GLFW_KEY_KP_7;          } 
bool old_event_t::key_kp_8() const          { return key == GLFW_KEY_KP_8;          } 
bool old_event_t::key_kp_9() const          { return key == GLFW_KEY_KP_9;          } 
bool old_event_t::key_kp_decimal() const    { return key == GLFW_KEY_KP_DECIMAL;    } 
bool old_event_t::key_kp_divide() const     { return key == GLFW_KEY_KP_DIVIDE;     } 
bool old_event_t::key_kp_multiply() const   { return key == GLFW_KEY_KP_MULTIPLY;   } 
bool old_event_t::key_kp_subtract() const   { return key == GLFW_KEY_KP_SUBTRACT;   } 
bool old_event_t::key_kp_add() const        { return key == GLFW_KEY_KP_ADD;        } 
bool old_event_t::key_kp_enter() const      { return key == GLFW_KEY_KP_ENTER;      } 
bool old_event_t::key_kp_equal() const      { return key == GLFW_KEY_KP_EQUAL;      } 
bool old_event_t::key_left_shift() const    { return key == GLFW_KEY_LEFT_SHIFT;    } 
bool old_event_t::key_left_control() const  { return key == GLFW_KEY_LEFT_CONTROL;  } 
bool old_event_t::key_left_alt() const      { return key == GLFW_KEY_LEFT_ALT;      } 
bool old_event_t::key_left_super() const    { return key == GLFW_KEY_LEFT_SUPER;    } 
bool old_event_t::key_right_shift() const   { return key == GLFW_KEY_RIGHT_SHIFT;   } 
bool old_event_t::key_right_control() const { return key == GLFW_KEY_RIGHT_CONTROL; } 
bool old_event_t::key_right_alt() const     { return key == GLFW_KEY_RIGHT_ALT;     } 
bool old_event_t::key_right_super() const   { return key == GLFW_KEY_RIGHT_SUPER;   } 
bool old_event_t::key_menu() const          { return key == GLFW_KEY_MENU;          } 
bool old_event_t::key_last() const          { return key == GLFW_KEY_LAST;          } 

bool old_event_t::key_unknown() const       { return key == GLFW_KEY_UNKNOWN;       } // unknown
