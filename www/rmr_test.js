'use strict';

define(function(require) {
  var rmr = require('rmr');

  module('rmr.parameters');
  test('parameters', function () {
    var f = function (a, b, c, d) {};
    deepEqual(rmr.parameters(f), ['a', 'b', 'c', 'd']);
  });

  // todo: test rmr entries don't clobber each other
});
