struct gl_guard_t {
  gl_guard_t(window_t&);
  gl_guard_t(gl_guard_t&&);
  gl_guard_t(gl_guard_t&)                  = delete;
  gl_guard_t& operator=(const gl_guard_t&) = delete;
  ~gl_guard_t();
private:
  window_t& window;
  bool      last;
};

// window_t
gl_guard_t guard();
bool current() const;
_ current(bool);


gl_guard_t window_t::guard() {
  return gl_guard_t(*this);
}

gl_guard_t::gl_guard_t(window_t& window) : window(window), last(true) {
  window.current(true);
}

gl_guard_t::gl_guard_t(gl_guard_t&& source) : window(source.window), last(source.last) {
  source.last = false;
}

gl_guard_t::~gl_guard_t() {
  if (last) window.current(false);
}
