
// shorten compile times
// - no duplicate imports
// - no redundant template instantions
/*
struct v4 {
  v4() : v4(0, 0, 0, 0) {}

  v4(float x, float y, float z, float w) {
    _data[0] = x;
    _data[1] = y;
    _data[2] = z;
    _data[3] = w;
  }

  float x() { return _data[0]; }

  float& operator[] (int i) {
    //todo: (i >= 0 && i <= 4) || rmr.fatal() << "v4.operator[]: subscript out of range:" << i;
    return _data[i];
  }

private:
  float _data[4];
};

struct v3 {
  v3() : v3(0, 0, 0) {}

  v3(float x, float y, float z) {
    _data[0] = x;
    _data[1] = y;
    _data[2] = z;
  }

  float x() { return _data[0]; }

  float& operator[] (int i) {
    //todo: (i >= 0 && i <= 3) || rmr.fatal() << "v3.operator[]: subscript out of range:" << i;
    return _data[i];
  }

  v4 extend(float v) { return v4{_data[0], _data[1], _data[2], v}; }

private:
  float _data[3];
};

struct quat_t {
};
*/
