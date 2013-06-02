#import "rmr.h"


#import "rec.h"
#import "win.h"
#import "gl.h"

#import "wall.h"

constexpr int width  = 16 * 5;
constexpr int height = 9 * 5;
constexpr int count  = width * height;

char marker[] = {'\0'};

int main(int argc, char** argv) {
  "main()"_info;

  sizeof(wall_t) == 40401 or rmr.die("bad packet size");

  v4 buffer[count];

  rec_t r(1024, [](rec_t::update_t& u){});
  win_t w(1180, 1180, "無心");
  w.position(5, 0);

  auto& gl = w.gl();

  GLuint vao;
  glGenVertexArrays(1, &vao);
  glBindVertexArray(vao);

  auto p  = glCreateProgram();
  auto vs = glCreateShader(GL_VERTEX_SHADER);
  auto fs = glCreateShader(GL_FRAGMENT_SHADER);

  auto vsrc = rmr.slurp("rsc/v.glsl");
  auto fsrc = rmr.slurp("rsc/f.glsl");
  auto vptr = vsrc.c_str();
  auto fptr = fsrc.c_str();

  rmr.info("GL_VERSION: "s + glGetString(GL_VERSION));
  rmr.info("GL_SHADING_LANGUAGE_VERSION: "s + glGetString(GL_SHADING_LANGUAGE_VERSION));

  int ok;

  //compute, vertex, tess_control, tess_evaluation, geometry, fragment

  glShaderSource(vs, 1, &vptr, nullptr); glCompileShader(vs); gl.chk();
  glGetShaderiv(vs, GL_COMPILE_STATUS, &ok);
  if (!ok) {
    int l = 0;
    glGetShaderiv(vs, GL_INFO_LOG_LENGTH, &l);
    char* log = new char[l];
    glGetShaderInfoLog(vs, l, &l, log);
    cout << "bad vs compile" << log << endl;
    rmr.die();
  }

  glShaderSource(fs, 1, &fptr, nullptr); glCompileShader(fs); gl.chk();
  glGetShaderiv(fs, GL_COMPILE_STATUS, &ok);
  if (!ok) {
    int l = 0;
    glGetShaderiv(fs, GL_INFO_LOG_LENGTH, &l);
    char* log = new char[l];
    glGetShaderInfoLog(fs, l, &l, log);
    cout << "bad fs compile" << log << endl;
    rmr.die();
  }

  glAttachShader(p, vs);
  glAttachShader(p, fs);
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

  glUseProgram(p);

  float ccwquad[] = {1, -1, 0, 1, 1, 1, 0, 1, -1, 1, 0, 1, -1, 1, 0, 1, -1, -1, 0, 1, 1, -1, 0, 1};

  uint tex = 0;
  glGenTextures(1, &tex);
  glActiveTexture(GL_TEXTURE0);
  glBindTexture(GL_TEXTURE_2D, tex);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);

  int tl = glGetUniformLocation(p, "tex");
  glUniform1i(tl, 0); // use active texture 0

  GLuint pos;
  glGenBuffers(1, &pos);
  glBindBuffer(GL_ARRAY_BUFFER, pos);
  glBufferData(GL_ARRAY_BUFFER, sizeof(ccwquad) * sizeof(float), ccwquad, GL_STATIC_DRAW);
  glVertexAttribPointer(0, 4, GL_FLOAT, GL_FALSE, 0, 0);
  glEnableVertexAttribArray(0);

  while (!w.closing()) {
    while (w.pending()) {
      auto e = w.pop();

      if (e.key_r() && e.super) {
        auto code = system("j build");
        if (code == 0) {
          w.terminate();
          execv(*argv, argv);
        }
      } else if (e.key_s() && e.super) {
        w.screenshot();
      }
    }

    auto total = 0.0;
    for (int i = 0; i < 1024; i++) {
      //total += std::max(r.left[i], -r.left[i]);
    }
    float ave = total / 1024 * 1;

    for (int i = 0; i < count; i++) {
      //auto s = (r.left[i % r.frames] + r.right[i % r.frames]) / 2;
      auto s = 0.0;
      buffer[i] = {s, 0, 0, 1.0};
    }

    for (int row = 0; row < height; row++) {
      for (int col = 0; col < width; col++) {
        float xc = col * 1.0 / width;
        float yc = row * 1.0 / height;
        int i = row * width + col;

        float v = (w.frame() % 5) / 4.0 * 1.0;
        buffer[i] = {v, v, v, 1.0};
      }
    }

    wall_t wall;
    wall.header(0x01);

    for (int row = 0; row < 9; row++) {
      for (int col = 0; col < 16; col++) {
        wall.tile(col, row).dac_r(3).dac_g(0).dac_b(0).pwm_div(15).white();
      }
    }

    /*
    for (int tile = 0; tile < 400; tile++) {
      auto& wt = wall.tiles[tile];
      if      (tile <  (w.frame() % 400))  wt.red();
      else if (tile == (w.frame() % 400)) wt.white();
      else                wt.blue();
    }
    */

    /*
    for (int row = 0; row < 9; row++) {
      for (int col = 0; col < 16; col++) {
        bool on = (row * 16 + col) < (w.frame() % 149);
        if (on) wall.tile(col, row).white();
        else    wall.tile(col, row).black();
      }
    }
    */

    /*
    for (int row = 0; row < height; row++) {
      for (int col = 0; col < width; col++) {
        int i = row * width + col;
        int tx = col / 5;
        int ty = row / 5;
        int  r = buffer[row * width + col].r * 4;
        int  g = buffer[row * width + col].g * 4;
        int  b = buffer[row * width + col].b * 4;
        wall.tile(tx, ty).pixel(col % 5, row % 5, r, g, b);
      }
    }
    */

    int first_on = w.frame() % 25;

    for (int row = 0; row < 9; row++) {
      for (int col = 0; col < 16; col++) {
        for (int i = 0; i < 25; i++) {
          bool on = i <= first_on;
          int v = on ? wall.cmax : 0;
          wall.tile(col, row).pixel(i % 5, i / 5, v, v, v);
        }
      }
    }

    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, width, height, 0, GL_RGBA, GL_FLOAT, buffer);

    rmr.sleep(1.0 / 24);
    rmr.dgram("192.168.1.255", 1119, string(marker, 1));
    rmr.sleep(1.0 / 24);
    rmr.dgram("192.168.1.10",  1119, string((char*)&wall, sizeof(wall)));
    rmr.sleep(1.0 / 24);
    rmr.dgram("192.168.1.255", 1119, string(marker, 1));
    rmr.sleep(1.0 / 24);
    rmr.dgram("192.168.1.10",  1119, string((char*)&wall, sizeof(wall)));
    rmr.sleep(1.0 / 24);
    rmr.dgram("192.168.1.255", 1119, string(marker, 1));
    rmr.sleep(1.0 / 24);
    rmr.dgram("192.168.1.10",  1119, string((char*)&wall, sizeof(wall)));

    //rmr.dgram("192.168.1.255", 1119, string(marker, 1));
    //rmr.dgram("192.168.1.10",  1119, string((char*)&wall, sizeof(wall)));

    //rmr.dgram("192.168.1.255", 1119, string(marker, 1));
    //rmr.dgram("192.168.1.10",  1119, string((char*)&wall, sizeof(wall)));

    rmr << first_on;

    char c;
    cin.get(c);

    glClearColor(0.0, 1.0, 1.0, 1.0);
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT | GL_STENCIL_BUFFER_BIT);
    glDrawArrays(GL_TRIANGLES, 0, 6);

    if (w.first()) w.screenshot();
    if (w.frame() < 10) w.gl().chk();
    w.swap();
    rmr.info("frame %: %ms"_fmt % (w.frame() - 1) % w.ms());
  }

  return 0;
}
