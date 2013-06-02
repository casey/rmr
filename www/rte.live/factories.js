'use strict';

define(function(require) {
var rmr = require('all');

rmr.glod.preprocess(require('text!./color.glsl'   ));
rmr.glod.preprocess(require('text!./skulls.glsl'  ));
rmr.glod.preprocess(require('text!./bay.glsl'     ));
rmr.glod.preprocess(require('text!./wave.glsl'    ));
rmr.glod.preprocess(require('text!./globe.glsl'   ));
rmr.glod.preprocess(require('text!./smooth.glsl'  ));
rmr.glod.preprocess(require('text!./eq.glsl'      ));
rmr.glod.preprocess(require('text!./flatform.glsl'));
rmr.glod.preprocess(require('text!./ex.glsl'      ));
rmr.glod.preprocess(require('text!./square.glsl'  ));
rmr.glod.preprocess(require('text!./circle.glsl'  ));

var factories = {};

factories.empty = function() {
  return rmr.node();
};

factories.stars = function () {
  return rmr.node('stars').basic().points().color('white').pointCube(10000).scale(10).pointSize(2);
};

factories.nebula = function() {
  var temp = rmr.vec3();

  var root = rmr.node('nebula').basic().prop('type', '3d');

  var parent = root.spawn().lines().chainTick(function (_, now, dt) {
    _.rotateY(dt * 0.00005);
  });

  for (var j = 0; j < 100; j++) {
    var lines = parent.spawn().lines();
    var current = rmr.vec3();
    var offset = rmr.vec3();

    var v = lines.vertices();
    var c = 10000;
    for (var i = 0; i < c; i++) {
      offset.randomize(-0.1, 0.1);
      v.push(current[0], current[1], current[2]);
      current.add(offset);
      v.push(current[0], current[1], current[2]);
    }

    lines.colorFunction(function (_, i, color) {
      temp[0] = _._.vertices[i * 3 + 0];
      temp[1] = _._.vertices[i * 3 + 1];
      temp[2] = _._.vertices[i * 3 + 2];
      var m = temp.magnitude()

      var t0 = i /  c / 2;

      var t = m / 30;
      t *= Math.PI * 2 * 3;
      t = Math.cos(t * t) * 0.5 + 0.5;
      color[0] = 0;
      color[1] = (1 - t0) * t;
      color[2] = (1 - t0) * t;
      color[3] = 1.0;
    });

    lines.flatten();

    lines.prop('i', j).chainTick(function (_, now, dt) {
      var i = _.prop('i');
      var a = rmr.TAU * dt * 0.001 * (i + 1) / c;
          if (i % 3 === 0) _.rotateX(a);
      else if (i % 3 === 1) _.rotateY(a);
      else                  _.rotateZ(a);
    });
  }

  return root;
};

factories.spirals = function() {
  var temp = rmr.vec3();

  var root = rmr.node().basic().lines();

  for (var j = 0; j < 100; j++) {
    var lines = root.spawn().lines();
    var base = rmr.vec3().randomize();
    var quat = rmr.quat().quatRandomRotation();
    var mat = quat.quatToRotationMatrix();

    var current = rmr.vec3();

    var v = lines.vertices();
    var c = 10000;
    for (var i = 0; i < c; i++) {
      v.push(current[0], current[1], current[2]);
      current.add(mat.mult(base));
      v.push(current[0], current[1], current[2]);
    }

    lines.colorFunction(function (_, i, color) {
      temp[0] = _._.vertices[i * 3 + 0];
      temp[1] = _._.vertices[i * 3 + 1];
      temp[2] = _._.vertices[i * 3 + 2];
      var m = temp.magnitude()

      var t0 = i /  c / 2;

      var t = m / 30;
      t *= Math.PI * 2 * 3;
      t = Math.cos(t * t) * 0.5 + 0.5;
      color[0] = 0;
      color[1] = (1 - t0) * t;
      color[2] = (1 - t0) * t;
      color[3] = 1.0;
    });

    lines.flatten();

    // rotation
    lines.prop('i', j).chainTick(function (_, now, dt) {
      var i = _.prop('i');
      var a = rmr.TAU * dt * 0.001 * (i + 1) / c;
          if (i % 3 === 0) _.rotateX(a);
      else if (i % 3 === 1) _.rotateY(a);
      else                  _.rotateZ(a);
    });
  }

  return root;
};


factories.field  = function () {
  var root = rmr.node('field').basic().triangles();

  root.spawn('stars').points().color('white').pointCube(10000).scale(1000).pointSize(2);

  // size
  // orientation
  // position
  //
  // translation speed
  // inverted flag

  var w = 10;
  var h = 10;
  var d = 10;
  var space = 5;
  for (var z = 0; z < d; z++) {
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        //space = 5 - 5 *(x / 9);
        root.spawn().cube().translate(
            x * space - w * space / 2,
            y * space - h * space / 2,
            z * space - d * space / 2)
      }
    }
  }

  var get = function (x, y, z) {
    return root.child(z * w * h + y * w  + x);
  };

  for (var i = 0; i < w * h * d; i++) {
    //if (i % 2 === 0) p.child(i).color('red');
  }

  /*

  get(0, 0, 0).color('green');
  get(0, 0, 9).color('green');
  get(0, 9, 0).color('green');
  get(0, 9, 9).color('green');
  get(9, 0, 0).color('green');
  get(9, 0, 9).color('green');
  get(9, 9, 0).color('green');
  get(9, 9, 9).color('green');

  */
  return root;
};

