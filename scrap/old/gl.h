struct gl_t {

  // template typename<uint Enum> get():
  int get(GLenum e) { return get_i1(e); }

  std::pair<int, int> get_i2(GLenum e) { int _[2]; glGetIntegerv(e, _); return {_[0], _[1]}; }

  int get_i1(GLenum e) { int _; glGetIntegerv(e, &_); return _; }

  int max_texture_image_units()          { return get_i1(GL_MAX_TEXTURE_IMAGE_UNITS         ); }
  int max_combined_texture_image_units() { return get_i1(GL_MAX_COMBINED_TEXTURE_IMAGE_UNITS); }
  int array_buffer_size() { int _; glGetBufferParameteriv(GL_ARRAY_BUFFER, GL_BUFFER_SIZE, &_); return _; }

  gl_t& new_program(sym_t s);

  gl_t& use_program(sym_t s) {
    has_prg(s) || rmr.die("gl_t.use_program: missing: %"_fmt % s);
    glUseProgram(prg_table[s]);
    return *this;
  }

  gl_t& value(sym_t s, v4 v) {
    return value(s, v[0], v[1], v[2], v[3]);
  }

  gl_t& value(sym_t s, float a, float b, float c, float d) {
    auto& var = get_var(s);
    var.check(1, GL_FLOAT_VEC4);
    if (var.attrib) glVertexAttrib4f(var.location, a, b, c, d);
    else            glUniform4f(var.location, a, b, c, d);
    var.ready = true;
    return *this;
  }

  gl_t& value(sym_t s, trans_t m) {
    auto& var = get_var(s);
    var.check(1, GL_FLOAT_MAT4);
    glUniformMatrix4fv(var.location, 1, false, m.data());
    var.ready = true;
    return *this;
  }

  gl_t& active_texture(unsigned int n) {
    // todo: check if n is within range
    glActiveTexture(GL_TEXTURE0 + n);
    return *this;
  }

  gl_t& new_texture(sym_t s) {
    has_tex(s) && rmr.die("gl_t.new_texture: duplicate: %s"_fmt % s);
    GLuint name;
    glGenTextures(1, &name);
    tex_table[s] = name;
    return *this;
  }

  gl_t& bind_texture_2d(sym_t s) {
    glBindTexture(GL_TEXTURE_2D, tex_table[s]);
    return *this;
  }

  gl_t& texture_2d_wrap_s_clamp_to_edge() {
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    return *this;
  }

  gl_t& texture_2d_wrap_t_clamp_to_edge() {
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
    return *this;
  }

  gl_t& texture_2d_mag_filter_nearest() {
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
    return *this;
  }

  gl_t& texture_2d_min_filter_nearest() {
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
    return *this;
  }

  gl_t& texture_2d_image(
    GLint level,
    GLint internalFormat,
    GLsizei width,
    GLsizei height,
    GLint border,
    GLenum format,
    GLenum type,
    const GLvoid * data
  ) {
    glTexImage2D(GL_TEXTURE_2D, level, internalFormat, width, height, border, format, type, data);
    return *this;
  }

  gl_t& new_vbo(sym_t s) {
    GLuint name;
    glGenBuffers(1, &name);
    vbo_table[s] = name;
    return *this;
  }

  // todo: add a message
  gl_t& chk() {
    auto gle = glGetError();

    if (gle != GL_NO_ERROR) {
      cout << "OpenGL error: " << error_string(gle) << endl;
      rmr.die();
    }

    return *this;
  }

  // todo: convert all kinds of enums into strings
  string error_string(GLenum e) {
    switch (e) {
#define _(x) case x : return #x
      _(GL_INVALID_ENUM);
      _(GL_INVALID_VALUE);
      _(GL_INVALID_OPERATION);
      _(GL_INVALID_FRAMEBUFFER_OPERATION);
      _(GL_OUT_OF_MEMORY);
      //_(GL_STACK_UNDERFLOW);
      //_(GL_STACK_OVERFLOW);
      _(GL_NO_ERROR);
#undef _
      default: rmr.die("gl.error_string: unknown GL enum");
    }
  }

  bool has_vao(sym_t s) { return !!vao_table.count(s); }
  bool has_vbo(sym_t s) { return !!vbo_table.count(s); }
  bool has_tex(sym_t s) { return !!tex_table.count(s); }
  bool has_prg(sym_t s) { return !!prg_table.count(s); }

  gl_t& upload_ccw_quad(sym_t s);

  gl_t& clear_color  (float r, float g, float b, float a) { glClearColor(r, g, b, a); return *this; }
  gl_t& clear_depth  (float d                           ) { glClearDepth(d         ); return *this; }
  gl_t& clear_stencil(float s                           ) { glClearDepth(s         ); return *this; }

  gl_t& clear(bool color, bool depth, bool stencil) {
    int clear_bits = 0;
    if (color  ) clear_bits |=   GL_COLOR_BUFFER_BIT;
    if (depth  ) clear_bits |=   GL_DEPTH_BUFFER_BIT;
    if (stencil) clear_bits |= GL_STENCIL_BUFFER_BIT;

    if (clear_bits) glClear(clear_bits);
    return *this;
  }

  gl_t& clear() { return clear(1, 1, 1); }

  gl_t& triangles () { _mode = GL_TRIANGLES ; return *this; };
  gl_t& points    () { _mode = GL_POINTS    ; return *this; };
  gl_t& lines     () { _mode = GL_LINES     ; return *this; };
  gl_t& line_strip() { _mode = GL_LINE_STRIP; return *this; };

  // todo: allow first and count to be implicit. will require tracking vbo size, and current stride
  gl_t& draw_arrays(int first, size_t count) {
    (_mode >= 0 && _mode <= last_mode()) || rmr.die("gl_t: draw_arrays: mode unset: %"_fmt % _mode);
    glDrawArrays(_mode, first, count);
    return *this;
  }

  gl_t& draw_arrays() {
    if (_drawable_vertices == std::numeric_limits<decltype(_drawable_vertices)>::max()) {
      rmr.die("gl_t.draw_arrays: drawable vertices is at max, probably wrong");
    }
    return draw_arrays(0, _drawable_vertices);
  }

  gl_t& prepare(sym_t program) {
    if (!has_prg(program)) {
      rmr.info("gl.prepare: new program: %"_fmt % program);
      new_program(program);
    }

    start_preparing();
    use_program(program);
    current_program = program;
    _mode              = -1;
    _drawable_vertices = std::numeric_limits<decltype(_drawable_vertices)>::max();
    for (auto& item : var_table[program]) {
      auto& var = item.second;
      // todo: could relax this so that uniforms keep their value across rendering
      var.ready = false;
    }
    return *this;
  }

  gl_t& ready() {
    start_drawing();
    for (auto& item : var_table[current_program]) {
      auto& sym = item.first;
      auto& var = item.second;
      // todo: supply optional values
      if (!var.ready) {
        rmr.die("variable % not ready"_fmt % sym);
      }
    }
    return *this;
  }

  gl_t& done() {
    start_inactive();
    return *this;
  }

  gl_t& pack(sym_t attribute, sym_t vbo) {
    return pack({attribute}, vbo);
  }

  gl_t& pack(std::initializer_list<sym_t> attributes, sym_t vbo) {
    bind_array_buffer(vbo);
    auto stride = attributes.size() * 4 * sizeof(float);
    size_t first = 0;
    u64 count = std::floor(double(vbo_size_table[vbo]) / stride);
    _drawable_vertices = std::min(_drawable_vertices, count);
    // todo: this needs to be smarter if attributes are re-provided
    for (auto a : attributes) {
      auto& var = get_var(a);
      // todo: fix this, this is totally broken
      glVertexAttribPointer(var.location, 4, GL_FLOAT, false, stride, ((char*)0) + first);
      glEnableVertexAttribArray(var.location);
      first += 4 * sizeof(float);
      var.ready = true;
    }
    return *this;
  }

  gl_t& buffer_data_static(sym_t vbo, size_t bytes, const void* data) {
    bind_array_buffer(vbo);
    vbo_size_table[vbo] = bytes;
    glBufferData(GL_ARRAY_BUFFER, bytes, data, GL_STATIC_DRAW);
    return *this;
  }

  gl_t& swap();

  bool first();

private:
  friend win_t;
};
