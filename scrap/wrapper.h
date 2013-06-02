struct ostream_t {
  virtual ~ostream_t() = 0;
  virtual ostream_t& operator<<(str_t) = 0;
};

template<typename T>
struct ostream_wrapper_t : ostream_t {
  ostream_wrapper_t(T t) : t(t) { }
  ~ostream_wrapper_t() {}
  virtual ostream_t& operator<<(str_t s) { t << s; return *this; }
  T t;
};