factories.circle = function () {
  return rmr.node('circle')
    .flat()
    .program('circle')
    .pack('position')
    .vertices([1, -1, 0, 1, 1, 1, 0, 1, -1, 1, 0, 1, -1, 1, 0, 1, -1, -1, 0, 1, 1, -1, 0, 1])
    .triangles()
    .prop('type', 'aspect')
};

factories.square = function () {
  return rmr.node('square')
    .flat()
    .program('square')
    .pack('position')
    .vertices([1, -1, 0, 1, 1, 1, 0, 1, -1, 1, 0, 1, -1, 1, 0, 1, -1, -1, 0, 1, 1, -1, 0, 1])
    .triangles()
    .prop('type', 'aspect')
};

factories.globe = function () {
  return rmr.node('globe')
    .flat()
    .program('globe')
    .pack('position')
    .vertices([1, -1, 0, 1, 1, 1, 0, 1, -1, 1, 0, 1, -1, 1, 0, 1, -1, -1, 0, 1, 1, -1, 0, 1])
    .triangles()
    .prop('type', 'aspect')
};

factories.smooth = function () {
  return rmr.node('smooth')
    .flat()
    .program('smooth')
    .pack('position')
    .vertices([1, -1, 0, 1, 1, 1, 0, 1, -1, 1, 0, 1, -1, 1, 0, 1, -1, -1, 0, 1, 1, -1, 0, 1])
    .triangles()
    .prop('type', 'aspect')
};

factories.ex = function () {
  return rmr.node('ex')
    .flat()
    .program('ex')
    .pack('position')
    .vertices([1, -1, 0, 1, 1, 1, 0, 1, -1, 1, 0, 1, -1, 1, 0, 1, -1, -1, 0, 1, 1, -1, 0, 1])
    .triangles()
    .prop('type', 'aspect')
};

factories.eq = function () {
  return rmr.node('eq')
    .flat()
    .program('eq')
    .pack('position')
    .vertices([1, -1, 0, 1, 1, 1, 0, 1, -1, 1, 0, 1, -1, 1, 0, 1, -1, -1, 0, 1, 1, -1, 0, 1])
    .triangles()
    .prop('type', 'aspect')
};

factories.flatform = function () {
  return rmr.node('flatform')
    .flat()
    .program('flatform')
    .pack('position')
    .vertices([1, -1, 0, 1, 1, 1, 0, 1, -1, 1, 0, 1, -1, 1, 0, 1, -1, -1, 0, 1, 1, -1, 0, 1])
    .triangles()
    .prop('type', 'aspect')
};

factories.wave = function () {
  return rmr.node('wave')
    .flat()
    .program('wave')
    .pack('position')
    .vertices([1, -1, 0, 1, 1, 1, 0, 1, -1, 1, 0, 1, -1, 1, 0, 1, -1, -1, 0, 1, 1, -1, 0, 1])
    .triangles()
    .prop('type', 'aspect')
};

factories.skulls = function () {
  return rmr.node('skulls')
    .flat()
    .program('skulls')
    .pack('position')
    .vertices([1, -1, 0, 1, 1, 1, 0, 1, -1, 1, 0, 1, -1, 1, 0, 1, -1, -1, 0, 1, 1, -1, 0, 1])
    .triangles()
    .prop('type', 'aspect')
};

factories.dotsphere = function () {
  var root = rmr.node('dotsphere').basic();
  var count = 10;
  for (var i = 0; i < count; i++) {
    root.spawn().prop('i', i).points().pointSize(3).sphere().scale(10 * (count - i) / count).chainTick(function (_, now, dt) {
      var i = _.prop('i');
      var a = rmr.TAU * dt * 0.0001 * (i + 1) / count;
           if (i % 3 === 0) _.rotateX(a);
      else if (i % 3 === 1) _.rotateY(a);
      else                  _.rotateZ(a);
    });
  }
  return root;
};

// pass it through a global variable
// optional property that takes a frame event
// pass it to the factory constructor

