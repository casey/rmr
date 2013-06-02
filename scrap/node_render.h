
  gl.new_vbo("position");

  /*
  for (auto p : nodes) {
    node_t& node = *p;
    gl
    .prepare(SYM(node))
    .value(SYM(transform),  node.matrix())
    .value(SYM(color),      node.color())
    .value(SYM(point_size), node.point_size())
    .buffer_data_dynamic(SYM(position), node.size(), node.data())
    .pack({SYM(position)},  SYM(position))
    .ready()
    .points()
    .draw_arrays()
    .done()
    ;
  }
  */
