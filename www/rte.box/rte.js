'use strict';

define(function(require) {

var rmr = require('all');
var $   = rmr.$;

var box = {
  path:     '/box',
  template: '<canvas class="main"></canvas>'
};

box.controller = function ($scope) {
  rmr.info('box.controller');

  var root = rmr.node('root').basic();
  var eye  = root.spawn('eye').translateZ(6).chainDriver();

  root.spawn('axes').triangles().axes();

  var cam = rmr.camera('root').canvas('canvas.main').eye(eye).scene(root).perspective().clearColor('black');

  rmr.globalize({cam: cam, root: root});

  $scope.$on('frame', function () { cam.tick(); });
};

return box;

});
