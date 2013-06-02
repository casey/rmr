#import "gl.h"

#import "win.h"

sym_t gl_t::_("");

bool gl_t::first() {
  return window.first();
}

gl_t& gl_t::swap() {
  if (is_preparing()) rmr.die("gl_t.swap: out of phase: preparing but should be inactive or drawing");
  if (is_drawing()  ) start_inactive();

  window.swap();
  return *this;
}

gl_t& gl_t::upload_ccw_quad(sym_t s) {
  static float ccw_quad[] = {1, -1, 0, 1, 1, 1, 0, 1, -1, 1, 0, 1, -1, 1, 0, 1, -1, -1, 0, 1, 1, -1, 0, 1};
  bind_array_buffer(s);
  glBufferData(GL_ARRAY_BUFFER, sizeof(ccw_quad), ccw_quad, GL_STATIC_DRAW);
  return *this;
}

gl_t& gl_t::new_program(sym_t s) {
  has_prg(s) && rmr.die("gl_t.new_program: duplicate: %"_fmt % s);

  auto& src = rmr.rsc(string(s) + ".glsl");

  vector<string> vs_lines;
  vector<string> fs_lines;

  enum class section_t { shared, vertex, fragment };
  auto section = section_t::shared;

  auto newline_re   = "\n|\r\n|\n\r|\r"_re;
  auto directive_re = "^//!(\\S+)\\s*$"_re;

  sregex_token_iterator iter(src.begin(), src.end(), newline_re, -1);
  sregex_token_iterator end;
  for ( ; iter != end; ++iter) {
    string line(*iter);
    std::smatch match;
    if (regex_match(line, match, directive_re)) {
      string directive = match[1];
      if (directive == "vertex") { 
        section = section_t::vertex;
      } else if (directive == "fragment") {
        section = section_t::fragment;
      } else {
        rmr << "unrecognized shader directive"s + directive;
        rmr.die();
      }
    }

    switch (section) {
      case section_t::  shared: vs_lines.push_back(line); fs_lines.push_back(line); break;
      case section_t::  vertex: vs_lines.push_back(line); fs_lines.push_back(""  ); break;
      case section_t::fragment: vs_lines.push_back(""  ); fs_lines.push_back(line); break;
    }
  }

  int ok;

  auto shader = [&](string& src, uint type){
    auto p = src.c_str();
    auto s = glCreateShader(type);

    glShaderSource(s, 1, &p, nullptr);
    glCompileShader(s);
    chk();
    glGetShaderiv(s, GL_COMPILE_STATUS, &ok);
    if (!ok) {
      int l = 0;
      glGetShaderiv(s, GL_INFO_LOG_LENGTH, &l);
      char* log = new char[l];
      glGetShaderInfoLog(s, l, &l, log);
      cout << "bad shader compile" << log << endl;
      rmr.die();
    }

    return s;
  };

  auto vs = rmr.join(vs_lines, "\n");
  auto fs = rmr.join(fs_lines, "\n");
  auto v  = shader(vs, GL_VERTEX_SHADER);
  auto f  = shader(fs, GL_FRAGMENT_SHADER);

  auto p = glCreateProgram();
  glAttachShader(p, v);
  glAttachShader(p, f);
  glLinkProgram(p);

  glGetProgramiv(p, GL_LINK_STATUS, &ok);
  if (!ok) {
    int l = 0;
    glGetProgramiv(p, GL_INFO_LOG_LENGTH, &l);
    char* log = new char[l];
    glGetProgramInfoLog(p, l, &l, log);
    cout << "bad link" << log << endl;
    rmr.die();
  }

  // todo: figure out why this doesn't pass
  //glGetProgramiv(p, GL_VALIDATE_STATUS, &ok);

  prg_table[s] = p;

  auto& vars = var_table[s] = {};

  // todo: clean this up
  int attributes;
  glGetProgramiv(p, GL_ACTIVE_ATTRIBUTES, &attributes);
  for (int i = 0; i < attributes; i++) {
    GLsizei size;
    GLenum type;
    char name[513];
    glGetActiveAttrib(p, i, 512, nullptr, &size, &type, name);
    int location = glGetAttribLocation(p, name);
    vars.insert({name, {false, true, i, location, size, type}});
  }

  // todo: clean this up
  int uniforms;
  glGetProgramiv(p, GL_ACTIVE_UNIFORMS, &uniforms);
  for (int i = 0; i < uniforms; i++) {
    GLsizei size;
    GLenum type;
    char name[513];
    glGetActiveUniform(p, i, 512, nullptr, &size, &type, name);
    int location = glGetUniformLocation(p, name);
    vars.insert({name, {false, false, i, location, size, type}});
  }

  return *this;
}
