//!header
#define SHOW(x) rmr << ("%: %"_fmt % #x % x)

// lol preprocessor
#define TOKEN_PASTE2(a, b, c) a ## b ## c
#define TOKEN_PASTE(a, b, c) TOKEN_PASTE2(a, b, c)
#define UNIQUE_NAME(base) TOKEN_PASTE(basename, __FILE__, __LINE__)
#define STRINGIFY2(x) #x
#define STRINGIFY(x) STRINGIFY2(x)
#define UNIQUE_STRING(base) ( STRINGIFY(basename) __FILE__ ":" STRINGIFY(__LINE__) )

#define ONCE (rmr.once(sym_t(UNIQUE_STRING(ONCERS))))

// todo: remove all the bullshit from common.h

#import "mix.h"
#import "sym.h"

#import "vec.h"

template <typename A, typename B>
inline ostream& operator<<(ostream& os, const std::pair<A, B>& p) {
  return os << "(" << p.first << ", " << p.second << ")";
} 

inline ostream& operator<<(ostream& os, trans_t& t) {
  auto d = t.data();
  return os << d[0] << " " << d[4] << " " << d[ 8] << " " << d[12] << endl
            << d[1] << " " << d[5] << " " << d[ 9] << " " << d[13] << endl
            << d[2] << " " << d[6] << " " << d[10] << " " << d[14] << endl
            << d[3] << " " << d[7] << " " << d[11] << " " << d[15];
} 

struct rmr_t {
  static rmr_t rmr;

  static char tc;
  static int  ti;

  inline static int& loglevel() { static int l = 0; return l; };

  inline static rmr_t& banana() {
    die("bananaphone: ring ring ring ring ring ring ring");
    return rmr;
  }

  template<typename T> constexpr T cmax(T a, T b) { return a < b ? b : a; }
  template<typename T, typename ... R> constexpr T cmax(T a, T b, R ... rest) { return cmax(cmax(a, b), rest...); }
  template<typename T> constexpr T cmin(T a, T b) { return a > b ? b : a; }
  template<typename T, typename ... R> constexpr T cmin(T a, T b, R ... rest) { return cmax(cmax(a, b), rest...); }

  // todo:
  //  add colors to error and warn
  //  give log lines some kind of prefix
  template <typename T> static rmr_t& error(T _) { if (loglevel() >= -2) _log(_); return rmr; }
  template <typename T> static rmr_t& warn (T _) { if (loglevel() >= -1) _log(_); return rmr; }
  template <typename T> static rmr_t& log  (T _) { if (loglevel() >=  0) _log(_); return rmr; }
  template <typename T> static rmr_t& info (T _) { if (loglevel() >=  1) _log(_); return rmr; }
  template <typename T> static rmr_t& hint (T _) { if (loglevel() >=  2) _log(_); return rmr; }

  template <typename T> static rmr_t& _log(T _) { cerr << _ << endl; cerr.flush(); return rmr; }

  static u64 id();

  static rmr_t& hi() { log("hi"); return rmr; }

  mixin fatal_t {
    ~fatal_t() {
      if (!mix.parent) rmr.die("rmr_t: fatal");
    }
  };

  mixin auto_endl_t {
    template <typename T>
    Mix& operator<<(T _) {
      if (loglevel() >= 0) {
        cerr << _;
        cerr << " ";
      }
      return mix;
    }

    template <typename T>
    Mix& operator,(T _) {
      return mix << _;
    }

    ~auto_endl_t() {
      if (!mix.parent) cerr << endl; cerr.flush();
    }
  };

  typedef mix_t<auto_endl_t, lineage_t, true_t>          pretty_ostream_t;
  typedef mix_t<fatal_t, auto_endl_t, lineage_t, true_t> fatal_ostream_t;

  template <typename T>
  pretty_ostream_t operator<<(T _) { 
    return (pretty_ostream_t() << _);
  }

