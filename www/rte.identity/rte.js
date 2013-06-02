'use strict';

/*
romrador:

lots of mannerisms from the rock
bouncing up and down when excited
sometimes doesn't make eye contact, eyes looking around
gets excited and repeats words
speaks in third person
sometimes cowardly

some of my manic characteristics
genius level intellect
totally unconcerned with normalcy
lateral, out of the box thinking
sleeps very little
extremely impulsive
very sexual

lots of extremely shady connections

* some of my personality
no respect for authority
programmer
loves masks

weaknesses
arrogance
insomnia
overconfidence
impulsiveness
*/

define(function(require) {

var rmr = require('all');
var $   = rmr.$;

var rte = {
  path:     '/identity',
  template: require('text!./template.html'),
  style:    require('text!./style.css'),
  stats:    false
};

rte.controller = function ($scope) {
  /*
  rmr.info('skeleton.controller');

  var root = rmr.node('root').basic();
  var eye  = root.spawn('eye').translateZ(6).chainDriver();

  root.spawn('axes').triangles().axes();

  var cam = rmr.camera('root').canvas('canvas.main').eye(eye).scene(root).perspective().clearColor('black');

  rmr.globalize({cam: cam, root: root});

  $scope.$on('frame', function () { cam.tick(); });
  */
};

return rte;

});
