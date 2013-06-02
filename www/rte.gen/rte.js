'use strict';

define(function(require) {
  var rmr = require('all');

  var gen = {
    path:     '/gen'
  , template: require('text!./template.html')
  , style:    require('text!./style.css')
  };

  var lastPosition = {x: 0, y: 0};
  var delta        = {x: 0, y: 0};
  var resized      = true;

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

  $(window).resize(function (e) { resized = true; });

  // single colored objects have undifferentiated sides
  // - shade sides using normal to camera
  //

  gen.controller = function ($scope) {
    var root   = rmr.node('root');
    var eye    = root.spawn('eye').translate(0, 0, 10)
    var v      = rmr.vec3();
    var scene  = $('.scene'   );
    var ap     = $('.aperture');
    var canvas = scene[0];

    window.root = root;

    var cam = rmr.camera('root')
                .canvas(canvas)
                .eye(eye)
                .scene(root)
                .clearColor('black');

    //root.lines().spawn('cube').spawn().cube().color('white').scale(1.1).mergeUp();
    //root.points().spawn().spawn().color('white').pointSize(1).pointCube(1000).scale(2).mergeUp();

    /*
    var cube = root.spawn().triangles().cube().scale(0.5);
    cube.clone().color('grey'  ).translate( 0.5,  0.5,  0.5);
    cube.clone().color('blue'  ).translate(-0.5,  0.5,  0.5);
    cube.clone().color('white' ).translate( 0.5, -0.5,  0.5);
    cube.clone().color('pink'  ).translate(-0.5, -0.5,  0.5);
    cube.clone().color('red'   ).translate( 0.5,  0.5, -0.5);
    cube.clone().color('black' ).translate(-0.5,  0.5, -0.5);
    cube.clone().color('purple').translate( 0.5, -0.5, -0.5);
    cube.clone().color('green' ).translate(-0.5, -0.5, -0.5);
    cube.orphan();
    */

    /*
       each keypress shoots a cube at some angle out of the center of the cube at an angle
       apply gravity
       satellites that get to close disappear
       music volume applies some kind of angular impulse to satellites

       next scene is initated by a scale change

       key press flashes octent of cube
    */

    eye.chainTick(function (eye, now, dt) {
      var speedFactor = dt * 0.01 * (rmr.key.shift.down() ? 10 : 1);

      var rotationSpeed = 0.005 * speedFactor;
      var movementSpeed = 1 * speedFactor;

      /*
      if (rmr.key.w.down()) eye.translate(0, 0, -movementSpeed);
      if (rmr.key.s.down()) eye.translate(0, 0, movementSpeed);
      if (rmr.key.a.down()) eye.translate(-movementSpeed, 0, 0);
      if (rmr.key.d.down()) eye.translate(movementSpeed, 0, 0);
      if (rmr.key.c.down()) eye.translate(0, -movementSpeed, 0);
      if (rmr.key.e.down()) eye.translate(0, movementSpeed, 0);
      */

      if (rmr.key.up   .down()) eye.rotateX(rotationSpeed);
      if (rmr.key.down .down()) eye.rotateX(-rotationSpeed);
      if (rmr.key.left .down()) eye.rotateY(rotationSpeed);
      if (rmr.key.right.down()) eye.rotateY(-rotationSpeed);

      eye.rotateY(-delta.x / 1000);
      eye.rotateX(-delta.y / 1000);

      delta.x = delta.y = 0;
    });

    /*

       this.class.

       this.is.sim = false

       // additional properties
       // additional behavior in the form of tick functions

       // spin
       // velocity
       // dynamics
       // gravity

       // gravity point
       // gravity vector

       this.mix.spin = {
       };

    */

    /*
       frequency bands

       volume spikes

       beat detection

       key detection


       tap tempo

       dj outline in lasers


    var stockpile = [];
    for (var i = 0; i < 1000; i++) {
    }
    */
    var spin = rmr.vec3().randomize().scale(0.0005);
    var spinFast = spin.clone().scale(10);

    function spawn(x, y, z, fast) {
      rmr.allowGarbage();
      var m = fast ? 10 : 1;
      var n = root.spawn()
                  .cardinality(fast ? 3 : 2)
                  .cube()
                  //.translate(rmr.vec3().randomize())
                  .scale(1/4)
                  .velocity(x*m, y*m, z*m)
                  .spin(fast ? spinFast : spin)
                  .color('random');
      rmr.disallowGarbage();
      return n;
    }

    root.chainTick(function (root, now, dt) {
      /*
      if (rmr.key.a.pressed()) spawn( 0.0,    0.0,    0.001);
      if (rmr.key.s.pressed()) spawn( 0.0,   -0.001,  0.0  );
      if (rmr.key.d.pressed()) spawn( 0.0,    0.0,   -0.001);
      if (rmr.key.f.pressed()) spawn( 0.0,    0.001,  0.0  );
      if (rmr.key.j.pressed()) spawn( 0.001,  0.0,    0.0  );
      if (rmr.key.k.pressed()) spawn(-0.001,  0.0,    0.0  );
      */


      var a = rmr.key.a.pressed();
      var s = rmr.key.s.pressed();
      var d = rmr.key.d.pressed();
      var f = rmr.key.f.pressed();

      if (a || s || d || f) {
        var fast = s;
        spawn( 0.0,    0.0,    0.001, fast);
        spawn( 0.0,   -0.001,  0.0  , fast);
        spawn( 0.0,    0.0,   -0.001, fast);
        spawn( 0.0,    0.001,  0.0  , fast);
        spawn( 0.001,  0.0,    0.0  , fast);
        spawn(-0.001,  0.0,    0.0  , fast);
      }

      root.rotateY(dt * rmr.TAU * 0.00001)
          .rotateZ(dt * rmr.TAU * 0.00001);
    });

    var lastFrame = Date.now();

    var t = Date.now();

    function frame() {
      var now = Date.now();
      var dt  = now - lastFrame;
      lastFrame = now;

      if (rmr.key.space.down()) {
        return;
      } else {
        t += dt;
      }

      scene.scale();
      root.verifyTree();
      root.tickTree(t);
      cam.perspective();
      cam.projectTree();
      cam.renderTree();
    };

    $scope.$on('frame', frame);
  };

  return gen;
});
