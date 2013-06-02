'use strict';

define(function(require) {
var rmr    = require('rmr');

require('color');
require('glod');

rmr.glod.preprocess(require('text!./basic.glsl'));

var basic = rmr.ilk('basic');

basic._stride         = null;
basic._vboCardinality = null;
basic._index          = null;
basic._uploaded       = null;
basic._lineWidth      = null;
basic._tempColor      = rmr.color();

basic._bufferSize    = rmr.KB * 128;
basic._vboSize       = basic._bufferSize * 32;
basic._buffer        = new ArrayBuffer(basic._bufferSize);
basic._array         = new Float32Array(basic._buffer);

basic.init = function () {
  this._ = {};
  this._.vertices = [];

  this._.color            = rmr.vec4(1.0, 1.0, 1.0, 1.0);
  this._.colors           = [];
  this._.colorFunction    = null;
  this._.cardinality      = 1;
  this._.pointSize        = 1;
  this._.lineWidth        = 1;
  this._.sprite           = null;
  this._.spriteSource     = null;
};

basic.clone = function (sibling) {
  sibling.cardinality  (this.cardinality  ())
         .lineWidth    (this.lineWidth    ())
         .pointSize    (this.pointSize    ())
         .sprite       (this.sprite       ())
         .vertices     (this.vertices     ())
         .color        (this.color        ())
         .colorFunction(this.colorFunction());
};

basic.spawn = function (child) {
  child.cardinality  (this.cardinality  ())
       .pointSize    (this.pointSize    ())
       .lineWidth    (this.lineWidth    ())
       .color        (this.color        ())
       .colorFunction(this.colorFunction());
};

basic.verify = function() {
  rmr.color.verify(this.color());

  var cardinality = this.cardinality();
  if (!(cardinality >= 0 && cardinality <= 3)) {
    rmr.error('verify: bad cardinality:', cardinality);
  }

  if (this.floatCount() % this.stride() !== 0) {
    rmr.error('verify: this.floatCount() % this.getStride() !== 0', this.floatCount(), this.getStride());
  }
};


basic.render = function (glod, nodes) {
  var gl   = glod.gl();

  glod.hasProgram('basic') || glod.createProgram('basic');

  if (!glod.hasVBO('main')) {
    glod.createVBO('main');
    gl.bindBuffer(gl.ARRAY_BUFFER, glod.vbo('main'));
    gl.bufferData(gl.ARRAY_BUFFER, this._vboSize, gl.STATIC_DRAW);
  }

  glod.begin('basic')
      .pack('main', 'position', 'color', 'tc0', 'tc1', 'tc2', 'tc3', 'misc')
      .ready()

  this._stride    = 7 * 4;
  this._index     = 0;
  this._uploaded  = 0;
  this._lineWidth = null;

  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    this.buffer(glod, node, node.matrix());
  }

  this.upload(glod, true);

  glod.end();
};

basic.buffer = function(glod, node, mvp) {
  var vertices     = node._.vertices;
  var vertexLength = vertices.length;

  if (vertexLength === 0) {
    return;
  }

  var array        = this._array;
  var stride       = this._stride;
  var l            = array.length;
  var pointSize    = node.pointSize();
  var lineWidth    = node.lineWidth();
  var cardinality  = node.cardinality();

  if ((vertexLength / 3) % cardinality !== 0) {
    rmr.log('bad');
  }

  var colorFunction = node.colorFunction();
  var nodeColor     = node.color();
  var tempColor     = this._tempColor;
  var colors        = node._.colors;
  var colorCount    = colors.length / 4;

  if (this._vboCardinality !== cardinality || (this._vboCardinality === 2 || this._lineWidth !== lineWidth)) {
    basic.upload(glod, true);
  }

  this._vboCardinality = cardinality;
  this._lineWidth      = lineWidth;

  var m0  = mvp[ 0];  var m1  = mvp[ 1]; var m2  = mvp[ 2]; var  m3 = mvp[ 3];
  var m4  = mvp[ 4];  var m5  = mvp[ 5]; var m6  = mvp[ 6]; var  m7 = mvp[ 7];
  var m8  = mvp[ 8];  var m9  = mvp[ 9]; var m10 = mvp[10]; var m11 = mvp[11];
  var m12 = mvp[12];  var m13 = mvp[13]; var m14 = mvp[14]; var m15 = mvp[15];

  var index = this._index;
  for (var vi = 0; vi < vertexLength; vi += 3) {
    var i = vi / 3;
    if (index + stride > l) {
      this._index = index;
      this.upload(glod);
      index = this._index;
    }
   
    if (colorFunction) {
      colorFunction.call(node, node, i, tempColor);
      var r = tempColor[0]; var g = tempColor[1]; var b = tempColor[2]; var a = tempColor[3];
    } else if (i < colorCount) {
      var r = colors[i * 4 + 0];
      var g = colors[i * 4 + 1];
      var b = colors[i * 4 + 2];
      var a = colors[i * 4 + 3];
    } else {
      var r = nodeColor[0]; var g = nodeColor[1]; var b = nodeColor[2]; var a = nodeColor[3];
    }

    var x = vertices[vi + 0]; var y = vertices[vi + 1]; var z = vertices[vi + 2];

    array[index +  0] = x;   array[index +  1] = y;   array[index +  2] = z;   array[index +  3] = 1.0;

    array[index +  4] = r;   array[index +  5] = g;   array[index +  6] = b;   array[index +  7] = a;

    array[index +  8] = m0;  array[index +  9] = m1;  array[index + 10] = m2;  array[index + 11] = m3;
    array[index + 12] = m4;  array[index + 13] = m5;  array[index + 14] = m6;  array[index + 15] = m7;
    array[index + 16] = m8;  array[index + 17] = m9;  array[index + 18] = m10; array[index + 19] = m11;
    array[index + 20] = m12; array[index + 21] = m13; array[index + 22] = m14; array[index + 23] = m15;

    // misc
    array[index + 24] = 1.0;
    array[index + 25] = 1.0; // misc
    array[index + 26] = 1.0; // misc
    array[index + 27] = pointSize; // misc

    index += stride;
  }
  this._index = index;
};

basic.upload = function (glod, opt_force) {
  var gl = glod.gl();

  if (this._index > 0) {
    var sub = this._array.subarray(0, this._index);
    gl.bufferSubData(gl.ARRAY_BUFFER, this._uploaded, sub);
    this._uploaded += this._index * Float32Array.BYTES_PER_ELEMENT;
    this._index = 0;
  }

  if (this._uploaded > 0 && (opt_force || ((this._uploaded + this._bufferSize) > this._vboSize))) {
    var vertices = this._uploaded / (this._stride * Float32Array.BYTES_PER_ELEMENT);
    var c = this._vboCardinality;
    var primitive = c === 1 ? gl.POINTS    :
                    c === 2 ? gl.LINES     :
                    c === 3 ? gl.TRIANGLES :
                    rmr.die('bad cardinality: ', c);

    if (c === 2) {
      gl.lineWidth(this._lineWidth);
    }

    gl.drawArrays(primitive, 0, vertices);
    this._uploaded = 0;
  }
};

basic.node.pointCube = function(n) {
  this.cardinality() === 1 || rmr.die("node.pointCube: probably doesn't make sense for triangles and lines");

  for (var i = 0; i < n; i++) {
    this.pushVertex(
      (Math.random() - .5) * 2,
      (Math.random() - .5) * 2,
      (Math.random() - .5) * 2);
  }

  return this;
};

basic.node.point = function() {
  this.vertices().push(0, 0, 0);
  return this;
};

basic.node.line = function() {
  this.vertices().push(-.5, 0, 0,
                      .5, 0, 0);
  return this;
};

basic.node.strip = function(points) {
  if (this.isPoints()) {
    this.pushVertices(points);
  } if (this.isLines()) {
    for (var i = 0; i + 5 < points.length; i += 3) {
      this.vertices.push(points[i + 0], points[i + 1], points[i + 2],
                         points[i + 3], points[i + 4], points[i + 5]);
    }
  } else {
    rmr.error('strip: doesn\'t make sense for triangles, or does it?');
  }

  return this;
};

basic.node.flatten = function() {
  var v  = rmr.vec3();
  var q  = [];
  var tc = rmr.color();

  // todo:
  //   should I skip hidden nodes?
  //   handle cardinality
  return function () {
    this.homogeneous() || rmr.die('basic.node.flatten: cannot flatten a non-homogeneous tree');
    var rootCardinality = this.cardinality();
    this.forEach(function () {
      var nodeCardinality = this.cardinality();
      if (nodeCardinality !== rootCardinality) {
        rmr.die('basic.node.flatten: cardinality mismatch: root: ' + rootCardinality + ' node: ' + nodeCardinality);
      }
    });

    var dest = [];

    q.push([this]);

    for (var i = 0; i < this.childCount(); i++) {
      this.child(i).updateMatrix();
    }

    while (q.length > 0) {
      var l = q.pop();
      for (var i = 0; i < l.length; i++) {
        var node     = l[i];
        var vertices = node.vertices();
        var vc       = node.vertexCount();
        var m        = node.matrix();
        var f        = node.colorFunction();
        var c        = f ? tc : node.color();

        for (var j = 0; j < vc; j++) {
          node.vertex(j, v);
          if (node !== this) {
            m.mult(v, v);
          }
          if (f) {
            f.call(node, node, j, c);
          }
          dest.push(v[0], v[1], v[2], 1.0, c[0], c[1], c[2], c[3]); // todo: why is w always 1?
        }

        q.push(node.children());
      }
    }

    this.ilk('flat').children([])._.vertices = dest;
    this.primitive(rmr.gl.primitiveForCardinality(rootCardinality))
        .program('flat.basic')
        .pack('position', 'color')

    return this;
  };
}();

basic.node.mergeUp = function() {
  var parent = this.parent();

  if (!parent) {
    rmr.log('margeUp: no parent!');
    return this;
  }

  if (this.cardinality() !== parent.cardinality()) {
    rmr.die('node.mergeUp: cardinality mismatch');
    return this;
  }

  var v = this.tempTransformed;
  var c = this.color();

  for (var i = 0; i < this.vertexCount(); i++) {
    this.vertex(i, v);
    this.transform().mult(v);

    parent.pushVertex(v);
  }

  // todo:
  //   actually needs to merge the transform into every child

  this.orphan();

  return parent;
};

basic.node.pullUp = function(preserveColor) {
  while(this.childCount() > 0) {
    this.child(0).mergeUp(preserveColor);
  }

  return this;
};

// SECTION: GEOMETRY


basic.node.square = function() {
  return this.face([
    -.5,  .5, 0,
     .5,  .5, 0,
     .5, -.5, 0,
    -.5, -.5, 0
  ]);
};


basic.node.flatArrowModel = require('text!./flat_arrow.obj');
basic.node.boxArrowModel  = require('text!./box_arrow.obj'  );

basic.node.flatArrow = function() { return this.loadObj(this.flatArrowModel); };
basic.node.boxArrow  = function() { return this.loadObj(this.boxArrowModel ); };


basic.node.axes = function() {
  this.spawn('x').color([1, 0, 0, 1]).boxArrow();

  this.spawn('y').color([0, 1, 0, 1])
      .spawn().boxArrow().rotateZ(Math.PI / 2).mergeUp();

  this.spawn('z').color([0, 0, 1, 1])
      .spawn().boxArrow().rotateY(-Math.PI / 2).mergeUp();

  this.spawn('origin').color([1, 1, 1, 1])
      .spawn().cube().scale(0.1).mergeUp();

  return this;
};

basic.node.cube = function(opt_size) {
  var size = arguments.length > 0 ? opt_size : 1;
  return this.cuboid(opt_size, opt_size, opt_size);
};


basic.node.cuboid = function() {
  var v = arguments.length === 1 ? arguments[0] : arguments;

  var x = v[0];
  var y = v[1];
  var z = v[2];
  
  var width  = _.isNumber(x) ? x : 1;
  var height = _.isNumber(y) ? y : width;
  var depth  = _.isNumber(z) ? z : width;

  // Half extents:
  var hw = width / 2;
  var hh = height / 2;
  var hd = depth / 2;

  // front
  this.face([hw, hh, hd, -hw, hh, hd, -hw, -hh, hd, hw, -hh, hd]);

  // right
  this.face([hw, hh, -hd, hw, hh, hd, hw, -hh, hd, hw, -hh, -hd]);

  // back
  this.face([-hw, hh, -hd, hw, hh, -hd, hw, -hh, -hd, -hw, -hh, -hd]);

  // left
  this.face([-hw, hh, hd, -hw, hh, -hd, -hw, -hh, -hd, -hw, -hh, hd]);

  // top
  this.face([hw, hh, -hd, -hw, hh, -hd, -hw, hh, hd, hw, hh, hd]);

  // bottom
  this.face([hw, -hh, hd, -hw, -hh, hd, -hw, -hh, -hd, hw, -hh, -hd]);

  return this;
};


basic.node.sphericalToX = function(rho, phi, theta) { return rho * Math.sin(theta) * Math.cos(phi); };
basic.node.sphericalToY = function(rho, phi, theta) { return rho * Math.cos(theta);                 };
basic.node.sphericalToZ = function(rho, phi, theta) { return rho * Math.sin(theta) * Math.sin(phi); };


basic.node.sphere = function(opt_slices, opt_wedges) {
  var slices = opt_slices ? opt_slices : 20;
  var wedges = opt_wedges ? opt_wedges : 20;

  for (var slice = 0; slice < slices; slice++) {
    // lower and upper are phi, and vary between 0 and PI
    var lower = (slice / slices) * Math.PI;
    var upper = ((slice + 1) / slices) * Math.PI;

    for (var wedge = 0; wedge < wedges; wedge++) {
      // left and right are theta, and vary between 0 and 2*PI
      var left = (wedge / wedges) * Math.PI * 2;
      var right = ((wedge + 1) / wedges) * Math.PI * 2;

      this.face([this.sphericalToX(1, right, upper),
                 this.sphericalToY(1, right, upper),
                 this.sphericalToZ(1, right, upper),

                 this.sphericalToX(1, left, upper),
                 this.sphericalToY(1, left, upper),
                 this.sphericalToZ(1, left, upper),

                 this.sphericalToX(1, left, lower),
                 this.sphericalToY(1, left, lower),
                 this.sphericalToZ(1, left, lower),

                 this.sphericalToX(1, right, lower),
                 this.sphericalToY(1, right, lower),
                 this.sphericalToZ(1, right, lower)]);
    }
  }

  return this;
};

// SECTION: GEOMETRY


basic.node.face = function(vertices) {
  if (this.isLines()) {
    var count = vertices.length;
    for (var i = 0; (i + 3) < count; i += 3) {
      this._.vertices.push(vertices[i + 0], vertices[i + 1], vertices[i + 2],
                          vertices[i + 3], vertices[i + 4], vertices[i + 5]);
    }

    // Adds the line from the last vertex to the first, completing the loop.
    this._.vertices.push(vertices[count - 3],
                        vertices[count - 2],
                        vertices[count - 1],
                        vertices[0],
                        vertices[1],
                        vertices[2]);
  } else if (this.isTriangles()) {
    for (var i = 3; i < vertices.length - 3; i += 3) {
      this._.vertices.push(vertices[0], vertices[1], vertices[2],
                        vertices[i + 0], vertices[i + 1], vertices[i + 2],
                        vertices[i + 3], vertices[i + 4], vertices[i + 5]);
    }
  } else {
    this._.vertices.push.apply(this._.vertices, vertices);
  }

  return this;
};

basic.node.polygon = function(sides) {
  var vertices = new Array(sides * 3);

  for (var i = 0; i < sides; i++) {
    vertices[i * 3 + 0] = Math.cos((Math.PI * 2) * (i / sides));
    vertices[i * 3 + 1] = Math.sin((Math.PI * 2) * (i / sides));
    vertices[i * 3 + 2] = 0;
  }

  this.face(vertices);

  return this;
};

basic.node.triangle = function() {
  this.polygon(3);
  return this;
};


// SECTION: OBJ

basic.node.obj = function(obj) {
  if (arguments.length > 0) {
    this.loadObj(obj);
    return this;
  }

  return this.dumpObj();
}


basic.node.loadObj = function(obj) {
  var lines = obj.split(/\r?\n/);

  var vertices = [];
  var faces = [];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    line = line.replace(/#.*/, '');
    line = line.replace('	', ' ');
    line = line.trim();
    if (line.length === 0) {
      continue;
    }

    var pieces = line.split(/ +/);

    var tag = pieces[0];

    switch (tag) {
      case 'v':
        var x = Number(pieces[1]);
        var y = Number(pieces[2]);
        var z = Number(pieces[3]);
        vertices.push([x, y, z]);
        break;
      case 'f':
        // support negative indices
        var face = [];
        for (var j = 1; j < pieces.length; j++) {
          face.push(Number(pieces[j].split('/')[0]) - 1);
        }
        faces.push(face);
        break;
      case 'p':  // point, not supported
      case 'l':  // line, not supported
      case 'vt': // vertex texture, not supported
      case 'vn': // vertex normal, not supported
    }
  }

  for (var i = 0; i < faces.length; i++) {
    var faceVertices = [];
    faces[i].map(function(j) {
      faceVertices.push(vertices[j][0], vertices[j][1], vertices[j][2]);
    });
    this.face(faceVertices);
  }

  return this;
};

basic.node.formatFloatForObj = function(x) {
  var s = x.toFixed(6);
  if (x >= 0) s = ' ' + s;
  return s;
};


// vertex(n) -> [x,y,z]
// face

basic.node.dumpObj = function() {
  var vertices = [];

  var lines = [];

  // embed node name as comment
  if (this.name()) {
    lines.push('# ' + this.name());
    lines.push('');
  }

  for (var i = 0; i < this.vertexCount(); i++) {
    var v = this.vertex(i).array().map(this.formatFloatForObj);
    v.unshift('v');
    lines.push(v.join(' '));
  }

  for (var i = 0; i < this.floatCount(); i += this.stride()) {
    var base = i / 3 + 1;

    if (this.isPoints()) {
      lines.push(['p', base].join(' '));
    } else if (this.isLines()) {
      lines.push(['l', base, base + 1].join(' '));
    } else if (this.isTriangles()) {
      lines.push(['f', base, base + 1, base + 2].join(' '));
    }
  }

  return lines.join('\n');
};


basic.node.floatCount     = function() { return this._.vertices.length;                   };
basic.node.vertexCount    = function() { return this.floatCount() / 3;                   };
basic.node.primitiveCount = function() { return this.vertexCount() / this.cardinality(); };
basic.node.stride         = function() { return this.cardinality() * 3;                  };

basic.node.setFloatCount     = function(n) {
  var original = this._.vertices.length;
  this._.vertices.length = n;

  for (var i = original; i < n; i++) {
    this._.vertices[i] = 0;
  }

  return this;
};

basic.node.setVertexCount    = function(n) {
  return this.setFloatCount(n * 3);
};

basic.node.setPrimitiveCount = function(n) {
  return this.setFloatCount(n * this.stride());
};

// SECTION: SPRITES

basic.node.setSprite = function(newSprite) {
  this._.sprite = newSprite;

  if (this._.sprite === null ||
      this._.sprite instanceof HTMLImageElement ||
      this._.sprite instanceof HTMLCanvasElement ||
      this._.sprite instanceof HTMLVideoElement) {
    this._.spriteSource = newSprite;
  } else if (typeof(this._.sprite) === 'string') {
    this._.spriteSource = new Image();
    this._.spriteSource.src = this._.sprite;
    // todo: Am I really not hiding this thing?
    document.body.appendChild(this._.spriteSource);
  } else {
    throw new Error('Node.setSprite: bad sprite: ' + newSprite);
  }

  return this;
};


basic.node.sprite = function() {
  if (arguments.length > 0) {
    // todo: one function
    this.setSprite(arguments[0]);
    return this;
  }
  return this._.sprite;
};

basic.node.getSpriteSource = function() {
  return this._.spriteSource;
};

basic.node.vertices = function(vertices) {
  if (arguments.length > 0) {
    this._.vertices.length = vertices.length;

    for (var i = 0; i < vertices.length; i++) {
      this._.vertices[i] = vertices[i];
    }

    return this;
  }

  return this._.vertices;
};

basic.node.vertex = function(i, opt_dest) {
  if (i < 0 || i >= this._.vertices.length) {
    rmr.die("node.vertex: bad index: " + i);
  }

  var dest = opt_dest || rmr.vec3();
  dest[0] = this._.vertices[i * 3 + 0];
  dest[1] = this._.vertices[i * 3 + 1];
  dest[2] = this._.vertices[i * 3 + 2];
  return dest;
};

basic.node.setFloat = function(i, f) {
  this._.vertices[i] = f;
  return this;
};

basic.node.setVertex = function(i) {
  if (arguments.length === 2) {
    var v = arguments[0];
    this._.vertices[i * 3 + 0] = v[0];
    this._.vertices[i * 3 + 1] = v[1];
    this._.vertices[i * 3 + 2] = v[2];
  } else {
    this._.vertices[i * 3 + 0] = arguments[1];
    this._.vertices[i * 3 + 1] = arguments[2];
    this._.vertices[i * 3 + 2] = arguments[3];
  }

  return this;
};

basic.node.pushVertex = function() {
  var v = arguments.length === 1 ? arguments[0] : arguments;
  this._.vertices.push.apply(this._.vertices, v);
  return this;
};

basic.node.pushVertices = function(vertices) {
  this._.vertices.push.apply(this._.vertices, vertices);
  return this;
};

basic.node.clearVertices = function() {
  this.vertices([]);
  return this;
};

basic.node.filterVertices = function(f) {
  var v = this.vertices();
  for (var i = 0; i < this.vertexCount(); i++) {
    if (!f.call(this, this, i)) {
      v.splice(i * 3, 3);
      i--;
    }
  }
  return this;
};

basic.node.filterPrimitives = rmr.abstract;

basic.node.forEachVertex = function(f) {
  for (var i = 0; i < this.vertexCount(); i++) {
    f.call(this, this, i);
  }
  return this;
};


basic.node.pointSize = function(opt_x) {
  if (arguments.length > 0) {
    this._.pointSize = opt_x;
    return this;
  } else {
    return this._.pointSize;
  }
};

basic.node.lineWidth = function(opt_x) {
  if (arguments.length > 0) {
    this._.lineWidth = opt_x;
    return this;
  } else {
    return this._.lineWidth;
  }
};

basic.node.stride = function(c) {
  if (c) {
    return c * 3;
  } else {
    return this.cardinality() * 3;
  }
};

basic.node.points    = function () { return this.cardinality(1); };
basic.node.lines     = function () { return this.cardinality(2); };
basic.node.triangles = function () { return this.cardinality(3); };

basic.node.isPoints    = function() { return this.cardinality() === 1; };
basic.node.isLines     = function() { return this.cardinality() === 2; };
basic.node.isTriangles = function() { return this.cardinality() === 3; };

// todo: warn when cardinality is changing and vertices already exist?
basic.node.cardinality = function(c) {
  if (arguments.length > 0) {
    rmr.assert(c >= 1 && c <= 3, "node.cardinality: bad cardinality: " + c);
    this._.cardinality = c;
    return this;
  }

  return this._.cardinality;
};

basic.node.cycleCardinality = function() {
  rmr.log(this.cardinality());
  return this.cardinality(this.cardinality() % 3 + 1);
};

// SECTION: COLOR

basic.node.defaultColor = rmr.color('white');

basic.node.color = function() {
  if (arguments.length > 0) {
    this._.color = rmr.color.apply(undefined, arguments);
    return this;
  }

  if (this._.color) {
    return this._.color;
  } else {
    return this.defaultColor;
  }
};

basic.node.colorFunction = function() {
  if (arguments.length > 0) {
    this._.colorFunction = arguments[0];
    return this;
  }

  if (this._.colorFunction) {
    return this._.colorFunction;
  } else {
    return null;
  }
};

basic.node.void = function () {
  this.ilk('none');
  return this;
};

Object.seal(basic);

});