  fatal_ostream_t fatal() {
    return fatal_ostream_t();
  }

  template <typename T>
  [[ noreturn ]] static rmr_t& die(T _) {
    log(trace());
    log(_);
    exit(1);
  }

  [[ noreturn ]] static rmr_t& die() { die("die"); }

  static rmr_t& sleep(double t) {
    usleep(useconds_t(t * 1000 * 1000));
    return rmr;
  }

  static double clamp(double n) {
    return clamp(n, 0.0, 1.0);
  }

  static double clamp(double n, double min, double max) {
    return n < min ? min :
           n > max ? max :
                     n   ;
  }

  double t(double start, double end, double x) {
    return x <= start ? 0.0 :
           x >= end   ? 1.0 :
                        1.0 - ((end - x) / (end - start));
  }

  static bool once(sym_t s);

  static bool maybe() { return maybe(0.5); }

  static bool maybe(double p) {
    return rmr.random() < p;
  }

  static double angle(double a) {
    return posmod(a, rmr.tau());
  }

  static double posmod(double a, double p) {
    a = std::fmod(a, p);
    return a < 0 ? a + p : a;
  }

  static double random();
  static double random(double max);
  static double random(double min, double max);

  static v3 random3();
  static v3 random3(double max);
  static v3 random3(double min, double max);

  explicit operator bool() const { return true; }

  constexpr static double pi () { return 3.141592653589793238463; }
  constexpr static double tau() { return pi() * 2;                }

  static string  slurp(const char *path);
  static string& fetch(const char *path);

  static string& rsc(const char* path) {
    auto s = "rsc/"s + path;
    return fetch(s.c_str());
  }

  static string& rsc(string path) { return rsc(path.c_str()); }

  void dgram(const char* address, int port, string contents);

  template <typename T>
  void zero(T& x) { memset(&x, 0, sizeof(T)); }

  static double now();
  static u64 ms();
  static u64 ns();

  static string git_head();

  static string trace();

  template <typename T>
  static string join(const T& container, string sep) {
    string result;
    for (const string& s : container) {
      result += s;
      result += sep;
    }
    result.resize(result.length() - sep.length());
    return result;
  }

  static string ltrim(string s) {
    s.erase(s.begin(), std::find_if(s.begin(), s.end(), std::not1(std::ptr_fun<int, int>(std::isspace))));
    return s;
  }

  static string rtrim(string s) {
    s.erase(std::find_if(s.rbegin(), s.rend(), std::not1(std::ptr_fun<int, int>(std::isspace))).base(), s.end());
    return s;
  }

  static string trim(string s) {
    return ltrim(rtrim(s));
  }

  template<typename T>
  struct grid_t {
    grid_t() {};

    grid_t(grid_t&& that) : width(that.width), height(that.height), data(std::move(that.data)) { }

    void alloc(uint w, uint h) {
      width  = w;
      height = h;
      data.resize(width * height);
    }
    
    uint index(uint x, uint y) {
      x < width  || (rmr.fatal() << "image_t.index: col out of bounds:" << x);
      y < height || (rmr.fatal() << "image_t.index: row out of bounds:" << y);
      return y * width + x;
    }

    T get(uint row, uint col) {
      return data[index(row, col)];
    }

    void set(uint row, uint col, T v) {
      data[index(row, col)] = v;
    }

    void clear() {
      fill(T());
    }

    void fill(const T& v) {
      for (T& x : data) {
        x = v;
      }
    }

    uint      width  = 0;
    uint      height = 0;
    vector<T> data;
  };

  // should probably also have byte image
  struct image_t {
    uint width = 0;
    uint height = 0;
    vector<v4> data;

    image_t() {};

    image_t(image_t&& x) : width(x.width), height(x.height), data(std::move(x.data)) {
    }

    void alloc(uint w, uint h) {
      width  = w;
      height = h;
      data.resize(width * height);
    }

