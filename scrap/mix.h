#define mixin template<typename Mix> struct
#define mix (*(static_cast<Mix*>(this)))

template<template<typename> class... Mixins>
struct mix_t : Mixins<mix_t<Mixins...>>... {
  typedef tuple<Mixins<mix_t<Mixins...>>...> types;
};

mixin void_t  { };
mixin true_t  { explicit operator bool() { return true;  } };
mixin false_t { explicit operator bool() { return false; } };

mixin lineage_t {
  bool parent = false;
  lineage_t(             ) {                  }
  lineage_t(lineage_t&  _) { _.parent = true; }
  lineage_t(lineage_t&& _) { _.parent = true; }
};

mixin auto_endl_t {
  Mix& operator<<(str_t _) {
    if (loglevel() >= 0) cerr << _ << " ";
    return mix;
  }

  Mix& operator,(str_t _) {
    return mix << _;
  }

  ~auto_endl_t() {
    if (!mix.parent) cerr << rmr_t::ansi_clear() << endl; cerr.flush();
    if (!mix.parent && fatal) rmr_t::die("rmr_t: fatal");
  }
  Mix& arm()    { fatal = true;  return mix; }
  Mix& disarm() { fatal = false; return mix; }

private:
  bool fatal = false;
};

typedef mix_t<auto_endl_t, lineage_t, true_t> pretty_ostream_t;
