struct hsb_t {
  double h = 0;
  double s = 0;
  double b = 0;

  v3 rgb() const {
    double _b = rmr.clamp(b);
    double _s = rmr.clamp(s);
    double _h = rmr.angle(h);

    if (_s == 0) return {_b, _b, _b};

    int sector = std::floor((_h / rmr.tau()) * 6);

    double f = _h - (sector / 5.0) * rmr.tau();
    double p = b * ( 1 - _s );
    double q = b * ( 1 - _s * f );
    double t = b * ( 1 - _s * ( 1 - f ) );

    return sector == 0 ? v3{_b,  t,  p} :
           sector == 1 ? v3{ q, _b,  p} :
           sector == 2 ? v3{ p, _b,  t} :
           sector == 3 ? v3{ p,  q, _b} :
           sector == 4 ? v3{ t,  p, _b} :
                         v3{_b,  p,  q} ;
  }

  v4 rgba(double a = 1.0) const {
    return rgb().extend(a);
  }

  operator v4() const { return rgba(); }
  operator v3() const { return rgb (); }
};

struct color_t : v4 {
  color_t(v4 v) : v4(v) { }
};

//inline color_t operator"" _color(const char* b, size_t l) { return color_t(); } // look up color name
//inline color_t operator"" _color(unsigned long long n   ) { return color_t(); } // parse hex
