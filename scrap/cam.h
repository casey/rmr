#import "indirect.h"

struct cam_t {
  cam_t();
  explicit cam_t(win_t&);
  explicit cam_t(cam_t*);
  virtual ~cam_t();

  using _ = cam_t&;

  struct args_t {
    u64    frame;
    int    x;
    int    y;
    int    w;
    int    h;
    double start;
    double now;
    double elapsed;
  };

  virtual void render(const args_t&);

  _ operator[](int);
  _ spawn();
  _ tree(int indent = 0);
  _ parent();
  _ root();
  _ up();
  _ hidden(bool);
  _ toggle();
  _ beat();
  _ show();
  _ hide();
  _ width (double);
  _ height(double);
  _ left  (double);
  _ top   (double);
  _ position(double, double, double, double);

  template<typename Cam>
  bool is() {
    return !!dynamic_cast<Cam*>(this);
  }

  template<typename Cam>
  Cam& as() {
    auto p = dynamic_cast<Cam*>(this);
    p || rmr_die("cam.as: cast failed");
    return *p;
  }

  template<typename Cam, typename ...P>
  Cam& spawn(P&&... args) {
    imprint();
    return *new Cam(std::forward<P>(args)...);
  }

  gl_t&  gl();
  void   tick();
  win_t& win();
  int    child_count();
  bool   is_root();
  bool   is_leaf();
  bool   hidden();
  bool   operator==(cam_t&);

  using iterator_t = indirect_iterator_t<cam_t>;

  iterator_t begin();
  iterator_t end();

private:
  _ imprint();

  void tick(const args_t&);

  cam_t(const cam_t&)            = delete;
  cam_t& operator=(const cam_t&) = delete;
  struct data_t;
  data_t& __;
};
