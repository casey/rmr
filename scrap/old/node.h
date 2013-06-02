struct node_t {
  node_t() {}

  // todo: make all constructors private
  // provide a static method for creating new nodes
  trans_t transform() { return _transform; }
  node_t& transform(trans_t transform) { _transform = transform; return *this; }

  node_t& translate(float x, float y, float z) {
    v3 v(x, y, z);
    Eigen::Translation<float, 3> translation(v);
    _transform *= translation;
    return *this;
  }

  node_t& translate_x(float x) { return translate(x,   0.0, 0.0); }
  node_t& translate_y(float y) { return translate(0.0, y,   0.0); }
  node_t& translate_z(float z) { return translate(0.0, 0.0, z  ); }

  node_t& translate(v3 v) { return translate(v[0], v[1], v[2]); }

  // lineage
  // lce
  // iterate over direct children
  // iterate over self and descendents
  // different traversal iterators
  // findAll
  // ancestor(name)
  // clone
  // children
  // filter to vector

  ~node_t() {
    while(!leaf()) first_child().orphan();
  }

  node_t& first_child() {
    return **(_children.begin());
  }

  node_t& clone() {
    _parent || rmr.die("node_t.clone: can't clone a root");
    auto& sibling = *(new node_t());

    sibling
    .cardinality(cardinality())
    .color(color())
    .transform(transform())
    .vertices(vertices());

    parent().adopt(sibling);

    for (auto c : children()) {
      sibling.adopt(c->clone());
    }

    return sibling;
  }

  node_t& spawn() {
    auto& child = *(new node_t());
    child.cardinality(cardinality()).color(color());
    adopt(child);
    return child;
  }

  node_t& parent() {
    if (!_parent) rmr.die("node_t.parent: no parent");
    return *_parent;
  }

  uint child_count() {
    return _children.size();
  }

  bool leaf() {
    return _children.empty();
  }

  node_t& adopt(node_t& x) {
    auto p = x.orphan();
    _children.insert(p.get());
    p.release();
    x._parent = this;
    return *this;
  }

  typedef std::function<bool(node_t&)> predicate_t;

  ptr_t<node_t> find(predicate_t f) {
    if (f(*this)) return ptr_t<node_t>(this);
    
    for (auto child : _children) {
      if (f(*child)) {
        return ptr_t<node_t>(child);
      }
    }

    return nullptr;
  }

  bool all(predicate_t f) {
    if (!f(*this)) return false;

    for (auto child : _children) {
      if (!f(*child)) return false;
    }

    return true;
  }

  bool any(predicate_t f) {
    if (f(*this)) return true;

    for (auto child : _children) {
      if (f(*child)) return true;
    }
    
    return false;
  }

  unique_ptr<node_t> orphan() {
    if (_parent) {
      _parent->_children.erase(this);
      _parent = nullptr;
    }
    return unique_ptr<node_t>(this);
  }

  node_t& root() {
    if (_parent) return _parent->root();
    return *this;
  }

  int depth() {
    return _parent ? _parent->depth() + 1 : 0;
  }

  int height() {
    if (_children.empty()) {
      return 0;
    } else {
      int m = 0;
      for (auto child : _children) {
        m = std::max(m, child->height());
      }
      return m + 1;
    }
  }

  node_t& print(int indent = 0) {
    for (int i = 0; i < indent; i++) {
      cout << " ";
    }

    cout << this;
    cout << endl;

    for (auto child : _children) {
      child->print(indent + 3);
    }

    if (indent == 0) {
      cout.flush();
    }

    return *this;
  }

  set<node_t*>& children() { return _children; };

  v4 color() { return _color; }
  node_t& color(v4 c) { _color = c; return *this; }
  node_t& color(float a, float b, float c, float d) {
    _color = {a, b, c, d};
    return *this;
  }

  node_t& color(v3 c) { return color(c.extend(1.0)); }

  node_t& color(float r, float g, float b) { return color(v4{r, g, b, 1.0}); }

  node_t& vertex(v3 v) {
    _vertices.push_back(v.extend(1.0));
    return *this;
  }

  node_t& vertex(float a, float b, float c) {
    _vertices.push_back(v4(a, b, c, 1.0));
    return *this;
  }

  const vector<v4>& vertices() { return _vertices; }

  int vertex_count() { return _vertices.size(); }

  template<typename T>
  node_t& vertices(T& container) {
    _vertices.clear();
    for (v4 v : container) {
      _vertices.push_back(v);
    }
    return *this;
  }

  int     cardinality()       { return _cardinality;            }
  node_t& cardinality(uint c) { _cardinality = c; return *this; }
  node_t& points()            { return cardinality(1);          }
  node_t& lines()             { return cardinality(2);          }
  node_t& triangles()         { return cardinality(3);          }

  bool is_points   () { return cardinality() == 1; }
  bool is_lines    () { return cardinality() == 2; }
  bool is_triangles() { return cardinality() == 3; }
  vector<v4>    _vertices    = {};

private:
  node_t(node_t&) = delete;
  node_t& operator=(const node_t&) = delete;

  int           _cardinality = 1;
  v4            _color       = {1.0, 1.0, 1.0, 1.0};
  trans_t       _transform   = trans_t::Identity(); // todo: rename to _transform
  ptr_t<node_t> _parent      = nullptr;
  set<node_t*>  _children    = {};
};
