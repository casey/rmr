#import "win.h"

#import <GLFW/glfw3.h>

event_t& push_event(GLFWwindow *w) {
  auto& queue = ((win_t*)glfwGetWindowUserPointer(w))->event_queue;
  queue.push(event_t());
  return queue.front();
}

win_t::win_t(int w, int h, const char* name) : _frame(0) {
  if (!initialized) {
    if (!glfwInit()) rmr.die("wint_t(): glfwInit failed");
    initialized = true;

    glfwSetErrorCallback([](int error, const char* description) {
      rmr.die("win_t: glfw error %: %"_fmt % error % description);
    });

    glfwSetMonitorCallback([](GLFWmonitor* monitor, int event){
      rmr.info("win_t: monitor %"_fmt % (event == GLFW_CONNECTED ? "connected" : "disconnected"));
    });

    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 4);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 1);
    glfwWindowHint(GLFW_OPENGL_PROFILE       , GLFW_OPENGL_CORE_PROFILE);
    glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, true);
  }

  window = glfwCreateWindow(w, h, name, nullptr, nullptr);
  glfwSetWindowUserPointer(window, this);
  window || rmr.die("win_t(): failed to create window \"%\""_fmt % name);
  glfwMakeContextCurrent(window);

  glfwSetKeyCallback(window, [](GLFWwindow* w, int key, int code, int action, int mods) {
    auto& e = push_event(w);
   
    e.type.keydown   = action == GLFW_PRESS;
    e.type.keyup     = action == GLFW_RELEASE;
    e.type.keyrepeat = action == GLFW_REPEAT;
  
    e.key = key;

    e.shift    = mods & GLFW_MOD_SHIFT;
    e.control  = mods & GLFW_MOD_CONTROL;
    e.alt      = mods & GLFW_MOD_ALT;
    e.super    = mods & GLFW_MOD_SUPER;
  });

  glfwSetCharCallback(window, [](GLFWwindow* w, unsigned int codepoint) {
    auto& e = push_event(w);
    e.type.character = true;
    e.codepoint = codepoint;
  });

  glfwSetWindowPosCallback(window, [](GLFWwindow* w, int x, int y) {
    auto& e = push_event(w);
    e.type.move = true;
    e.windowx = x;
    e.windowy = y;
  });

  glfwSetWindowFocusCallback(window, [](GLFWwindow* w, int focused) {
    auto& e = push_event(w);
    e.type.focus = focused;
    e.type.blur  = !focused;
  });

  glfwSetCursorPosCallback(window, [](GLFWwindow* w, double x, double y) {
    auto& e = push_event(w);
    e.type.mousemove = true;
    e.windowx = x;
    e.windowy = y;
  });

  glfwSetMouseButtonCallback(window, [](GLFWwindow* w, int b, int a, int mods) {
    auto& e = push_event(w);
    e.type.mousedown = a == GLFW_PRESS;
    e.type.mouseup   = a == GLFW_RELEASE;
    e.button         = b;
    e.shift          = mods & GLFW_MOD_SHIFT;
    e.control        = mods & GLFW_MOD_CONTROL;
    e.alt            = mods & GLFW_MOD_ALT;
    e.super          = mods & GLFW_MOD_SUPER;
  });

  glfwSetCursorEnterCallback(window, [](GLFWwindow* w, int entered) {
    auto& e = push_event(w);
    e.type.mouseenter =  entered;
    e.type.mouseleave = !entered;
  });

  glfwSetScrollCallback         (window, [](GLFWwindow* w, double x, double y   ) { rmr.info("scroll");         });
  glfwSetWindowSizeCallback     (window, [](GLFWwindow* w, int width, int height) { rmr.info("window size");    });
  glfwSetWindowCloseCallback    (window, [](GLFWwindow* w                       ) { rmr.info("window close");   });
  glfwSetWindowRefreshCallback  (window, [](GLFWwindow* w                       ) { rmr.info("window refresh"); });
  glfwSetWindowIconifyCallback  (window, [](GLFWwindow* w, int iconified        ) { rmr.info("iconify");        });
  glfwSetFramebufferSizeCallback(window, [](GLFWwindow* w, int width, int height) { rmr.info("buffer size");    });

  _gl = unique_ptr<gl_t>(new gl_t(*this));

  count++;
}

int win_t::width () { int w, h; glfwGetFramebufferSize(window, &w, &h); return w; };
int win_t::height() { int w, h; glfwGetFramebufferSize(window, &w, &h); return h; };
u64 win_t::frame () { return _frame; }

win_t& win_t::swap() {
  if (first()) screenshot();
  gl().assert_inactive();
  glfwSwapBuffers(window); 
  _ms = frame_timer.ms();
  rmr.info("frame %: %ms"_fmt % _frame % _ms);
  frame_timer.reset();
  if (frame() < 10) gl().chk();
  _frame++;
  return *this; 
};

bool win_t::pending() {
  glfwPollEvents();
  return !event_queue.empty();
}

win_t& win_t::position(int x, int y) {
  glfwSetWindowPos(window, 5, 0);
  return *this;
}

win_t::~win_t() {
  if (count == 1) terminate();
  count--;
}

void win_t::terminate() {
  glfwTerminate();
  initialized = false;
}

bool win_t::closing() {
  return glfwWindowShouldClose(window);
}

win_t& win_t::closing(bool c) {
  glfwSetWindowShouldClose(window, c);
  return *this;
}

bool win_t::current() {
  return glfwGetCurrentContext() == window;
};

win_t& win_t::screenshot() {
  current() || rmr.die("win_t.screenshot: window not current");
  stringstream filename;
  filename << "./dat/screens/" << rmr.ms() << "." << rmr.git_head() << ".png";

  int w = width();
  int h = height();

  vector<u8> pixels(w * h * 4, 0);
  glReadPixels(0, 0, w, h, GL_RGBA, GL_UNSIGNED_BYTE, pixels.data());

  rmr.write_png(filename.str().c_str(), pixels.data(), w, h);

  /*
  // todo: fix this code
  image_t i;
  i.alloc(width(), height());

  //int w = width();
  //int h = height();

  //vector<u8> pixels(w * h * 4, 0);

  glReadPixels(0, 0, width(), height(), GL_RGBA, GL_FLOAT, i.data.data()); // lol stuttering

  rmr.write_png(filename.str().c_str(), i);
  */

  return *this;
}

bool win_t::initialized = false;
int  win_t::count       = 0;
