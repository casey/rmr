#import "cams.h"
#import "vec.h"
#import "sym.h"
#import "gl.h"

struct clear_c::data_t {
  vec4 color;
};

clear_c::clear_c(const vec4& color) : __(*new data_t{color}) {}
void clear_c::render(const args_t& args) { gl().clear_color(__.color).clear(); }


struct program_c::data_t {
  sym_t program;
};

program_c::program_c(const sym_t& program) : __(*new data_t{program})  {
  gl().new_vbo("quad").upload_ccw_quad("quad");
}

void program_c::render(const args_t& a) {
  gl()
  .prepare(__.program)
  .pack({"position"}, "quad")
  .ready()
  .triangles()
  .draw_arrays()
  .done()
  ;
}
