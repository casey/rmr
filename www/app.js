'use strict';

// todo:
//   sane error if webgl doesn't load
//   show message to user if we die

define(function(require) {
  var rmr     = require('rmr'     );

  var angular = require('angular' );
  var $       = require('$'       );

  require('angular-route');

  require('shim');

  var routes = [
    require('rte.error/rte'   )
  , require('rte.gen/rte'     )
  , require('rte.start/rte'   )
  , require('rte.photo/rte'   )
  , require('rte.scratch/rte' )
  , require('rte.pixel/rte'   )
  , require('rte.eq/rte'      )
  , require('rte.lightbox/rte')
  , require('rte.skeleton/rte')
  , require('rte.identity/rte')
  , require('rte.system/rte'  )
  , require('rte.demo/rte'    )
  , require('rte.test/rte'    )
  , require('rte.bitcoin/rte' )
  , require('rte.blaster/rte' )
  , require('rte.splat/rte'   )
  , require('rte.live/rte'    )
  , require('rte.keys/rte'    )
  , require('rte.gif/rte'     )
  , require('rte.rkr/rte'     )
  , require('rte.box/rte'     )
  , require('rte.beat/rte'    )
  ];

  var app = angular.module('app', ['ngRoute']);

  app.factory('stats', function () { return rmr.stats(); });
  app.factory('$'    , function () { return $          ; });
  app.factory('rmr'  , function () { return rmr        ; });

  app.filter('axis', function () {
    return function (n) {
      n = +n;
      var s = (n * 10).round().HEX();
      return s.length === 1 ? (' ' + s) : s;
    };
  });

  app.filter('hex', function () { return function (n) { return !n ? 0 : n.hex();}; })
  app.filter('HEX', function () { return function (n) { return !n ? 0 : n.HEX();}; })

  app.config(function($routeProvider, $locationProvider, $provide) {
    $locationProvider.html5Mode(true);

    for (var i = 0; i < routes.length; i++) {
      var route = routes[i];

      if (route.template === '') {
        route.template = ' ';
      }

      route.path                         || rmr.die('boot: route has no path:', i);
      typeof route.template === "string" || rmr.die('boot: route has no template:', route.path);


      if (route.style) {
        route.template = ['<style scoped>', route.style, '</style>', route.template].join('\n');
      }

      rmr.hint('adding route with path: %s', routes[i].path);
      $routeProvider.when(routes[i].path, routes[i]);
    }
    $routeProvider.otherwise(routes[0]);

    $provide.decorator("$exceptionHandler", function($delegate) {
        return function(exception, cause) {
          rmr.dead = true;
          $delegate.apply($delegate, arguments);
        };
    });
  });


  app.run(function ($rootScope, $location, $timeout, $rootElement, $exceptionHandler, $route, stats, $) {
    stats.element.appendTo(document.body);
    stats.element.css('position', 'absolute');
    stats.element.css('right',    0);
    stats.element.css('bottom',   0);
    
    var garbageAllowed = false;

    $rootScope.$on('$routeChangeSuccess', function(e) {
      for (var i = 0; i < routes.length; i++) {
        var route = routes[i];
        if ($route.current.controller === route.controller) {
          garbageAllowed = route.garbage;
          document.title = 'rmr' + route.path;
          route.stats === false ? stats.hide() : stats.show();
          break;
        }
      }
    });

    $.ngElement = function () {
      var e = $rootElement.find('*[ng-view] > *');
      e.length === 1 || rmr.die("$.ngElement: couldn't find element");
      return e;
    };

    var lastFrame = Date.now();

    var frameCount = 0;

    var dead = false;

    var frame = function() {
      if (rmr.dead) {
        $rootScope.$apply(function () {
            $rootScope.deadReason = rmr.deadReason;
        });
        return; // todo: show some kind of message in this case
      }

      if (frameCount == 0) {
        rmr.allowGarbage();
      } else {
        if (!garbageAllowed) {
          rmr.disallowGarbage();
        }
      }

      var now = Date.now();
      var dt  = now - lastFrame;

      $rootScope.$apply(function () {
          $rootScope.$broadcast('frame', now, dt, frameCount);
          stats.frame();

          if (frameCount === 0) {
            if (window.performance && window.performance.timing) {
              var elapsed = Date.now() - window.performance.timing.navigationStart;
              rmr.info('boot: time to first frame: ', elapsed);
            }
          }
      });

      lastFrame = now;
      rmr.key.clear();
      frameCount++;

      rmr.raf(frame);
    };

    frame();

    rmr.removeSBI();

    var cmd = rmr.cmd();
    cmd.on('alt-s', function () { stats.toggle(); });

    $(window).mousedown(function (e) { $rootScope.$apply(function () { $rootScope.$broadcast('mousedown', e); }); });
    $(window).mousemove(function (e) { $rootScope.$apply(function () { $rootScope.$broadcast('mousemove', e); }); });

    window.addEventListener("dragover", function(e) {
      $rootScope.$apply(function () {
        $rootScope.$broadcast('dragover', e);
      }); 
      e.preventDefault();
    }, false);

    window.addEventListener("drop", function(e) {
      $rootScope.$apply(function () {
        $rootScope.$broadcast('drop', e);
      }); 
      e.preventDefault();
    }, false);

    $(window).keydown (function (e) {
      if (e.metaKey) return;
      e.preventDefault();
      var c = rmr.codeToChar(e.which, e.shiftKey);
      cmd.event(e);
      $rootScope.$apply(function () { $rootScope.$broadcast('keydown', e, c); });
    });
  });

  $(function () { angular.bootstrap(document, ['app']); });
});
