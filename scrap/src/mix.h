template<template<typename> class... Mixins>
struct mix_t : Mixins<mix_t<Mixins...>>... {
  typedef tuple<Mixins<mix_t<Mixins...>>...> types;
};

#define mixin template<typename Mix> struct 
#define mix (*(static_cast<Mix*>(this)))

mixin lineage_t {
  bool parent = false;
  lineage_t(             ) {                  }
  lineage_t(lineage_t& _ ) { _.parent = true; }
  lineage_t(lineage_t&& _) { _.parent = true; }
};

mixin void_t {
};

mixin true_t  { operator bool() { return true;  } };
mixin false_t { operator bool() { return false; } };

/*
mixin needs_void_t {
  //static_assert(std::is_base_of<void_t<Mix>, Mix>::value, "needs_void_t must be mixed with void_t");
  static_assert(Mix::is_void_t, "needs_void_t must be mixed with void_t");
};
*/

template<typename T>
struct wrapper_t {
  mixin type : T {
  };
};

// todo: overload new[] and delete[]
mixin census_t {
  static int       population() { return _population;                      }
  static int  heap_population() { return _new_pointers.size();              }
  static int stack_population() { return population() - heap_population(); }

  void* operator new(size_t s) throw(std::bad_alloc) {
    void* p = ::operator new(s);
    _new_pointers.insert(p);
    return p;
  }

  void operator delete(void* p) {
    _new_pointers.erase(p);
    ::operator delete(p);
  }

  census_t (census_t& t) { _population++; }
  census_t (           ) { _population++; }
  ~census_t(           ) { _population--; }
 
private: 
  static int        _population;
  static set<void*> _new_pointers;
};

template<typename Mix>
int census_t<Mix>::_population = 0;

template<typename Mix>
set<void*> census_t<Mix>::_new_pointers;
