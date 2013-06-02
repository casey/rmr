'use strict';

define(function(require) {
var rmr    = require('rmr');
var _      = require('_');

require('glod');

rmr.glod.preprocess(require('text!./flat.basic.glsl'));

var flat = rmr.ilk('flat');

flat.init = function () {
  this._ = {};
  this._.vertices       = [];
  this._.array          = null;
  this._.program        = null;
  this._.primitive      = null;
  this._.allocatedGlods = [];
  this._.pack           = [this.id()];
  this._.version        = 0;
  this._.values         = Object.create(null);
};

flat.destroy = function (node) {
  for (var i = 0; i < node._.allocatedGlods; i++) {
    node._.allocatedGlods[i].deleteVBO(node.id());
  }
};

flat.clone = function (sibling) {
  sibling.vertices(this.vertices());
};

flat.render = function (glod, nodes) {
  var gl   = glod.gl();

  nodes.sort(function (a, b) { 
    var ap = a.program();
    var bp = b.program();
    return ap < bp ? -1 :
           ap > bp ?  1 :
                      0 ;
  });

  for (var i = 0; i < nodes.length; i++) {
    var node     = nodes[i];
    var vertices = node._.vertices;
    var id       = node.id();

    if (vertices.length === 0) {
      continue;
    }

    if (!node._.array) {
      node._.array = new Float32Array(vertices);
    }

    glod.init(id, function () {
      glod.createVBO(id);
      node._.allocatedGlods.push(glod);
    });

    glod.allocv(id, node._.version, function () {
      var a = rmr.stack.main.alloc(Float32Array, vertices.length);
      a.set(vertices);
      glod.bindArrayBuffer(id);
      gl.bufferData(gl.ARRAY_BUFFER, a, gl.STATIC_DRAW);
      rmr.stack.main.free(a);
    });

    var program = node.program();
    glod.hasProgram(program) || glod.createProgram(program);

    glod
    .begin(program)
    .pack.apply(glod, node._.pack)
    .valuev('transform', node.matrix())

    var values = node._.values;
    for (var name in values) {
      glod.valuev(name, values[name]);
    }

    glod
    .ready()
    .primitive(node.primitive())
    .drawArrays(0, vertices.length / ((node._.pack.length - 1) * 4))
    .end();
  }
};

flat.node.pack = function () {
  this._.pack.length = arguments.length + 1;
  for (var i = 0; i < arguments.length; i++) {
    this._.pack[i + 1] = arguments[i];
  }
  return this;
};

flat.node.vertices = function(vertices) {
  if (arguments.length > 0) {
    this._.vertices.length = vertices.length;
    for (var i = 0; i < vertices.length; i++) {
      this._.vertices[i] = vertices[i];
    }
    return this;
  }

  return this._.vertices;
};

flat.node.points        = function () { return this.primitive(0); };
flat.node.lines         = function () { return this.primitive(1); };
flat.node.lineLoop      = function () { return this.primitive(2); };
flat.node.lineStrip     = function () { return this.primitive(3); };
flat.node.triangles     = function () { return this.primitive(4); };
flat.node.triangleStrip = function () { return this.primitive(5); };
flat.node.triangleFan   = function () { return this.primitive(6); };

flat.node.primitive = function (opt_p) {
  if (arguments.length > 0) {
    if (!(opt_p >= 0 && opt_p <= 6)) {
      rmr.die('flat.primitive: bad primitive: ' + opt_p);
    }
    this._.primitive = opt_p;
    return this;
  }

  var p = this._.primitive;
  p === null && rmr.die('flat.primitive: primitive unset: ' + p);
  return p;
};

flat.node.program = function (opt_name) {
  if (arguments.length === 0) {
    this._.program !== null || rmr.die('flat.program: program unset');
    return this._.program;
  }

  opt_name || rmr.die('flat.program: bad name: ' + opt_name);
  this._.program = opt_name;
  return this;
};

flat.node.valuev = function (name, s) {
  var values = this._.values;
  var value = values[name];

  if (!value) {
    value = values[name] = [];
  }

  value.length = s.length;

  for (var i = 0; i < s.length; i++) {
    value[i] = s[i];
  }

  return this;
};

flat.node.value = function (name) {
  var values = this._.values;
  var value = values[name];

  if (arguments.length === 1) {
    value || rmr.die('flat.value: unknown value: ' + name);
    return value;
  }

  if (arguments[1] === undefined) {
    delete this._.values[name];
    return this;
  }

  if (!value) {
    value = values[name] = [];
  }

  var count = arguments.length - 1;

  value.length = count;

  for (var i = 0; i < count; i++) {
    value[i] = arguments[i + 1];
  }

  return this;
};

flat.node.upload = function () {
  this._.version++;
  return this;
};

flat.node.void = function () {
  this.ilk('none');
  return this;
};

Object.seal(flat);

});
