#import "rmr.h"
#import "wall.h"
#import "win.h"
#import "sym.h"
#import "cam.h"
#import "cams.h"
#import "node.h"
#import "img.h"

auto _ = rmr.cfg("base", "/Users/rodarmor/pkg/rmr/");

// fix gaps in waveform
// render to 80 x 45 pixel texture
// get pixels and send out datagram
// blit to upscaled buffer
// match timing and fps exactly
// last resort:
//   match the network configuration

int main(int argc, char** argv) {
  //int f = 14;
  int f = 1;
  win_t w(80 * f, 45 * f, "box");

  w.cam().spawn<clear_c>("black"_c).spawn<waveform_c>();

  char marker = '\0';
  constexpr int width  = 16 * 5;
  constexpr int height = 9 * 5;
  constexpr int count  = width * height;
  wall_t wall;

  const char* waddr = "192.168.1.10";
  const char* baddr = "192.168.1.255";

  waddr = baddr = "8.8.8.8";

  for (int row = 0; row < 9; row++) {
    for (int col = 0; col < 16; col++) {
      wall.tile(col, row).dac_r(3).dac_g(0).dac_b(0).pwm_div(15).white();
    }
  }

  img_t img;

  while (w) {
    w.pump().tick().swap();
    
    w.screenshot(img);
    // load screenshot into wall
    rmr.dgram(waddr, 1119, wall);
    rmr.dgram(baddr, 1119, marker);
    rmr.sleep(1.0 / 24);
  }

  return 0;
}
