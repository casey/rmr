// todo: add rate limiter: timer.every(1s);
// todo: add sleep until
struct timer_t {
  timer_t() : start(std::chrono::system_clock::now()) {}
  std::chrono::system_clock::time_point start;

  double elapsed() {
    auto end = std::chrono::system_clock::now();
    auto dur = std::chrono::duration_cast<std::chrono::duration<double>>(end - start);
    return dur.count();
  }

  u64 ms() {
    auto end = std::chrono::system_clock::now();
    return std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count();
  }

  u64 ns() {
    auto end = std::chrono::system_clock::now();
    return std::chrono::duration_cast<std::chrono::nanoseconds>(end - start).count();
  }

  void reset() {
    start = std::chrono::system_clock::now();
  }
};

