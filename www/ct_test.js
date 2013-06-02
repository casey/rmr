'use strict';

define(function(require) {
  var _   = require('_');

  var rmr = require('ct');

  module('rmr.ct');
  test('basics', function () {
    var canvas = document.createElement('canvas');
    
    var vct = canvas.getContext('2d');
    var rct = rmr.ct(vct);

    window.canvas = canvas;
    window.vct    = vct;
    window.rct    = rct;

    var prefixes = _.words('get set webkit');

    for (var key in vct) {
      var prefix   = '';
      var original = key;

      for(var i = 0; i < prefixes.length; i++) {
        if (key.indexOf(prefixes[i]) === 0) {
          prefix = prefixes[i];
          key = key.replace(RegExp('^' + prefixes[i]), '');
          key = key.replace(/^./, key[0].toLowerCase());
        }
      }

      if (!(key in rct) && !(original in rct)) {
        ok(false, 'key missing in rmr.ct: ' + key + (prefix ? ' prefix: ' + prefix : ''));
      }
    }

    ok(true, 'all methods present');
  });
});
