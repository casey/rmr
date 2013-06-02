struct range_t {
  struct iterator_t : std::iterator<std::input_iterator_tag, int> {
    //todo: reverse iterators, stride iterators
    iterator_t(int count) : count(count) {}

    const int&  operator* (                      ) const { return count;                          }
    iterator_t  operator++(int                   )       { count++; return iterator_t(count - 1); }
    iterator_t& operator++(                      )       { count++; return *this;                 }
    iterator_t& operator+=(int n                 )       { count += n; return *this;              }
    bool        operator< (const iterator_t& that) const { return count < that.count;             }
    bool        operator==(const iterator_t& that) const { return count == that.count;            }
    bool        operator!=(const iterator_t& that) const { return count != that.count;            }
  private:
    int count;
  };

  int min;
  int max;

  range_t(int max)          : range_t(0, max)      {}
  range_t(int min, int max) : min(min), max(max) {}

  iterator_t begin() const { return iterator_t(0  ); }
  iterator_t end  () const { return iterator_t(max); }
};
