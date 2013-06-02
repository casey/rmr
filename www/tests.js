'use strict';

define(function(require) {
  var qunit = require('qunit');
  qunit.config.autostart = false;

  var tests = [];
  tests.push('rmr_test');
  tests.push('ring_test');
  tests.push('ct_test');

  require(tests, function () {
    qunit.load();
    qunit.start();
  });
});
