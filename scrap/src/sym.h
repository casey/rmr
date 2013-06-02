struct sym_t {
  static unordered_map<string, string const*> table;

  sym_t(const char* s) : sym_t(string(s)) {}

  // create from string
  sym_t(const string& s) : s(table.count(s) ? table[s] : (table[s] = new string(s))) {}

  // create from symbol
  sym_t(const sym_t& x) : s(x.s) {}

  // create from nsstring
  //sym_t(const NSString * s) : sym_t([s UTF8String]) {}

  bool operator== (const sym_t &x) const { return s == x.s; }

  uptr id() const { return uptr(s); };

  operator string() const {
    return *s;
  }

private:
  string const* s;
};

sym_t gensym();

namespace std {
  template<>
  struct hash<sym_t> {
    typedef sym_t       argument_type;
    typedef std::size_t value_type;
 
    value_type operator()(argument_type const& s) const {
      return s.id();
    };
  };
}

inline ostream& operator<<(ostream& os, const sym_t& s) {
  return os << ":" << string(s);
} 

inline sym_t operator"" _sym(const char* b, size_t l) { return sym_t(string(b, l)); }