    uint index(uint x, uint y) {
      x < width  || (rmr.fatal() << "image_t.index: col out of bounds:" << x);
      y < height || (rmr.fatal() << "image_t.index: row out of bounds:" << y);
      return y * width + x;
    }

    v4 operator() (uint row, uint col) {
      return data[index(row, col)];
    }

    void operator() (uint row, uint col, v4 v) {
      data[index(row, col)] = v;
    }

    void set(const v4& v) {
      for (auto& pixel : data) pixel = v;
    }

    void clear() {
      set({0, 0, 0, 0});
    }
  };

  // get rid of this version
  static rmr_t& write_png(const char* file_name, u8 *pixels, int width, int height);

  static rmr_t& write_png(const char* file_name, image_t& i) {
    unique_ptr<u8> up(new u8[i.width * i.height]);
    auto p = up.get();
    int n = 0;
    for (v4 v : i.data) {
      p[n * 4 + 0] = clamp(0, 255, v[0] * 256);
      p[n * 4 + 1] = clamp(0, 255, v[1] * 256);
      p[n * 4 + 2] = clamp(0, 255, v[2] * 256);
      p[n * 4 + 3] = clamp(0, 255, v[3] * 256);
      n++;
    }

    write_png(file_name, p, i.width, i.height);

    return rmr;
  }

  static image_t read_png(const char* file_name) {
    return image_t();
  }
};

typedef rmr_t::image_t image_t;

extern rmr_t& rmr;

#import "fmt.h"
#import "timer.h"
#import "color.h"
#import "series.h"

inline string operator+(const string& s, const unsigned char* z) {
  return s + (const char*)z;
}

template<typename T>
struct ptr_t {
  T* p = nullptr;

  ptr_t() {}
  ptr_t(T* p) : p(p) {}

  T& operator*() {
    p || rmr.die("ptr_t: operator*: null");
    return *p;
  }

  T* operator->() {
    p || rmr.die("ptr_t: operator->: null");
    return p;
  }

  operator bool() {
    return p;
  }
};

mixin birthday_t {
  birthday_t() : _birthday(rmr.now()) {}
  float birthday() { return _birthday; }
private:
  float _birthday;
};

#import "ring.h"

/*

#import <glob.h>
inline std::vector<std::string> glob(const std::string& pat){
  using namespace std;
  glob_t glob_result;
  glob(pat.c_str(),GLOB_TILDE,NULL,&glob_result);
  vector<string> ret;
  for(unsigned int i=0;i<glob_result.gl_pathc;++i){
    ret.push_back(string(glob_result.gl_pathv[i]));
  }
  globfree(&glob_result);
  return ret;
}
*/

inline void    operator"" _error(const char* b, size_t l) { rmr.error(string(b, l));      }
inline void    operator"" _warn (const char* b, size_t l) { rmr.warn (string(b, l));      }
inline void    operator"" _log  (const char* b, size_t l) { rmr.log  (string(b, l));      }
inline void    operator"" _info (const char* b, size_t l) { rmr.info (string(b, l));      }
inline void    operator"" _hint (const char* b, size_t l) { rmr.hint (string(b, l));      }
inline void    operator"" _die  (const char* b, size_t l) { rmr.die  (string(b, l));      }
inline void    operator"" _out  (const char* b, size_t l) { cout << string(b, l) << endl; }
inline double  operator"" _t    (long double d          ) { return d * rmr.tau();         }
inline double  operator"" _t    (unsigned long long n   ) { return n * rmr.tau();         }
inline string& operator"" _rsc  (const char* b, size_t l) { return rmr.rsc(string(b, l)); }
inline fmt_t   operator"" _fmt  (const char* b, size_t l) { return fmt_t(string(b, l));   }
inline regex   operator"" _re   (const char* b, size_t l) { return regex(string(b, l));   }


/*
inline NSString* operator"" _ns(const char* b, size_t l) {
  return [NSString stringWithUTF8String: string(b, l).data()];
}
*/

