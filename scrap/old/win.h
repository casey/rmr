#import "rmr.h"
#import "event.h"
#import "gl.h"

struct win_t {
  GLFWwindow* window;

  win_t(int w, int h, const char* name);

  win_t& position(int x, int y);
  ~win_t();

  bool closing();
  win_t& closing(bool c);

  int width();
  int height();
  win_t& swap();

  u64 frame();

  bool first() { return frame() == 0; }

  win_t& screenshot();

  bool current();

  u64 ms() {
    return _ms;
  }

  bool pending();

  const event_t pop() {
    event_queue.empty() && rmr.die("win_t.pop: event queue is empty");
    event_t e = event_queue.front();
    event_queue.pop();
    return e;
  }

  static void terminate();

  friend event_t& push_event(GLFWwindow *w);

  gl_t& gl() { return *_gl; }

private:  
  queue<event_t> event_queue;
  u64  _frame;
  unique_ptr<gl_t> _gl;
  u64  _ms;
  timer_t frame_timer;
  static bool initialized;
  static int  count;

// todo: move to noncopyable
  win_t(const win_t&);
  win_t& operator=(const win_t&);
};
