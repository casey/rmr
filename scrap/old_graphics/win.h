#import "old_event.h"
#import "vec.h"

extern "C" {
  struct _CGLContextObject;
  typedef struct _CGLContextObject* CGLContextObj;
}

struct win_t {
  win_t(int w, int h, const string& name, bool resizable, bool hide);
  ~win_t();

  using _               = win_t&;
  using event_handler_t = fun_t<void(const old_event_t&)>;

  _ run();
  _ tick();

  _ open();
  _ closing(bool);
  _ left(int);
  _ top(int);
  _ name(string);
  _ size(int width, int height);
  _ screenshot();
  _ screenshot(img_t&);
  _ handler(event_handler_t);
  _ on(const string& shortcut, fun_t<void()> handler);
  _ on_tick(fun_t<void()> handler);

  bool           first()        const;
  bool           closing()      const;
  bool           current()      const;
  const string&  name()         const;
  int            width()        const;
  int            height()       const;
  double         cursor_x()     const;
  double         cursor_y()     const;
  double         aspect_ratio() const;
  vec2           cursor()       const;
  u64            frame();
  gl_t&          gl();
  cam_t&         cam();
  int            ms();
  old_event_t&       push();
  CGLContextObj& context();
  syphon_t&      syphon();

  explicit operator bool() const;

private:
  win_t()                        = delete;
  win_t(const win_t&)            = delete;
  win_t& operator=(const win_t&) = delete;
  struct data_t;
  data_t& __;
};
