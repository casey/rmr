  /*

  // node
  auto& node = w.cam()
                .spawn<clear_c>("black"_c)
                  .spawn<node_c>();

  double start = 0;

  node
  .root()
  .spawn<debug_node_t>()
  .iterate(100, [&](node_t& _, int n, int i) { 
    _.spawn().translate(v2::heading(rmr.random_angle()).extend() * rmr.random(0.5));
  })
  .traverse([&](auto& _) { _.clone().translate_x(0.01); })
  .chain_tick([&](auto& _, auto now, auto dt) {
    if (faster) speed *= 1.01;
    _.rotate_z(-speed * dt);

    if (!going) return;
    if (start == 0) start = rmr.now();

    int scheduled = (now - start) * 10000;
    if (_.child_count() < scheduled) {
      _.spawn().translate(v2::heading((now-start)).extend() * 0.9);
    }
  })
  .clone()
  ;

  // march
  w.cam()
  .spawn<march_c>();

  // quad
  w.cam()
  .spawn()
    .spawn<waveform_c>()      .position(0.5, 0.5, 0.0, 0.0).up()
    .spawn<program_c>("color").position(0.5, 0.5, 0.0, 0.5).up()
    .spawn<clear_c>("r:r"_c)  .position(0.5, 0.5, 0.5, 0.5).up()
    .spawn<march_c>()         .position(0.5, 0.5, 0.5, 0.0).up();

  // waveform
  w.cam()
  .spawn<clear_c>("black"_c)
    .spawn<waveform_c>();

  change();
  */

