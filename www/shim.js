'use strict';

define(function(require) {
  require('audiocontext');

  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame =
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame    ||
      window.oRequestAnimationFrame      ||
      window.msRequestAnimationFrame     ||
      function(callback, element) {window.setTimeout(callback, 1000 / 60); };
  }

  if (!navigator.getUserMedia) {
    navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
  }

  if (!window.console.memory) {
    window.console.memory = {usedJSHeapSize: 0};
  }
});
