rmr.iou();
string base    = rmr.cfg("base") + "src/";
string ending  = ".glsl";

string pattern = base + "f.*" + ending;
vector<string> paths = rmr_glob(pattern);

for (auto& path : paths) {
  string filter = path.substr(base.length(), path.length() - base.length() - ending.length());
  rmr << filter;
  filters.push_back(filter);
}
