struct ring_t {
  typedef vector<float> buffer_t;

  typedef buffer_t::              iterator               iterator;
  typedef buffer_t::        const_iterator         const_iterator;
  typedef buffer_t::      reverse_iterator       reverse_iterator;
  typedef buffer_t::const_reverse_iterator const_reverse_iterator;

  buffer_t buffer;
  u64      written;
  u64      dropped;

  ring_t()                  : ring_t(1024) {}
  ring_t(u64 size)          : buffer(size), written(0), dropped(0) {}
  ring_t(u64 size, float v) : ring_t(size) { fill(v); }

  u64  size()        { return std::min(written - dropped, capacity()); }
  u64  capacity()    { return buffer.size();                           }
  bool full()        { return size() == capacity();                    }

  ring_t& set(float v) {
    for (int i = 0; i < capacity(); i++) write(v);
    return *this;
  }

  ring_t& fill(float v) {
    while (!full()) write(v);
    return *this;
  }

  float get(int i) {
    (i >= 0 && i < size()) || (rmr.fatal() << "ring_t.get: bad index:" << i);
    int index = (i + dropped) % capacity();
    return buffer[index];
  }

  ring_t& write(float v) {
    int index = (written % capacity());
    buffer[index] = v;
    written++;
    return *this;
  }

  float drop() {
    size() > 0 || rmr.die("ring_t.drop: drop called while empty");
    int index = dropped % capacity();
    float x = buffer[index];
    dropped++;
    return x;
  }

  iterator begin() { 
    return buffer.begin() + dropped % capacity();
  }

  iterator end() {
    uint i = written % capacity();
    if (i == 0) return buffer.end();
    return buffer.begin() + i;
  }
};
