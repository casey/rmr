#import "rmr.h"
#import "win.h"
#import "rec.h"
#import "gl.h"


// todo:
//   fix the gaps on the left and right
//   - draw window * 2 samples
//   - samples to the left come from the past
//   - samples to the right
//   try out the full nxn fitting algorithm
//   draw many times per frame, and interpolate between samples
//   draw a dot on the end
//  switch to a ring buffer
//  instead of exposing missing future samples, settle for something close but not absolute maximum
//  intensity effect: glow, draw multiples offset
//  better calculation of intensity, currently dev is on an absolute scale
//  reconstruct wave from FFT, with the maximum peaks

int main(int argc, char** argv) {
  "scratch: main()"_log;

  win_t w(1920, 1080, "無心");
  w.position(5, 0);
  auto& gl = w.gl();

  constexpr int n = 1 << 10;

  ring_t ring(n, 0);

  float intensity = 0;
  int peak = 0;

  auto series = series_t<double>(1.0);

  int version = 0;

  rec_t r(n, [&](rec_t::update_t& u){
    u.ok || rmr.log("something went wrong");

    float sum = 0;
    float p = -2;
    peak = -1;
    for (int i = 0; i < n; i++) {
      float l = u.left[i];
      float r = u.right[i];

      ring.write(l);

      sum += l * l + r * r;
      if (l > p) { peak = i; p = l; }
    }
    intensity = sqrt(sum / (n * 2));
    version++;
  });

  gl
  .new_vbo("data")
  .new_vbo("quad")
  .upload_ccw_quad("quad")
  ;

  // todo: assert these things in case they change
  //SHOW(gl.get_i2(GL_ALIASED_LINE_WIDTH_RANGE));
  //SHOW(gl.get_i2(GL_SMOOTH_LINE_WIDTH_RANGE));
  //SHOW(gl.get(GL_SMOOTH_LINE_WIDTH_GRANULARITY));

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

    array<v4, n> lines;

retry:
    int start_version = version;

    double off = 1 - (double(peak) / n) * 2;

    for (int i = 0; i < n; i++) {
      lines[i] = {off + (i / float(n) - 0.5) * 2, ring.get(i), 0, 1};
      //if (i == peak) lines[i][1] = 1.0;
    }

    series << intensity;
    double dev = intensity - series.mean();
    double c = dev > 0 ? 0.5 + dev * 5 : 0.5;

    if (version != start_version) goto retry;

    gl
    .clear_color(0, 0, 0, 1.0)
    .clear()
    /*
    .prepare("color")
    .pack("quad", {"position"})
    .ready()
    .triangles()
    .draw_arrays(0, 6)
    .done()
    */
    .buffer_data_static("data", n * sizeof(v4), lines.data())
    .prepare("basic")
    .pack("position", "data")
    .value("color", hsb_t{0, c, c})
    .ready()
    .line_strip()
    .draw_arrays()
    .swap()
    ;
  }

  return 0;
}