factories.plants = function () {
  var temp = rmr.vec3();
  var parent = rmr.node('plants').basic();

  parent.prop('type', 'aspect');

  var count = 200;
  var ordered = [];
  for (var i = 0; i < count; i++) {
    var n = parent.spawn().color(i / count, i / count, i / count, 1)
    var t = n.spawn();
    t.spawn().triangles().spawn().polygon(4).scale(1, 0.5, 1).scale(0.5).mergeUp();
    t.spawn().lines().pushVertex(0, 0, 0).pushVertex(0, -1000, 0);

    // 0.6 - 0.2
    temp.y(Math.random() * 0.4 + 0.2 - 0.5);
    temp.x((Math.random() - .5) * 3);
    temp.z(Math.random() * 0.5 - 1.0);

    n.prop('x', temp.x());

    t.translatev(temp);
    t.scale(Math.random() * 0.03 + 0.15);

    n.prop('i', i);
    ordered.push(n);

    n.chainTick(function (_, now, dt) {
      _.transform().identity();
      _.translate(0, Math.sin(now * 0.0001 + (_.prop('i') / count) * rmr.TAU) * 0.1, 0.0)

      var waveData = window.btdd;

      if (!waveData || waveData.length == 0) return;

      var n = ordered.indexOf(_) / ordered.length;
      n = Math.min(
        Math.abs(waveData[Math.floor(n * waveData.length)] / 255 - 0.5) * 2 * 2.0 + 0.5 * _.prop('i') / count, 
        1.0
      );

      //n *= scale;
      var c = _.children()[0].children();
      for (var i = 0; i < c.length; i++) {
        rmr.allowGarbage();
        c[i].color(n, n, n, 1.0);
      }

      _.forEach(function () { this.color(n, n, n, 1.0); });
    });
  }

  ordered.sort(function (a, b) {
    var az = a.prop('x');
    var bz = b.prop('x');
    return az - bz;
  });

  return parent;
};


factories.buffer = function () {
  var root = rmr.node().flat().program('flat.basic').pack('position', 'color').primitive(6);

  var t4 = rmr.vec4();

  var lastBeat = 0;
  
  root.chainTick(function (_, now, dt) {
    var v = _._.vertices;
    v.length = 0;
    for (var i = 0; i < 100; i++) {
      t4.randomize(-3, 3); t4[3] = 1; v.pushv(t4);
      t4.randomize(); v.pushv(t4);
    }
    _.upload();
    return true;
  });

  root.chainTick(function (_, now, dt) {
    var v = _._.vertices;
    if (lastBeat !== window.beat) {
      for (var i = 0; i < 100; i++) {
        t4.randomize(-3, 3); t4[3] = 1;
        v[i * 8 + 0] = t4[0];
        v[i * 8 + 1] = t4[1];
        v[i * 8 + 2] = t4[2];
        v[i * 8 + 3] = t4[3];
      }
      lastBeat = window.beat;
    }

    for (var i = 0; i < 100; i++) {
      if (rmr.maybe(1)) {
        t4.randomize(-0.1, 0.1); //t4[3] = 1;
        v[i * 8 + 0] *= 1 + t4[0];
        v[i * 8 + 1] *= 1 + t4[1];
        v[i * 8 + 2] *= 1 + t4[2];
        v[i * 8 + 3] *= 1 + t4[3];
      }
    }
    _.upload();
  });

  return root;
};

factories.locus = function () {
  var p = rmr.node('glyph').basic().points().color(1, 0, 0).pointSize(3);

  var pos = [];

  for (var j = 0; j < 10; j++) {
    pos.push( j,   j,   j);
    pos.push( j,   j,  -j);
    pos.push( j,  -j,   j);
    pos.push( j,  -j,  -j);
    pos.push(-j,   j,   j);
    pos.push(-j,   j,  -j);
    pos.push(-j,  -j,   j);
    pos.push(-j,  -j,  -j);
  }

  for (var i = 0; i < pos.length; i += 3) {
    var x = pos[i + 0] * 0.5;
    var y = pos[i + 1] * 0.5;
    var z = pos[i + 2] * 0.5;
    p.spawn().pointCube(100).translate(x, y, z).mergeUp()
  }

  return p;
};

  // color
factories.color = function () {
  return rmr.node('color')
    .flat()
    .program('color')
    .pack('position')
    .vertices([1, -1, 0, 1, 1, 1, 0, 1, -1, 1, 0, 1, -1, 1, 0, 1, -1, -1, 0, 1, 1, -1, 0, 1])
    .triangles()
    .prop('type', 'ortho');
};
 
factories.bay = function () {
  return rmr.node('bay')
    .flat()
    .program('bay')
    .pack('position')
    .vertices([1, -1, 0, 1, 1, 1, 0, 1, -1, 1, 0, 1, -1, 1, 0, 1, -1, -1, 0, 1, 1, -1, 0, 1])
    .triangles()
    .prop('type', 'aspect')
};

return factories;
});
