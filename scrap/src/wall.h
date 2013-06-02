#import "rmr.h"

#import "color.h"

struct wall_t {
  static constexpr const int cmax = 0b11'1111'1111;

  static constexpr const int width  = 16;
  static constexpr const int height = 9;

  struct tile_t {
    static constexpr const int width  = 5;
    static constexpr const int height = 5;

    u8 rg;
    u8 bp;

    u8 lsb[5 * 5 * 3];
    u8 msb[24];

    // todo: use a range-checked templated type [0, 15]
    // todo: write a real iterator
    tile_t& dac_r  (int r) { rg = (rg & 0x0F) | (r << 4); return *this; };
    tile_t& dac_g  (int g) { rg = (rg & 0xF0) | (g << 0); return *this; };
    tile_t& dac_b  (int b) { bp = (bp & 0x0F) | (b << 4); return *this; };
    tile_t& pwm_div(int x) { bp = (bp & 0xF0) | (x << 0); return *this; };

    tile_t& white() { return this->fill(cmax, cmax, cmax); }
    tile_t& black() { return this->fill(0,    0,    0   ); }
    tile_t& red()   { return this->fill(cmax, 0,    0   ); }
    tile_t& green() { return this->fill(0,    cmax, 0   ); }
    tile_t& blue()  { return this->fill(0,    0,    cmax); }

    tile_t& fill(int r, int g, int b) {
      for (int row = 0; row < 5; row++) {
        for (int col = 0; col < 5; col++) {
          this->pixel(col, row, r, g, b);
        }
      }
      return *this;
    }

    // todo: range checked row, col, r, g, b
    tile_t& pixel(int col, int row, int r, int g, int b) {
      // god. what a fucking nightmare.
      col < 5 || rmr.die("tile_t.pixel: bad col: %"_fmt % col);
      row < 5 || rmr.die("tile_t.pixel: bad row: %"_fmt % row);

      int i = row * 5 + col;

      int ri;
      int gi;
      int bi;

           if (i ==  0) { ri =  8; gi =  6; bi =  4; }
      else if (i ==  1) { ri = 17; gi = 15; bi = 13; }
      else if (i ==  2) { ri = 26; gi = 24; bi = 22; }
      else if (i ==  3) { ri = 44; gi = 42; bi = 40; }
      else if (i ==  4) { ri = 35; gi = 33; bi = 31; }
      else if (i ==  5) { ri = 53; gi = 51; bi = 49; }
      else if (i ==  6) { ri = 62; gi = 60; bi = 58; }
      else if (i ==  7) { ri = 71; gi = 69; bi = 67; }
      else if (i ==  8) { ri =  7; gi =  5; bi =  3; }
      else if (i ==  9) { ri = 16; gi = 14; bi = 12; }
      else if (i == 10) { ri = 25; gi = 23; bi = 21; }
      else if (i == 11) { ri = 34; gi = 32; bi = 30; }
      else if (i == 12) { ri = 43; gi = 41; bi = 39; }
      else if (i == 13) { ri = 52; gi = 50; bi = 48; }
      else if (i == 14) { ri = 61; gi = 59; bi = 57; }
      else if (i == 15) { ri = 70; gi = 68; bi = 66; }
      else if (i == 16) { ri =  2; gi =  1; bi =  0; }
      else if (i == 17) { ri = 11; gi = 10; bi =  9; }
      else if (i == 18) { ri = 20; gi = 19; bi = 18; }
      else if (i == 19) { ri = 29; gi = 28; bi = 27; }
      else if (i == 20) { ri = 38; gi = 37; bi = 36; }
      else if (i == 21) { ri = 47; gi = 46; bi = 45; }
      else if (i == 22) { ri = 56; gi = 55; bi = 54; }
      else if (i == 23) { ri = 65; gi = 64; bi = 63; }
      else if (i == 24) { ri = 74; gi = 73; bi = 72; }
      else              { rmr.die("wall.tile.pixel: bad row and column"); }

      lsb[ri] = r & 0xFF; // actually, this masking isn't required
      lsb[gi] = g & 0xFF;
      lsb[bi] = b & 0xFF;

      int msbr = (r >> 8) & 0b11;
      int msbg = (g >> 8) & 0b11;
      int msbb = (b >> 8) & 0b11;

      if (i < 8) {
        // xxxxx
        // xxx..
        // .....
        // .....
        // .....              rr
        //msb[i * 3 + 2] |= 0b00000000;
        //                    bb  gg
        //msb[i * 3 + 1] |= 0b00000000;

        msb[i * 3 + 2] = (msb[i * 3 + 2] & 0b00111111) | (msbr << 6);
        msb[i * 3 + 1] = (msb[i * 3 + 1] & 0b00110011) | (msbb << 6) | (msbg << 2);
      } else if (i < 16) {
        // .....
        // ...xx
        // xxxxx
        // x....
        // .....                   bb
        //wt.msb[j + 0] |= 0b00000000;
        //                     gg  rr
        //wt.msb[j + 1] |= 0b00000000; 

        msb[(i - 8) * 3 + 0] = (msb[(i - 8) * 3 + 0] & 0b11111100) | (msbb << 0);
        msb[(i - 8) * 3 + 1] = (msb[(i - 8) * 3 + 1] & 0b11001100) | (msbg << 4) | (msbr << 0);
      } else if (i < 24) {
        // .....
        // .....
        // .....
        // .xxxx
        // xxxx.             bbggrr
        //wt.msb[j + 0] |= 0b00000000; 
        msb[(i - 16) * 3 + 0] = (msb[(i - 16) * 3 + 0] & 0b00000011)
        | (msbb << 6)
        | (msbg << 4)
        | (msbr << 2);
      } else { // i == 24
        // .....
        // .....
        // .....
        // .....
        // ....x                bbggrr
        // wt.msb[j + 2] |= 0b00000000;
        msb[23] = (msb[23] & 0b11000000)
        | (msbb << 4)
        | (msbg << 2)
        | (msbr << 0);
      }

      return *this;
    }

