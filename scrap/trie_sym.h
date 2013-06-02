
struct trie_t;

#define TRIE 0

struct sym_t {
  sym_t();
#if TRIE
#else
  sym_t(SEL);
#endif
  sym_t(const char*);
  sym_t(const string&);
  sym_t(string&&);
  sym_t(const sym_t&);
  uptr id() const;
  bool operator==(const sym_t&) const;
  bool operator!=(const sym_t&) const;
  operator const string&() const;
  explicit operator bool() const;
  const string& str() const;
  const char*  c_str() const;

  static sym_t gensym();
private:
#if TRIE
  const trie_t* t;
#else
  SEL t;
#endif
};

string   operator+     (const string&, sym_t);
ostream& operator<<    (ostream&, const sym_t&);
sym_t    operator""_sym(const char*, size_t);

namespace std {
  template<>
  struct hash<sym_t> {
    size_t operator()(sym_t const&) const;
  };
}


#import "sym.h"
#import "rmr.h"

struct trie_t {
  static constexpr char minchar = int(' ');
  static constexpr char maxchar = int('~');
  static constexpr int  factor  = maxchar - minchar;

  trie_t() : trie_t(nullptr) {}
  trie_t(trie_t* parent) : parent(parent) { for (int i = 0; i < factor; i++) children[i] = nullptr; }

  trie_t* insert(const char* s) {
    auto current = this;

    while (*s) {
      unsigned char c = *s;
      if (c > maxchar || c < minchar) rmr.die("trie.insert: tried to insert invalid string: "s + s);
      int i = c - minchar;
      if (!current->children[i]) current->children[i] = new trie_t(current);
      current = current->children[i];
      s++;
    }

    return current;
  }

  const string& str() const {
    static map<const trie_t*, string> cache;
    static string temp;
    temp.resize(0);

    auto i = cache.find(this);

    if (i != cache.end()) return i->second;

    auto current = this;
    while (current->parent) {
      for (int i = 0; i < factor; i++) {
        if (current->parent->children[i] == current) {
          temp.push_back(char(i + minchar));
        }
      }
      current = current->parent;
    }

    std::reverse(temp.begin(), temp.end());
    auto r = cache.emplace(this, std::move(temp));
    return r.first->second;
  }

  trie_t* parent;
  trie_t* children[factor];
};

trie_t& trie() {
  static trie_t trie;
  return trie;
}

#if TRIE
sym_t::sym_t()                 : t(nullptr)                    { }
sym_t::sym_t(const sym_t& x)   : t(x.t)                        { }
sym_t::sym_t(const char* p)    : t(trie().insert(p))           { }
sym_t::sym_t(const string& str): t(trie().insert(str.c_str())) { }
sym_t::sym_t(string&& str)     : t(trie().insert(str.c_str())) { }
#else
sym_t::sym_t()                 : t(nullptr)                    { }
sym_t::sym_t(SEL x)   : t(x)                        { }
sym_t::sym_t(const sym_t& x)   : t(x.t)                        { }
sym_t::sym_t(const char* p)    : t(sel_registerName(p)) { }
sym_t::sym_t(const string& str): t(sel_registerName(str.c_str())) { }
sym_t::sym_t(string&& str)     : t(sel_registerName(str.c_str())) { }
#endif

uptr sym_t::id() const { return (uptr)t; }

#if TRIE
const string& sym_t::str() const { 
  static string nullstr = "";
  return t == nullptr ? nullstr : t->str();
}
#else
const string& sym_t::str() const { 
  static string nullstr = "";
  rmr << "sym.str";
  return t == nullptr ? nullstr : *new string(sel_getName(t));
}
#endif

const char* sym_t::c_str() const { return str().c_str(); }

sym_t::operator const string&() const {
  return str();
}

sym_t::operator bool() const {
  return t;
}

bool sym_t::operator==(const sym_t& sym) const {
  return t == sym.t;
}

bool sym_t::operator!=(const sym_t& sym) const {
  return !(*this == sym);
}

sym_t sym_t::gensym() {
  static int counter = 0;
  stringstream s;
  s << "__" << counter++ << "__";
  return sym_t(s.str());
}

ostream& operator<<(ostream& os, const sym_t& s) {
  return os << (const string&)s;
}

string operator+(const string& lhs, sym_t rhs) {
  return lhs + rhs.str();
}

sym_t operator""_sym(const char* b, size_t l) {
  return sym_t(string(b, l));
}

size_t
std::hash<sym_t>::operator()(sym_t const& s) const {
  return s.id();
}
