'use strict';

/*
  what if i use rhythm game style cues to remind me of important events?
  * guitar hero style approaching object
  * countdown
  * hold shift and hit key to trigger action on next event
  * video events and 
*/

define(function(require) {
  var rmr = require('all');

  var start = {
    path    : '/start'
  , template: require('text!./template.html')
  , style   : require('text!./style.css')
  };

  start.controller = function ($scope) {
    var e = $.ngElement();

    var v = e.find('video')[0];
    var a = e.find('audio')[0];

    window.v = v;
    window.a = a;

    v.volume = 0;

    $scope.$on('frame', function () {
      if (rmr.key.u.pressed()) a.play();
      if (rmr.key.i.pressed()) v.play();

      if (rmr.key.j.pressed()) v.currentTime -= 10;
      if (rmr.key.k.pressed()) v.currentTime += 10;

      $scope.atime = a.currentTime;
      $scope.vtime = v.currentTime;

      var at = a.currentTime / a.duration;
      var vt = v.currentTime / v.duration;

      $scope.sync = vt - at;

    });
  };

  return start;
});
