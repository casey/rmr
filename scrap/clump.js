
// SECTION: SUBCLUMPS

/*
    children: array, have numbers
    clumps:   object, have names

    clumps must be named
    children don't have names

    option 1.
    give children names
    children are stored in dict instead of an array
    can access children by name knot.child('hello')

    option 2.
    store clumps in array
    clumps no longer have names
    can enumerate clumps
    if you want to get a named clump, you have to do a dynamic lookup
    keep reference to default clump

    default clump is first in clump array, can't be deleted or spliced out, can be replaced
    default clump is whatever is first in clump array, might be fucked if you change it
    default clump is stored with a special reference
    default clump is not enumerated with other clumps

    mergeUp - transform clumps by default clump transformation, add to parent, orphan this
              default clump transformation of children is transformed by default clump transformation of this

    pullUp  - mergeUp all children

    fuseClumps - merges all/some clumps into one/default clump

    option 3.
    leave it the way it is
    children are accessed by index, clumps by name

    must be able to keep track of and persist default clump

    must be able to create arbitrary number of anonymous clumps
    must be able to create arbitrary number of anonymous children

    must be able to create and retrieve named clump
    must be able to create and retrieve named child
*/

knot.prototype.default = function(opt_replacement) {
  if(arguments.length === 0) {
    return this._default.wrap(this);
  }

  this._default = opt_replacement.unwrap();
  return this;
};

knot.prototype.clump = function(opt_n, opt_replacement) {
  if (arguments.length === 0) {
    return this.default();
  } else if(arguments.length === 1) {
    return this._clumps[opt_n].wrap(this);
  } else {
    this._clumps[opt_n] = opt_replacement.unwrap();
    return this;
  }
};

knot.prototype.clumps = function() {
  // return or replace clumps
};
// functions on knot apply to default clump
// clump(opt_name) returns proxy clump
// proxy has special function knot() to return to originating knot
// default clump properties are treated specially
//    hidden        hides entire knot and subtree
//    transform     used as knot transform
//    cardinality   used as default for children, new clumps?
//    size          used as default for children, new clumps? inherited?
//    color         ?
//    colorFunction ?
// clump names are just for convenience, or don't exist at all

/*
k.clump('p').type(0).cube()
k.clump().type(1).cube().knot()
*/

/*
  o._clumps = {};

  o.clump('hello')

  // create clump with name
  // create clump with no name (default clumps)
  // set clump primatives
  // special nameless clump which other clumps inherit properties from

  // need to get back to knot from clump
  //   clump knows the name of its knot. each clump belongs to one knot
  //   clump functions exposed on knot, just set 'active' clump and then call functions
  //   clump() returns a proxy to a clump, which points to a real clump as well as the knot it came from

  // color blending

  // color
  // color function
  // hidden
  // size
  // transform

  // each clump is a tree of clumps?

  // clump._vertices      = []
  // clump._cardinality   = 1,2,3
  // clump._color         = 'red', null
  // clump._colorFunction = null
  // clump._hidden        = false
  // clump._size          = 1 (point size, line width)
  // shape functions, like cube, etc
  //
  // sprite clump?
  // clump transform?
  // clumps are immutable, to enable non-suprising sharing?
  // merge up adds the soon to be deleted nodes transform to the clump transforms
  // two clumps can be fused if they're the same cardinality
  // all mutable properties of clumps are copy on write, allowing sharing

  // immutable clumps share:
  // colors
  // vertices
*/

  o._clumps           = [];
  o._default          = clump();
for(var key in clump.prototype) {
  if (!clump.prototype.hasOwnProperty(key)) {
    continue;
  }

  if (proxy.prototype[key]) {
    rmr.log('proxy.prototype already has key: ' + key);
  }

  if (knot.prototype[key]) {
    rmr.log('knot.prototype already has key: ' + key);
  }

  Object.defineProperty(knot.prototype, key, {
    value:        defaultClumpProxyMethod(key),
    enumerable:   false,
    writable:     false,
    configurable: false
  });

  Object.defineProperty(proxy.prototype, key, {
    value:        proxyMethod(key),
    enumerable:   false,
    writable:     false,
    configurable: false
  });
};

clump.prototype.wrap = function (knot) {
  return proxy(this, knot);
};

clump.prototype.unwrap = function () {
  return this;
};

proxy.prototype.unwrap = function () {
  var unwrapped = this._clump;
  rmr.assert(!proxy.prototype.isPrototypeOf(unwrapped));
  rmr.assert(clump.prototype.isPrototypeOf(unwrapped));
  return unwrapped;
};
// SECTION: CLUMPS

var clump = knot.clump = function Clump(opt_name) {
  var o = rmr.new(this, clump);

  o._name          = opt_name || null;
  o._hidden        = null;
  o._cardinality   = null;
  o._transform     = null;
  o._size          = null;
  o._color         = null;
  o._colorFunction = null;
  o._sprite        = null;
  o._spriteSource  = null;
  o._vertices      = null;

  Object.seal(o);

  return o;
};

clump.prototype.name = function (name) {
  if (arguments.length > 0) {
    this._name = name;
    return this;
  } else {
    return this._name;
  }
}

clump.prototype.size = function (n) {
  if (arguments.length === 1) {
    this._size = n;
    return this;
  }
  return this._size;
};

rmr.unenumerate(clump.prototype);
Object.freeze(clump);
Object.freeze(clump.prototype);
