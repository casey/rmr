#import "win.h"
#import "node.h"

#import "rmr.h"



/*
  make a lot of really tiny things
  - bunch of cubes
  - perfect sphere
  - waveform
  - etc

  how do they coexist?
  - tree of cameras
  - everything in the same tree
    - how do different cameras work?

  procedural:
    - city
    - city at night (just lights and occlusion)
    - black and white
    - outlines only
    - planet
    - space ship
    - thing

    // place on surface
    // extrude from surface
    // deform surface

  platformer

   what are we testing?
   - colors
   - transformations
   - ticking, updates, rendering
   - basic procedural geometry creation
   - cameras
   - passes
*/

void render(gl_t& gl, node_t& n, trans_t parent_transform) {
  trans_t matrix = parent_transform * n.transform();

  if (gl.first()) {
    rmr << "render";
    rmr << matrix;
    rmr << n.is_triangles();
  }

  gl
  .buffer_data_static("position", n.vertex_count() * sizeof(v4), n.vertices().data())
  .prepare("discrete")
  .value("transform", matrix)
  .value("color",     n.color())
  .pack("position", "position")
  .ready();

  if (n.is_points   ()) gl.points();
  if (n.is_lines    ()) gl.lines();
  if (n.is_triangles()) gl.triangles();

  gl
  .draw_arrays()
  .done();

  for (auto p : n.children()) {
    render(gl, *p, matrix);
  }
};

int main(int argc, char** argv) {
  "test: main()"_log;

  win_t w(1180, 1180, "無心");
  w.position(5, 0);
  auto& gl = w.gl();

  node_t n;

  n
  .lines()
  .color (1.0, 0.0, 1.0)
  .vertex(0.0, 0.0, 0.0)
  .vertex(0.5, 0.0, 0.0)
  .vertex(0.5, 0.5, 0.0)
  .vertex(0.0, 0.5, 0.0)
  .spawn()
    .translate(0.5, 0.5, 0)
    .vertex(0, 0, 0)
    .vertex(0, 1.0, 0)
    .clone()
      .translate_x(0.1)
      .clone()
        .translate_x(-0.2);

  gl
  .new_vbo("position")
  ;

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
      } else if (e.key_f() && e.super) {
        // todo: toggle fullscreen
      }
    }

    gl
    .clear_color(0, 0, 0, 1.0)
    .clear();

    auto t = trans_t::Identity();
    render(gl, n, t);

    gl.swap();

    //gl
    //.clear_color(0, 0, 0, 1.0)
    //.clear()
    //.prepare("color")
    //.pack("quad", {"position"})
    //.ready()
    //.triangles()
    //.draw_arrays(0, 6)
    //.done()
    //.buffer_data_static("data", lines)
    //.prepare("basic")
    //.pack("position", "data")
    //.value("color", hsb_t{0, c, c})
    //.ready()
    //.line_strip()
    //.draw_arrays()
    //.swap()
    //;
  }

  return 0;
}
