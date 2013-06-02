'use strict';

define(function(require) {
var rmr = require('rmr');

require('shim');

//var context = new AudioContext();

var audible = rmr.ilk('audible');

// todo: audible ilk probably won't require glod
audible.render    = function (glod, nodes) { };
audible.node.play = function (sound) { };

Object.seal(audible);

});
