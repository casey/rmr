#import "cam.h"

struct clear_c : cam_t {
  clear_c(const vec4& color);
  virtual void render(const args_t&);
private:
  struct data_t;
  data_t& __;
};

struct program_c : cam_t {
  program_c(const sym_t& program);
  virtual void render(const args_t&);
private:
  struct data_t;
  data_t& __;
};

/*
struct node_c : cam_t {
  node_c() : _root("root"_sym), _scene(&_root), _eye(&_root) {
    auto img = read_bits(rmr.cfg("base") + "dat/font.bin", 4096, 4096);

    gl().new_tex("font");

    auto ft = gl().get_tex("font");
    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, ft);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);

    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, img.width(), img.height(), 0, GL_RGBA, GL_UNSIGNED_BYTE, img.bytes());
  }

  void traverse(node_t& node, const m4& parent_transform, group_map& groups) {
    if (node.hidden()) return;
    node.matrix(parent_transform * node.transform());
    groups[typeid(node)].push_back(&node);
    for (node_t& child : node) traverse(child, node.matrix(), groups);
  }

  virtual void render(const args_t& a) {
    (scene() == eye() && eye() == root()) || rmr.die("root must equal eye and scene");
    double dt = last_tick == 0.0 ? 0.0 : (a.now - last_tick);
    root().tick(a.now, dt);
    last_tick = a.now;

    group_map groups;
    traverse(root(), m4::identity(), groups);

    for (auto& p : groups) {
      auto&   index = p.first;
      auto&   group = p.second;
      node_t& prime = *group[0];
      rmr.spam("node_c.render: rendering group with % members"_fmt(group.size()));

      gl_t* glp = gls[index];
      if (!glp) {
        glp = gls[index] = &gl().spawn();
        glp->supplier("cam_intensity", [this](gl_t& gl, sym_t s) { gl.value(s, this->intensity); });
        glp->supplier("cam_font",      [this](gl_t& gl, sym_t s) { gl.value(s, 0);               });
        prime.gl(*glp);
      }
      prime.render(*glp, frame_t<node_t*>(group));
    }
  }

  using group_map = map<type_index, vector<node_t*>>;
  using gl_map    = map<type_index, gl_t*>;

  node_t& scene() { return *_scene; }
  node_t& eye()   { return *_eye;   } 
  node_t& root()  { return _root;   }

private:
  node_t  _root;
  node_t* _scene;
  node_t* _eye;
};
*/
