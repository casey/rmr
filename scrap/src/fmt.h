#import "rmr.h"

struct fmt_t {
  fmt_t(string s) : format(s) {};

  fmt_t(const fmt_t& f) : format(f.format) {
    stream << f.stream.rdbuf();
  }

  template <typename T>
  fmt_t& operator%(T _) {
    for (int i = 0; i < format.length(); i++) {
      if (format[i] == '%') {
        if (i + 1 < format.length() && format[i + 1] == '%') {
          i += 2;
          continue;
        }

        stream << format.substr(0, i);
        format.erase(0, i + 1);
        stream << _;
        return *this;
      }
    }

    rmr.die("fmt %: ran out of format string!");
  }

  string str() const {
    for (int i = 0; i < format.length(); i++) {
      if(format[i] == '%' && (i == format.length() || format[i + 1] != '%')) {
        rmr.die("fmt.str: incomplete format: \""s + format + "\"");
      }
    }
    return stream.str() + format;
  }

  operator string() const { return this->str(); }

  // todo: "hello %s"_fmt("hello", "bob")

private:
  string       format;
  stringstream stream;
};

inline ostream& operator<<(ostream& os, const fmt_t& fmt) {
  return os << fmt.str();
} 
