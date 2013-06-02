'use strict';

define(function(require) {
  var rmr = require('all');

  var photo = {
    path    : '/photo'
  , template: require('text!./template.html')
  , style   : require('text!./style.css')
  , stats   : false
  };

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

  photo.controller = function ($scope) {
    var root  = rmr.node('root');

    var eye = root.spawn('eye').translate(0, 0, 10);

    eye.chainTick(function (eye, now, dt) {
      var speedFactor = dt * 0.01 * (rmr.key.shift.down() ? 10 : 1);

      var rotationSpeed = 0.0005 * speedFactor;
      var movementSpeed = 0.1 * speedFactor;

      if (rmr.key.w.down()) eye.translate(0, 0, -movementSpeed);
      if (rmr.key.s.down()) eye.translate(0, 0, movementSpeed);
      if (rmr.key.a.down()) eye.translate(-movementSpeed, 0, 0);
      if (rmr.key.d.down()) eye.translate(movementSpeed, 0, 0);
      if (rmr.key.c.down()) eye.translate(0, -movementSpeed, 0);
      if (rmr.key.e.down()) eye.translate(0, movementSpeed, 0);

      if (rmr.key.up   .down()) eye.rotateX(rotationSpeed);
      if (rmr.key.down .down()) eye.rotateX(-rotationSpeed);
      if (rmr.key.left .down()) eye.rotateY(rotationSpeed);
      if (rmr.key.right.down()) eye.rotateY(-rotationSpeed);

      root.rotateY(-delta.x / 1000);
      root.rotateZ(-delta.y / 1000);

      delta.x = delta.y = 0;
    });

    var cube = root.spawn('cube');
    
    cube.spawn().triangles().cube().color('black');
    cube.spawn().lines().cube().color('white').scale(1.01).lineWidth(5);

    var canvas = $('.scene');
    var scene  = $('.scene');

    var cam = rmr.camera('root')
                .canvas(canvas)
                .scene(root)
                .eye(eye)
                .perspective();

    $scope.$on('frame', function () {
      canvas.scale();
      cam.project();
      root.verifyTree();
      root.tickTree();
      cam.renderTree();
    });
  }

  return photo;
});
