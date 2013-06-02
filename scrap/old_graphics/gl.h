#import "sym.h"

struct texture_unit_t {
  uint value;
};

struct gl_t {
  using _ = gl_t&;

  using supplier_t = fun_t<void(gl_t&, sym_t)>;

  gl_t(win_t&);
  ~gl_t();

  _ spawn();

  _ prepare(sym_t p);
  _ ready();
  _ done();

  _ pack(init_t<sym_t> attributes, sym_t vbo);
  _ value(sym_t s, texture_unit_t u);
  _ value(sym_t s, int a);
  _ value(sym_t s, double a);
  _ value(sym_t s, const vec2& v);
  _ value(sym_t s, double a, double b);
  _ value(sym_t s, const vec3& v);
  _ value(sym_t s, double a, double b, double c);
  _ value(sym_t s, const vec4& v);
  _ value(sym_t s, double a, double b, double c, double d);
  _ value(sym_t s, const mat4& m);

  _ supplier(sym_t s, supplier_t);

  _ triangles ();
  _ points    ();
  _ lines     ();
  _ line_strip();

  _ draw_arrays();
  _ draw_arrays(int offset, int count);

  _ new_vbo(sym_t s); bool has_vbo(sym_t s); uint get_vbo(sym_t s);
  _ new_prg(sym_t s); bool has_prg(sym_t s); uint get_prg(sym_t s);
  _ new_vao(sym_t s); bool has_vao(sym_t s); uint get_vao(sym_t s);
  _ new_tex(sym_t s); bool has_tex(sym_t s); uint get_tex(sym_t s);

  _ reload_prgs();

  _ upload_ccw_quad(sym_t s);
  _ bind_vao(sym_t s);

  _ clear_color(float r, float g, float b, float a);
  _ clear_color(const vec4& v);
  _ clear_depth(float d);
  _ clear_stencil(float s);
  _ clear(bool color, bool depth, bool stencil);
  _ clear();

  _ point_size(float);

  _ aperture(int x, int y, int w, int h);

  _ buffer_data_static(sym_t vbo, size_t bytes, const void* data);
  _ buffer_data_dynamic(sym_t vbo, size_t bytes, const void* data);

  _ buffer_sub_data(sym_t vbo, int offset, int size, void* data);

  template <typename T, int count>
  _ buffer_data_static(sym_t vbo, const T(&data)[count]) { return buffer_data_static(vbo, count * sizeof(T), data); }

  template <typename T>
  _ buffer_data_static(sym_t vbo, const T& container) {
    size_t   bytes{container.size() * sizeof(typename T::value_type)};
    const T* data {container.data()};
    return buffer_data_static(vbo, bytes, data);
  }

  _ check();
  _ expect_invalid_operation();

  static const string& enum_name(uint e);

  bool first();

private:
  struct data_t;
  gl_t(const gl_t&)            = delete;
  gl_t& operator=(const gl_t&) = delete;
  data_t& __;
};
