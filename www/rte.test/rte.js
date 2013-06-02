'use strict';

define(function(require) {
  var rmr = require('all');

  var test = {
    path:     '/test',
    template: require('text!./template.html'),
    stats:    false
  };

  test.controller = function ($scope) {
    require(['tests']);
  };

  return test;
});
