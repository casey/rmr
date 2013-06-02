

  u32 get_id(map<sym_t, u32> data_t::*ids, sym_t s) {
    auto p = this;
    do {
      auto& table = p->*ids;
      if (table.count(s)) return table[s];
      p = p->parent;
    } while(p);
    if (ids == &data_t::vbos) rmr.die("gl_t.get_id: id not found: %"_fmt % string(s));
    else                      rmr.die("gl_t.get_id: something strange happened");
  }

  bool has_id(map<sym_t, u32> data_t::*ids, sym_t s) {
    auto p = this;
    do {
      auto& table = p->*ids;
      if (table.count(s)) return true;
      p = p->parent;
    } while(p);
    return false;
  }

  void new_id(map<sym_t, u32> data_t::*ids, sym_t s) {
    cout << s;
    has_id(ids, s) && rmr.die("gl_t.new_id: id already exists %"_fmt % s);
    u32 id;
    if (ids == &data_t::vbos) glGenBuffers(1, &id);
    else rmr.die("gl_t.has_id: something strange happened");
    (this->*ids)[s] = id;
  }

  u32  get_vbo(sym_t s) { return get_id(&data_t::vbos, s); }
  bool has_vbo(sym_t s) { return has_id(&data_t::vbos, s); }
  void new_vbo(sym_t s) {        new_id(&data_t::vbos, s); }
