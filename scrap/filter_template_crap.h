string filter_template() {
  return rmr.slurp(rmr.cfg("base") + "src/filter.glsl");
}

string filter_source(sym_t name) {
  string src = filter_template();

  string FILTER = "FILTER";
  auto pos = src.find(FILTER);
  pos == -1 && rmr.die("blaster: bad filter template");
  src.replace(pos, FILTER.length(), "filter_%"_fmt(name));

  return src;
}

vector<sym_t> filter_names() {
  string t = filter_template();

  auto filter_re = R"(\nvec4\s+filter_([a-z0-9_]*)\s*[(][)])"_re;

  vector<sym_t> _;
  
  // todo: range() needs end iterator
  for (auto filter : range(sregex_token_iterator(t.begin(), t.end(), filter_re, 1))) {
    sym_t  name = sym_t(filter);
    _.push_back(name);
  }

  return _;
}
