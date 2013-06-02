'use strict';

define(function(require) {
  var rmr = require('all');

  require('glod');
  require('camera');

  var demo = {
    path:     '/'
  , template: require('text!./template.html')
  , style:    require('text!./style.css')
  };

  demo.controller = function ($scope) {

    var root   = rmr.node('root').basic();
    var eye    = root.spawn('eye').translate(0, 0, 6).chainDriver();
    var v      = rmr.vec3();
    var m      = rmr.mat4().identity();

    var far = eye.spawn('far').rotateZ(rmr.TAU / 2);

    root.spawn('axes').triangles().axes();

    var surfaceColor   = rmr.color('#2ebfda');
    var crustColor     = rmr.color('#933d1a');
    var mantelColor    = rmr.color('#e45a1c');
    var outerCoreColor = rmr.color('#fbab52');
    var innerCoreColor = rmr.color('#fdf182');

    root.spawn('stars').color('white').pointCube(10000).scale(1000).pointSize(2);

    root.spawn('shapes')
        .color('aqua', .5)
        .lines()
        .iterate(10, function(node, n, i) {
          return node.clone().clearVertices().polygon(i + 3).translate(0, 0, -5);
        });

    var x = root.find('x');
    var xObj = x.obj();
    x.clearVertices().obj(xObj);

    var o = root.spawn('objects');

    v.load(2, 0, 0);
    m.rotateZ(rmr.TAU / 3);

    m.mult(v);
    o.spawn('wireframe').lines().sphere().translatev(v)

    m.mult(v);
    o.spawn('tope').triangles().sphere(5, 5).translatev(v).color('water blue');

    m.mult(v);
    o.spawn('cloud')
     .points()
     .pointSize(2)
     .translatev(v)
     .color('watermelon')
     .pointCube(5000)
     .filterVertices(function (node, i) {
       return node.vertex(i, v).magnitude() <= 1.0
     })
     .colorFunction(function (node, i, dest) {
       node.vertex(i, v);
       var mag = v.magnitude();

       var color = mag > 0.95 ? surfaceColor   :
                   mag > 0.90 ? crustColor     :
                   mag > 0.75 ? mantelColor    :
                   mag > 0.40 ? outerCoreColor :
                                innerCoreColor ;

       dest[0] = color[0];
       dest[1] = color[1];
       dest[2] = color[2];
       dest[3] = color[3];
     });

    o.chainTick(function (node, now, dt) {
      node.applyTransform(m.identity().rotateZ(rmr.TAU * dt * 0.00001));
    });

    o.find('wireframe').clone().color('light blue').scale(0.9).flatten();

    var lc = $('.left');
    var rc = $('.right');

    var cam = rmr.camera('root')
                 //.canvas('canvas.scene', false)
                 .eye(eye)
                 .scene(root)
                 .clearColor('black')
                 .perspective();

    var big = cam.spawn('big').canvas('canvas.scene');
    var sub = cam.spawn('sub')


    var cam0 = sub.spawn('0').passOn('ssaa').canvas(lc).opening('.q0');
    var cam1 = sub.spawn('1').passOn('invert').passOn('fxaa').canvas(rc).opening('.q1');
    var cam2 = sub.spawn('2').passOn('invert').passOn('gray').passOn('ssaa').eye(far).canvas(lc).opening('.q2');
    var cam3 = sub.spawn('3').passOn('glow').eye(far).canvas(rc).opening('.q3');

    var multi = true;
    
    function frame() {
      if (rmr.key.enter.pressed()) multi = !multi;
      if   (multi) { big.hide(); sub.show(); lc.show(); rc.show(); }
      else         { big.show(); sub.hide(); lc.hide(); rc.hide(); }
      cam.tick();
    };

    rmr.globalize({$: $, root: root, cam: cam});

    $scope.$on('frame', frame);
  };

  return demo;
});
