

  auto img = read_png(rmr.cfg("base") + "dat/font.png");
  int pixels = img.width() * img.height();
  SHOW(pixels);
  vector<u8> out(pixels / 8, 0);
  for (int i = 0; i < pixels; i++) {
    pixel_t pixel = img.data()[i];

    bool on  = pixel.r == 255 && pixel.g == 255 && pixel.b == 255 && pixel.a == 255;
    bool off = pixel.r ==   0 && pixel.g ==   0 && pixel.b ==   0 && pixel.a == 255;

    if (i < 100) cerr << on;

    (on || off) || rmr.die("weird pixel");

    if (on) out[i / 8] |= (1 << (i % 8));
  }

  FILE* of = fopen("/Users/rodarmor/Desktop/out.bits", "wb");
  for (u8 byte : out) fputc(byte, of);
  fclose(of);

  auto slurped = rmr.slurp("/Users/rodarmor/Desktop/out.bits");
  img_t out_image(img.width(), img.height());

  for (int i = 0; i < slurped.length(); i++) {
    for (int position = 0; position < 8; position++) {
      pixel_t& pixel = out_image.data()[i * 8 + position];
      if (slurped[i] & (1 << position)) {
        pixel = {255, 255, 255, 255};
      } else {
        pixel = {0, 0, 0, 255};
      }
    }
  }

  write_png("/Users/rodarmor/Desktop/out.png", out_image);

  rmr.exit();
