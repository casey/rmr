'use strict';

define(function(require) {
  var rte = {
    path:     '/scratch',
    template: require('text!./template.html'),
    style:    require('text!./style.css')
  };

  rte.controller = function ($scope, $, rmr) {
    $(window).on('storage', function (je) {
      var e = je.originalEvent;
      var value = e.newValue;
      rmr.log(rmr.now() - value);
    });

    rmr.log('scratch.controller');

    $scope.$on('frame', function () { 
      if (rmr.key.a.pressed()) {
        window.localStorage.setItem('now', rmr.now());
      }
    });
  };

  return rte;
});
