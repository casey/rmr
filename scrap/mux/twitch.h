struct twitch_t {
  twitch_t(const string& un, const string& pw, const string& cs);
  ~twitch_t();
  void poll();
  u8* reserve(uint width, uint height);
  void submit(u8*);
  const string& status();
private:
  struct data_t;
  data_t& __;
};
