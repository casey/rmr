'use strict';

// todo:
//   events:
//     broadcast and emit
//     bind handlers ('randomevent', 'broadcast', 'emit', 'on', 'tick')
//     unbind handlers
//     stop propagation
//     generalized behaviors
//   classes - set of true/false properties
//   crazy slectors:
//     parents
//     filter

define(function(require) {

var rmr = require('rmr');
var _   = require('_');

require('color');

require('ilk.none/ilk'   );
require('ilk.audible/ilk');
require('ilk.basic/ilk'  );
require('ilk.flat/ilk'   );

// SECTION: CREATION

var node = rmr.node = function Node(opt_name) {
  var x = rmr.new(this, node);
  if (this !== x) return node.apply(x, arguments);

  this._name             = arguments.length > 0 ? opt_name : null;
  this._parent           = null;
  this._children         = [];
  this._hidden           = false;
  this._transform        = rmr.mat4().identity();
  this._data             = null;
  this._birthday         = Date.now();
  this._ticks            = [];
  this._tickNumber       = -1;
  this._lastTickTime     = Date.now();
  this._props            = {};
  this._matrix           = rmr.mat4();
  this._id               = rmr.id();

  // node -> ndc
  // node -> camera
  // node -> world

  // this._ndcMatrix    = rmr.mat4();
  // this._cameraMatrix = rmr.mat4();
  // this._worldMatrix  = rmr.mat4();

  // turn velocity and spin into inherited behaviors
  this._velocity         = rmr.vec3();
  this._spin             = rmr.vec3();

  this.ilk('none');

  //Object.seal(this);

  return this;
};

rmr.ilk.close(node);

node.prototype.toString = function () { rmr.die('node.toString: nonsensical'); };
node.prototype.valueOf = function () { rmr.die('node.valueOf: nonsensical'); };

node.prototype.ilk = function (opt_name) {
  if (arguments.length === 0) {
    return this._ilk;
  }

  this._ilk && this._ilk.destroy(this);

  var ilk = rmr.ilk[opt_name];
  ilk.node.__proto__ === node.prototype || rmr.die('bad');
  this.__proto__ = ilk.node;
  this._ = null;
  ilk.init.call(this);

  return this;
};

node.prototype.homogeneous = function () {
  var name = this.ilk().name();
  return this.all(function (_) { return _.ilk().name() === name});
};

node.prototype.updateMatrix = function (opt_t) {
  var t = opt_t || rmr.mat4.IDENTITY;

  var m = this.matrix();
  t.mult(this.transform(), m);

  var c = this.childCount();
  for (var i = 0; i < c; i++) {
    this.child(i).updateMatrix(m);
  }

  return this;
};

node.prototype.matrix = function (opt_m) {
  if (opt_m) {
    this._matrix.set(opt_m);
    return this;
  }

  return this._matrix;
};

node.prototype.all = function (f) {
  var nodes = [[this]];

  while (nodes.length > 0) {
    var l = nodes.pop();
    for (var i = 0; i < l.length; i++) {
      var node = l[i];
      if (!f(node)) return false;
      if (!node.leaf()) nodes.push(node.children());
    }
  }

  return true;
};

node.prototype.any = function (f) {
  var nodes = [[this]];

  while (nodes.length > 0) {
    var l = nodes.pop();
    for (var i = 0; i < l.length; i++) {
      var node = l[i];
      if (f(node)) return true;
      if (!node.leaf()) nodes.push(node.children());
    }
  }

  return false;
};

node.prototype.tempLineageA = [];
node.prototype.tempLineageB = [];

node.prototype.lowestCommonAncestor = function(that) {
  var thisLineage = this.lineage(this.tempLineageA).reverse();
  var thatLineage = that.lineage(this.tempLineageB).reverse();

  var ancestor = null;

  while (thisLineage[0] === thatLineage[0]) {
    ancestor = thisLineage[0];
    thisLineage.shift();
    thatLineage.shift();

    if (thisLineage.length === 0 || thatLineage.length === 0) {
      break;
    }
  }

  return ancestor;
};

// SECTION: PROPS

// node.prop('hello')    get with no default value
// node.prop('hello', 1) set value 1
// node.prop('hello', 1) get value with default
// node.prop('hello', 1) get value with default, set if not present
// prop delete

node.prototype.prop = function (name, value) {
  if (arguments.length === 0) {
    rmr.die('node.prop: requires at least one argument');
  } else if (arguments.length === 1) {
    this.hasProp(name) || rmr.die('node.prop: unset property requested: ' + name);
    return this._props[name];
  } 

  this._props[name] = value;
  return this;
};

node.prototype.hasProp = function (name) {
  return this._props.hasOwnProperty(name);
};

node.prototype.deleteProp = function (name) {
  this.hasProp(name) || rmr.die('node.deleteProp: called on non-existent prop: ' + name);
  delete this._props[name];
  return this;
};

node.prototype.getProp = function (name, opt_default) {
  if (this.hasProp(name)) {
    return this.prop(name);
  }
  return opt_default;
};

node.prototype.bindProp = function (name) {
  return this.prop(name).bind(this);
};

node.prototype.callProp = function (name) {
  var p = this.prop(name);
  typeof p === "function" || rmr.die('node.callProp: tried to call non-function prop: ' + name);

  var result;
  if (arguments.length === 1) {
    result = p.call(this);
  } else {
    arguments[0] = this;
    result = p.call.apply(p, arguments);
  }

  return result === undefined ? this : result; // this is probably too clever for my own good
};

node.prototype.getPropSetDefault = function (name, opt_default) {
  if (this.hasProp(name)) {
    return this.prop(name);
  }

  this.prop(name, opt_default);

  return opt_default;
};

node.prototype.props = function (opt_props) {
  if (opt_props) {
    this._props = _.clone(opt_props);
    return this;
  }

  return this._props;
};

node.prototype.clearProps = function () {
  this._props = {};
  return this;
};

// SECTION: NAME & FIND

node.prototype.name = function(opt_name) {
  if (arguments.length > 0) {
    this._name = opt_name;
    return this;
  } else {
    return this._name;
  }
};

node.prototype.find = function(name) {
  if (this.name() === name) {
    return this;
  }

  for (var i = 0; i < this.childCount(); i++) {
    var found = this.child(i).find(name);
    if (found) return found;
  }

  return null;
};

node.prototype.findAll = function(name) {
  var results = [];

  if (this.name() === name) {
    results.push(this);
  }

  for (var i = 0; i < this.childCount(); i++) {
    results = results.concat(this.child(i).findAll(name));
  }

  return results;
};


node.prototype.ancestor = function(name) {
  var current = this;

  while (current = current.parent()) {
    if (current.name() === name) return current;
  }

  return null;
};

node.prototype.clone = function(opt_name) {
  if (this.parent()) {
    var sibling = this.parent().spawn();
  } else {
    var sibling = new node();
  }

  sibling.name       (opt_name !== undefined ? opt_name : this.name())
         .data       (this.data        ())
         .transform  (this.transform   ())
         .hidden     (this.hidden      ())
         .ticks      (this.ticks       ())
         .children   (this.children().map(function(child) {
             return child.clone();
         }));

  this.ilk().clone.call(this, sibling);

  return sibling;
};


node.prototype.spawn = function(opt_name) {
  // should anything really be inherited?

  var child = arguments.length === 0 ? node() : node(opt_name);

  child.parent(this).ilk(this.ilk().name());

  this.ilk().spawn.call(this, child);

  return child;
};

// SECTION: TREE

node.prototype.parent = function(opt_parent) {
  if (arguments.length > 0) {
    this.orphan();

    if (opt_parent) {
      opt_parent.adopt(this);
    }

    return this;
  }

  return this._parent;
};

node.prototype.children = function (opt_replacements) {
  if (arguments.length > 0) {
    while(this.childCount() > 0) {
      this.child(0).orphan();
    }

    for (var i = 0; i < opt_replacements.length; i++) {
      this.adopt(opt_replacements[i]);
    }
  
    return this;
  }

  return this._children;
};

node.prototype.childNames = function() {
  return this._children.map(function (child) { return child.name(); });
};

node.prototype.childCount = function() {
  return this._children.length;
};

node.prototype.orphan = function () {
  if (this.parent()) {
    var siblings = this.parent().children();
    siblings.splice(siblings.indexOf(this), 1);
  }

  this._parent = null;

  // this._scope.__proto__ = null;

  return this;
};

node.prototype.adopt = function (child) {
  child.orphan();

  child._parent = this;
  this.children().push(child);

  /*
     // this is probably crazy:
     child._scope.__proto__ = this._scope;
     child._scope.__proto__ = child.parent().scope();

     // also need to clear the scope every time ilk changes
  */

  return this;
};

node.prototype.child = function(i, opt_replacement) {
  var children = this.children();

  (i < children.length && i >= 0) || rmr.die('node.child: bad index: ' + i);

  if (opt_replacement) {
    children[i] = opt_replacement;
    return this;
  } else {
    return children[i];
  }
};

node.prototype.root = function() {
  if (!this.parent()) {
    return this;
  } else {
    return this.parent().root();
  }
};

node.prototype.lineage = function(opt_dest) {
  opt_dest || rmr.garbageAllowed() || rmr.die('rmr.lineage: garbage disallowed');
  var lineage = opt_dest || [];
  lineage.length = 0;
    
  var current = this;

  while(current) {
    lineage.push(current);
    current = current.parent();
  }

  return lineage;
};

node.prototype.height = function() {
  var max = 0;

  var children = this.children();

  for (var i = 0; i < children.length; i++) {
    max = Math.max(children[i].height() + 1, max);
  }

  return max;
};

node.prototype.depth = function() {
  return this.lineage().length - 1;
};

node.prototype.id = function() {
  return this._id;
};

node.prototype.transform = function() {
  if (arguments.length > 0) {
    this._transform.set(arguments[0]);
    return this;
  }
  return this._transform;
};


node.prototype.clearTransform = function() {
  this._transform.identity();
  return this;
};

node.prototype.invertTransform = function() {
  this.transform().invert();
  return this;
}

node.prototype.applyTransform = function(x) {
  this.transform().mult(x);
  return this;
};


node.prototype.lookAt = function(eye, target, up) {
  this.transform(rmr.mat4.lookAt(eye, target, up)).invertTransform();
  return this;
};

node.prototype.translate = function(x, y, z) {
  this.transform().translate.apply(this.transform(), arguments);
  return this;
};

node.prototype.translatev = function (v) {
  v.assertVec3();
  return this.translate(v[0], v[1], v[2]);
};

node.prototype.translateX = function(s) { return this.translate(s, 0, 0); }
node.prototype.translateY = function(s) { return this.translate(0, s, 0); }
node.prototype.translateZ = function(s) { return this.translate(0, 0, s); }

node.prototype.setTranslation = function(x, y, z) {
  this.transform().setTranslation(x, y, z);
  return this;
};

node.prototype.setTranslationv = function (v) {
  return this.setTranslation(v[0], v[1], v[2]);
};

node.prototype.getTranslation = function(opt_dest) {
  return this.transform().getTranslation(opt_dest);
};

node.prototype.preTranslate = function() {
  if (arguments.length === 1) {
    var v = arguments[0];
  } else {
    var v = arguments;
  }

  goog.vec.Mat4.multMat(
    goog.vec.Mat4.makeTransate(rmr.mat4(), v[0], v[1], v[2]),
    this.transform(),
    this.transform());

  return this;
};


node.prototype.scale = function(s_or_x, opt_y, opt_z) {
  this.transform().scale.apply(this.transform(), arguments);
  return this;
};

node.prototype.scale = function (x, y, z) {
  if (arguments.length === 3) {
    this.transform().scaleMat(x, y, z);
  } else {
    this.transform().scaleMat(x, x, x);
  };
  return this;
};

node.prototype.scalev = function (v) {
  this.scale(v[0], v[1], v[2]);
  return this;
};

node.prototype.rotate = function(theta, x, y, z) {
  var t = this.transform();
  t.rotate.apply(t, arguments);
  return this;
};


node.prototype.rotateX = function(angle) { this._transform.rotateX(angle); return this; };
node.prototype.rotateY = function(angle) { this._transform.rotateY(angle); return this; };
node.prototype.rotateZ = function(angle) { this._transform.rotateZ(angle); return this; };

node.prototype.rotateZXZ = function(v_or_zTheta1, xTheta, zTheta2) {
  var t = this.transform();
  t.rotateZXZ.apply(t, arguments);
  return this;
};

node.prototype.forEach = function(f) {
  f.call(this, this);
  this.forEachChild(function () { this.forEach(f); });
  return this;
};

node.prototype.forEachChild = function(f) {
  for (var i = 0; i < this.childCount(); i++)
    f.call(this.child(i), this.child(i));
  return this;
};

node.prototype.tree = function(indent) {
  indent = indent || 0;

  var name = this.name();

  console.log(new Array(indent + 1).join(' ') + (name === null ? 'id: ' + this.id() : name));

  this.forEachChild(function () {
    this.tree(indent + 3);
  });

  return this;
};

node.prototype.iterate = function(n, f) {
  var current = this;

  for (var i = 0; i < n; i++) {
    var result = f.call(current, current, n, i);

    if (result) {
      current = result;
    }
  }

  return current;
};


// SECTION: VERIFICATION


node.prototype.verify = function() {

  for (var i = 0; i < this.childCount(); i++) {
    if (this.child(i).parent() !== this) {
      console.error('verify: child parent not this');
    }
  }

  if (this.parent() && this.parent().children().indexOf(this) === -1) {
    console.error('verify: this not in parents children ');
  }

  this.ilk().verify.call(this);
};


node.prototype.verifyTree = function(opt_recursing) {
  if (!opt_recursing) {
    // if there's an upward loop, root() will hang
    this.root();
  }

  this.verify();

  for (var i = 0; i < this.childCount(); i++) {
    this.child(i).verifyTree(true);
  }
};

node.prototype.filterToArray = function(f) {
  var results = [];

  if (f.call(this, this)) {
    results.push(this);
  }

  for (var i = 0; i < this.childCount(); i++) {
    results = results.concat(this.child(i).filterToArray(f));
  }

  return results;
};

// SECTION: BIRTHDAY


node.prototype.birthday = function(birthday) {
  if (arguments.length > 0) {
    rmr.assert(this._birthday >= 0);
    this._birthday = birthday;
    return this;
  }

  return this._birthday;
};



// SECTION: DATA


node.prototype.data = function(data) {
  if (arguments.length > 0) {
    this._data = data;
    return this;
  }

  return this._data;
};

node.prototype.setDefaultData = function(opt_default) {
  if (this.data() === null) {
    this.data(arguments.length > 0 ? opt_default : {});
  }

  return this;
};

// SECTION: VELOCITY

node.prototype.velocity = function () {
  if (arguments.length === 0) {
    return this._velocity;
  }

  this._velocity.set.apply(this._velocity, arguments);

  return this;
};

// SECTION: SPIN

node.prototype.spin = function () {
  if (arguments.length === 0) {
    return this._spin;
  }

  this._spin.set.apply(this._spin, arguments);

  return this;
};

// SECTION: TICKING

node.prototype.ticks = function(opt_replacements) {
  if (arguments.length > 0) {
    this._ticks.length = opt_replacements.length;

    for (var i = 0; i < this._ticks.length; i++) {
      this._ticks[i] = opt_replacements[i];
    }

    return this;
  }

  return this._ticks;
};

node.prototype.chainTick = function(f) {
  this._ticks.push(f);
  return this;
};

node.prototype.clearTicks = function () {
  this._ticks.length = 0;
};

node.prototype.scaledVelocity = rmr.vec3();
node.prototype.t2 = rmr.vec3();

node.prototype.tick = function (now) {
  var dt = now - this._lastTickTime;

  var ticks = this._ticks;

  for (var i = 0; i < ticks.length; i++) {
    var done = ticks[i].call(this, this, now, dt);

    if (done === true) {
      ticks.splice(i, 1);
      i--;
    }
  }

  this._lastTickTime = now;
  this._tickNumber++;

  return this;
};

node.prototype.tickTree = function(opt_now) {
  var now = arguments.length > 0 ? opt_now : Date.now();

  var lists = [[this]];

  for (var i = 0; i < lists.length; i++) {
    var list = lists[i];

    for (var j = 0; j < list.length; j++) {
      var node = list[j];
      node.tick(now);
      lists.push(node._children);
    }
  }

  return this;
};

node.prototype.chainDriver = function () {
  var lastPosition = {x: 0, y: 0};
  var delta        = {x: 0, y: 0};

  $(document).mousemove(function(e) {
    if (rmr.key.mouse_left.down()) {
      delta.x += lastPosition.x - e.pageX;
      delta.y += lastPosition.y - e.pageY;
    }

    lastPosition.x = e.pageX;
    lastPosition.y = e.pageY;

    e.preventDefault();
  });

  $(document).mousedown(function(e) {
    e.preventDefault();
  });

  this.chainTick(function (_, now, dt) {
    var speedFactor = dt * 0.01 * (rmr.key.alt.down() ? 0.1 : rmr.key.shift.down() ? 10 : 1);

    var rotationSpeed = 0.005 * speedFactor;
    var movementSpeed = 1 * speedFactor;

    if (rmr.key.w.down()) this.translate(0, 0, -movementSpeed);
    if (rmr.key.s.down()) this.translate(0, 0, movementSpeed);
    if (rmr.key.a.down()) this.translate(-movementSpeed, 0, 0);
    if (rmr.key.d.down()) this.translate(movementSpeed, 0, 0);
    if (rmr.key.c.down()) this.translate(0, -movementSpeed, 0);
    if (rmr.key.e.down()) this.translate(0, movementSpeed, 0);

    if (rmr.key.up   .down()) this.rotateX(rotationSpeed);
    if (rmr.key.down .down()) this.rotateX(-rotationSpeed);
    if (rmr.key.left .down()) this.rotateY(rotationSpeed);
    if (rmr.key.right.down()) this.rotateY(-rotationSpeed);

    this.rotateY(-delta.x / 1000);
    this.rotateX(-delta.y / 1000);

    delta.x = delta.y = 0;
  });

  return this;
};

// SECTION: SHOW & HIDE


node.prototype.hidden = function(hidden) {
  if (arguments.length > 0) {
    this._hidden = !!hidden;
    return this;
  }

  return this._hidden;
};

node.prototype.hide = function() { return this.hidden(true ); };
node.prototype.show = function() { return this.hidden(false); };

node.prototype.leaf = function() {
  return this.childCount() === 0;
};


node.prototype.tempUp          = rmr.mat4();
node.prototype.tempDown        = rmr.mat4();
node.prototype.tempInverse     = rmr.mat4();
node.prototype.tempTransformed = rmr.vec3();
node.prototype.tempColor       = rmr.color();

node.prototype.basisChangeTo = function(dest, opt_mat) {
  // todo: 
  //   only two inverses?
  //   no garbage?
  //   nodes in different trees?

  // Get the ancestor of both nodes.
  var ancestor = this.lowestCommonAncestor(dest);

  var up = this.tempUp.identity();
   
  var current;

  // Walk from node to the ancestor, multiplying in transforms as we go.
  current = dest;
  while (current !== ancestor) {
    current.transform().mult(up, up);
    current = current.parent();
  }

  // Now walk from this node to the ancestor, right multiplying inverse
  // transformations as we go. We need to do this into a separate matrix,
  // so that the two transforms can be combined in the right order.
  var inverse = this.tempInverse;
  var down = this.tempDown.identity();
  current = this;
  while (current !== ancestor) {
    current.transform().invert(inverse);
    inverse.mult(down, down);
    current = current.parent();
  }

  return down.mult(up, opt_mat || rmr.mat4());
};

rmr.unenumerate(node.prototype);

Object.freeze(node);
Object.freeze(node.prototype);

return rmr;
});
