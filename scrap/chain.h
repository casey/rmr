#import "app.h"
#import "test.h"

struct target_t {
  void name(const string& name) {
    _name = name;
  }

  void id(const sym_t& id) {
    _id = id;
  }

  sym_t  _id   = {};
  string _name = "";
};

struct foo_t : target_t {
  void hello(const string& hello) {
    _hello = hello;
  }

  void frobnicate() {
    rmr << "frobbing...";
  }

  string _hello = "";
};

#define MAKE_CHAIN(NAME, TYPE)                                                       \
struct NAME ## _ {                                                                   \
NAME ## _ (const TYPE& _) : _(_) { }                                                 \
                                                                                     \
template<typename T>                                                                 \
void operator()(T& target) {                                                         \
static_assert(std::is_void<decltype(target.NAME(_))>::value, "method must be void"); \
rmr << "chain" << _;                                                                 \
target.NAME(_);                                                                      \
}                                                                                    \
                                                                                     \
const TYPE _;                                                                        \
};

namespace chainspace {
  MAKE_CHAIN(name, string);
  MAKE_CHAIN(id, sym_t);
  MAKE_CHAIN(hello, string);

  template<typename T, typename C>
  inline T& operator/(T& t, C&& c) {
    c(t);
    return t;
  }
}

// asssert property takes expected type
// alternately do plain assignment if the named method doesn't exist

using name_ = chainspace::name_;
using id_ = chainspace::id_;
using hello_ = chainspace::hello_;

#undef MAKE_CHAIN

struct mystery_t {
  template<typename Target>
  struct bound_to_target_t {
    Target& target;

    template <typename ValueType>
    Target& operator/(ValueType& value) {
      target.name(value);
      return target;
    }
  };
};

template<typename LHS, typename RHS>
inline typename RHS::template bound_to_target_t<LHS> operator/(LHS& target, RHS& chainer) {
  return typename RHS::template bound_to_target_t<LHS>{target};
}

mystery_t mystery_;

constexpr int stack_max = 1024;
context_t*  context_stack[stack_max];
int stack_top = 0;

struct context_t {
}

template<typename Target>
struct with {
  with(Target& target) : target(target) {}

  template<typename T> with& name(const T& s) { target.name(s); return *this; }
  template<typename T> with& id  (const T& s) { target.id(s);   return *this; }

  with& parent() {
    return with(target.parent());
  }

private:
  Target& target;
}

wrap(node).name();

int main(int argc, char** argv) {
  run_tests();

  target_t t;
  with(t).name("hello").parent()

  target_t t;
  t
  / name_{"hello"}
  / id_{"some_id"};

  foo_t f;
  f
  / name_ ("hello  ")
  / id_   ("some_id")
  / hello_("bobby"  );


  f 
  / mystery_ / "mystery value"
  / mystery_ / "mystery value 2";

  with context:
    a
    b
    c
    e
    f
    g
      a

  /*
  f
  / name_ / "hello"
  / hello / "beeeee"
  --.frobnicate();
  */

  rmr << f._name;
  rmr << t._id;

  return 0;

  return top_t(rmr.nothing()).spawn<app_t>(argc, argv);
}
