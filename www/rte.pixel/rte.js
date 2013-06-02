'use strict';

/*
. render all shapes into grid - must not interpenetrate
. for each shape, calculate it's next position, render diff
. test diff pixels for collision with other shapes
. apply collision response if collision, possibly moving back to original
  position

pixel smoothing for the actual shape

single pixel
aabb
circle

box
hollow box

render shape into buffer

check if shape can be cleanly applied to grid - self-collision is ok
apply shape to grid


entity:
  bool[] front buffer // max dimensions of entity
  bool[] back buffer

  vec2 position
  vec2 velocity
  vec2 spin

world:
  entity[]    buffer // this could possilby be a bunch of entity buffers
  set<entity> entities

for entity in world:
  render entity into back buffer
  if back buffer can be applied cleanly to world buffer:
    world buffer - front buffer + back buffer
    swap buffers
  else:
    collision response?
    leave it alone?
    zero velociity

*/

define(function(require) {
  var rmr = require('all');

  var pixel = {
    path:     '/pixel',
    template: require('text!./template.html'),
    stats:    true
  };

  function entity() {
    var that = rmr.new(this, entity);
    if (this !== that) return entity.apply(that, arguments);

    this.velocity = rmr.vec2();
    this.color    = rmr.color();

    return this;
  };

  function world(w, h) {
    var that = rmr.new(this, world);
    if (this !== that) return world.apply(that, arguments);

    this.w = w;
    this.h = h;
    this.c = w * h;
    this.a = new Array(this.c);

    for (var i = 0; i < this.c; i++) {
      this.a[i] = null;
    }

    this.e = rmr.set();

    return this;
  };

  world.prototype.get = function (x, y) {
    var i = this.w * y + x;
    return this.a[i];
  };

  world.prototype.set = function(x, y, e) {
    var i = this.w * y + x;

    var old = this.a[i];

    if (this.e.contains(old)) this.e.remove(old);
    if (e !== null && this.e.contains(e)) rmr.die('world already contains entity', e);

    e !== null && this.e.add(e);

    this.a[i] = e;

    return this;
  };

  var sim = world(100, 100);
  var e = entity();
  e.velocity[0] = 1;
  e.velocity[1] = 1;
  sim.set(10, 10, e);

  var step = 1;

  pixel.controller = function ($scope, $, rmr) {
    var e = $.ngElement();

    var ct = rmr.ct(e.find('canvas'));

    window.g.ct = ct;

    var s = null;

    ct.canvas().width  = 100;
    ct.canvas().height = 100;

    var id = ct.getImageData(0, 0, 100, 100);
    var d  = id.data;

    var pos = rmr.vec2();

    $scope.$on('frame', function (e, now, dt) {
      var pass = 0;

      while (dt >= step) {
        for (var i = 0; i < sim.e._array.length; i++) {
          return;
          var e = sim.e._array[i];

          var ai = sim.a.indexOf(e);

          if (ai === -1) {
            rmr.die('entity not found');
          }

          var x = ai % 100;
          var y = (ai - x) / 100;

          pos.x(x).y(y);

          pos.add(e.velocity);

          pos[0] = Math.round(pos[0]);
          pos[1] = Math.round(pos[1]);

          if (pos[0] !== x || pos[1] !== y) {
            sim.get(x, y) === e || rmr.die('entity not at expected location');

            sim.set(x, y, null);
            sim.set(pos[0], pos[1], e);
          }

          /*
          var other = sim.get(pos[0], pos[1]);

          if (other) {
          }
          */

          /*

          */
          //var e = sim.get(x, y);
        /*
          if (!e) continue;
          var o = sim.get(nx, ny);
        */
        }

        dt -= step;
        pass++;
      }

      for (var i = 0; i < 100 * 100; i++) {
        var x  = i % 100;
        var y  = (i - x) / 100;
        var e  = sim.get(x, y);

        if (!e) {
          d[i * 4 + 0] = 255;
          d[i * 4 + 1] = 0;
          d[i * 4 + 2] = 0;
          d[i * 4 + 3] = 255;
        } else {
          d[i * 4 + 0] = e._r;
          d[i * 4 + 1] = e._g;
          d[i * 4 + 2] = e._b;
          d[i * 4 + 3] = e._a;
        }
      }

      if (rmr.once()) $(ct.canvas()).scale();
      ct.putImageData(id, 0, 0);
    });
  };

  return pixel;
});
