'use strict';

define(function(require) {

var rmr = require('all');

// awesome css/html keyboard by Dustin Cartwright - http://noxxten.com

var rte = {
  path:     '/keys'
, template: require('text!lib/keyboard.html')
, style:    require('text!lib/keyboard.css' )
, stats:    false
};

rte.controller = function ($scope, $) {
  rmr.info('keys.controller');

  $scope.$on('frame', function () { 
    for (var name in rmr.key) {
      var key = rmr.key[name];

      if (typeof key.pressed !== "function") continue;

      if (key.pressed() || key.released()) { 
        var e = $('.c' + key.code());
        key.down() ? e.addClass('keydown') : e.removeClass('keydown');
      }
    }
  });
};

return rte;

});
