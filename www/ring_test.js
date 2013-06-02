'use strict';

define(function(require) {
  var rmr = require('rmr');

  module('rmr.ring');
  test('basics', function () {
    var r = rmr.ring(100);
    rmr.garbageAllowed(false);

    throws(function () {
      rmr.ring(10);
    });

    ok(r);

    equal(r.capacity(), 100);

    equal(r.count(), 0);

    throws(function () {
      r.get(0);
    });

    r.write(1);
    equal(r.get(0), 1);

    r.write(2);
    equal(r.get(0), 1);
    equal(r.get(1), 2);

    equal(r.drop(), 1);
    equal(r.drop(), 2);

    throws(function () {
      r.drop();
    });

    equal(r.sum(), 0);

    r.write(10);

    equal(r.sum(), 10);

    r.write(100);

    equal(r.sum(), 110);

    for (var i = 0; i < 1000; i++) {
      r.write(0);
    }

    equal(r.sum(), 0);

    while (r.count() > 0) {
      r.drop();
    }

    while(!r.full()) {
      r.write(7);
    }

    equal(r.sum(), 7 * 100);
    equal(r.mean(), 7);
    equal(r.get(0), 7);

    r.write(10);

    var sum = 0;
    for (var i = 0 ; i < r.count(); i++) {
      sum += r.get(i);
    }
    equal(sum, 703);

    while (r.count() > 0) {
      r.drop();
    }

    equal(r.sum(), 0);

    while(!r.full()) {
      r.write(1);
    }

    equal(r.sum(), r.capacity());

    r.write(10);

    equal(r.sum(), r.capacity() + 9);

    rmr.garbageAllowed(true);
  });
});
