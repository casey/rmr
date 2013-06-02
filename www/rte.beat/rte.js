'use strict';

define(function(require) {

var rmr = require('all');
var $   = rmr.$;

var rte = {
  path:     '/beat'
, template: require('text!./template.html')
, style:    require('text!./style.css')
, stats:    false
, garbage:  true
};

rte.controller = function ($scope) {
  rmr.info('beat.controller');

  var root      = rmr.node('root').basic();
  var eye       = root.spawn('eye').translateZ(6).chainDriver();
  var cube      = root.spawn('cube').triangles().cube();
  var wireframe = root.find('cube').spawn('wireframe').scale(1.1).color('black').lines().cube();

  var cam = rmr.camera('root').canvas('canvas.main').eye(eye).scene(root).perspective().clearColor('grey');

  rmr.globalize({cam: cam, root: root});

  var beat = 0;

  $scope.$on('keydown', function (e, je, c) {
    if (c === ' ') {
      beat++;
    }
  });

  // how do i establish a bpm?
  // how do i establish a 4/4 sync?
  // how do i keep it from going crazy if i mess up a beat?
  // how do i correct it if it goes off?

  // hang beats, where everything gets maintained, but nothing happens
  // drop beats, where extra stuff happens, or it happens extra much

  // just assume a 4/4 signature

  // time to next beat (estimated)
  // time since last beat
  // whether or not a beat has happened since the last frame
  // absolute beat number
  // estimated beats per minute
  // beat number for a given time signature
  //   beat_number(4, 0) -> 0
  //   beat_number(4, 1) -> 1
  //   beat_number(4, 5) -> 1
  //   beat_number(3, 5) -> 2

  // what should be triggered?
  // . instant events that are scheduled for a given beat/time signature
  // . time tracking events that take
  //   the time until the next beat
  //   the time since the last beat
  //   the estimated [0, 1) time between beats
  
  // stuff that just goes off of the intensity of the audio
  // stuff that detects transitions

  $scope.$on('frame', function (e, now, dt, count) {
    $scope.beat = beat;
    var mod_2  = beat % 2;
    var mod_4  = beat % 4;
    var step_2 = (beat / 2).floor();
    var step_4 = (beat / 4).floor();

    if (mod_2 === 0) {
      if (step_2 % 2) {
        wireframe.color('white');
      } else {
        wireframe.color('black');
      }
    }

    if (mod_4 === 0) {
      if (step_4 % 2) {
        cube.color('black');
      } else {
        cube.color('white');
      }
    }

    cam.tick(); 
  });
};

return rte;

});
