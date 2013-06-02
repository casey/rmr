 struct twitch_t {
  twitch_t();
  ~twitch_t();
  void poll();
  bool dead();
  u8* reserve(uint width, uint height);
  void submit(u8*);
  NSString* status();
private:
  struct data_t;
  data_t& __;
};