    tile_t& zero() {
      *this = tile_t();
      return *this;
    }

  };

  tile_t& tile(int col, int row) {
    col < 16 || rmr.die("wall_t.tile: bad col: %"_fmt % col);
    row <  9 || rmr.die("wall_t.tile: bad row: %"_fmt % row);
    int i = -1;

    if (col ==  0 && row < 8) { i =   0 + row; }
    if (col ==  1 && row < 8) { i =  25 + row; }
    if (col ==  2 && row < 8) { i =  33 + row; }
    if (col ==  3 && row < 8) { i =  41 + row; }
    if (col ==  4 && row < 8) { i =  50 + row; }
    if (col ==  5 && row < 8) { i =  58 + row; }
    if (col ==  6 && row < 8) { i =  66 + row; }
    if (col ==  7 && row < 8) { i =  75 + row; }
    if (col ==  8 && row < 8) { i =  83 + row; }
    if (col ==  9 && row < 8) { i =  91 + row; }
    if (col == 10 && row < 8) { i = 100 + row; }
    if (col == 11 && row < 8) { i = 108 + row; }
    if (col == 12 && row < 8) { i = 116 + row; }
    if (col == 13 && row < 8) { i = 125 + row; }
    if (col == 14 && row < 8) { i = 133 + row; }
    if (col == 15 && row < 8) { i = 141 + row; }

    if (row == 8) {
      if (col == 0) i = 25;
      else          i = col + 9;
    }

    i == -1 && rmr.die("wall_t.tile: something bad happened");

    return tiles[i];
  };

  wall_t& fill(int r, int g, int b) {
    for (int row = 0; row < height; row++) {
      for (int col = 0; col < width; col++) {
        tile(col, row).fill(r, g, b);
      }
    }
    return *this;
  }

  wall_t& zero() {
    *this = wall_t();
    return *this;
  }

  wall_t& header(u8 x) { _header = x; return *this; }

  u8 _header;
  tile_t tiles[400];
};
