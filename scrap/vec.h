// todo:
// - proper initializer list init
// - rvalue constructors
// - inherit constructors

#import <type_traits>

template<typename T, uint N>
struct vec_t : array<T, N> {
  // sum: how do i figure out the type needed to hold a sum?
  T sum() {
    T total{};
    for(uint i = 0; i < N; i++) {
      total += (*this)[i];
    }
    return total;
  }

  vec_t operator + (vec_t& v) {
    vec_t x = *this;
    for(uint i = 0; i < N; i++) x[i] = (*this)[i] + v[i];
    return x;
  }

  vec_t& operator += (vec_t& v) {
    for(uint i = 0; i < N; i++) (*this)[i] = (*this)[i] + v[i];
    return *this;
  }

  vec_t& operator += (T& x) {
    for(uint i = 0; i < N; i++) (*this)[i] = (*this)[i] + x;
    return *this;
  }
};

// component wide multiplication, addition, subtraction

template<uint N> using uvec_t = vec_t<uint  , N>;
template<uint N> using ivec_t = vec_t<int   , N>;
template<uint N> using fvec_t = vec_t<float , N>;
template<uint N> using dvec_t = vec_t<double, N>;
template<uint N> using cvec_t = vec_t<char  , N>;

// typedef vec_t<float, 2> v2;
// typedef vec_t<float, 3> v3;
//typedef vec_t<float, 4> v4;

//typedef vec_t<v3, 3> m3; // might not be a good idea
