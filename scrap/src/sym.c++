#import "sym.h"

#import "rmr.h"

// add custom gensym prefixes
// check for possibly conflicting symbols in sym_t
sym_t gensym() {
  static u64 next = 0;
  return sym_t("::%::"_fmt % next++);
};

unordered_map<string, const string*> sym_t::table;
