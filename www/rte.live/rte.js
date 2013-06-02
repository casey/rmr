'use strict';

define(function(require) {

var rmr = require('all');
var $   = rmr.$;

require('glod');
require('camera');

var rte = {
  path:     '/live'
, template: require('text!./template.html')
, style:    require('text!./style.css')
, stats:    false
};

var cfg_getUserMedia = !!1;
var cfg_audioOut     = !!0;
var cfg_stress       = !!1;
var cfg_quick        = !!0;
var cfg_left         = 'square';
var cfg_right        = 'color';

var factories     = require('./factories');

if (cfg_quick) {
  delete factories['spirals'];
  delete factories['nebula'];
  delete factories['field'];
  delete factories['plants'];
  delete factories['glyph'];
}

var is3D     = function (node) { return node.prop('type') === '3d'   ;  };
var isOrtho  = function (node) { return node.prop('type') === 'ortho';  };
var isAspect = function (node) { return node.prop('type') === 'aspect'; };

rte.controller = function ($scope, stats) {
  $scope.buckets = 10;

  var last_something = Date.now();
  var next_something = last_something;
  var autopilot = true;

  var root = rmr.node().basic();

  var eye  = root.spawn().translate(0, 0, 15);

  var instances     = Object.create(null);
  var abbreviations = Object.create(null);

  for (var name in factories) {
    var a = name.substring(0, 2);
    a.length === 2 || rmr.die('bad factory name:', name);
    if (abbreviations[a]) rmr.die('duplicate abbreviation: ', name, a);
    abbreviations[a] = name;

    rmr.info('invoking factory:', name, a);

    var node = factories[name]();

    instances[name] = node;
    node.getPropSetDefault('type', '3d');
    is3D(node) || isOrtho(node) || isAspect(node) ||  rmr.die('bad type:', node.prop('type'));

    if (is3D(node)) {
      (function () { 
        node.chainTick(function (_, now, dt) {
          //_.scale(1 + window.intensity * 0.01);
          _.rotate(0.00005 * dt, 0, 0.5, 0.5);
        });
      })();
    }

    root.adopt(node);
  }

  var ac   = new AudioContext();
  var ax   = ac.createAnalyser();
  var gain = ac.createGain();

  gain.connect(ax);
  cfg_audioOut && gain.connect(ac.destination)

  var main    = rmr.camera().analyser(ax).cull(true).passOff('ssaa', 'glow').canvas('canvas.main');
  var left    = main.spawn().passOff('clear');
  var right   = main.spawn().passOff('clear');

  main.opening('.opening');

  ax.smoothingTimeConstant = 0.0;

  function ok(stream) {
    ac.createMediaStreamSource(stream).connect(gain);
  }

  if (cfg_getUserMedia) {
    navigator.getUserMedia({audio:true}, ok, rmr.bad);
  } else {
    var os = ac.createOscillator();
    os.frequency.value = 250;
    os.connect(gain);
    os.noteOn(0);
  }

  var text = function (s) {
    var w = 30;
    var h = 15;
    var count = w * h;

    var grid = $('.grid');

    var raw = [];

    for (var y = 0; y < h; y++) {
      var row = $('<div class="grid-row">')
      grid.append(row);
      for (var x = 0; x < w; x++) {
        var cell = $('<div class="grid-cell">');
        raw.push(cell[0]);
        row.append(cell);
      }
    }
   
    var rows  = $('.grid-row');
    var cells = $('.grid-cell');

    rows.css('height', (100 / h) + '%');
    cells.css('width', (100 / w) + '%');
    
    var start       = rmr.now();
    var transitions = [1000, 4000, 3000, 4000];

    root.chainTick(function () {
      var elapsed = rmr.now() - start;

      var state = transitions.length;
      var end = 0;
      var progress = 0;
      for (var i = 0; i < transitions.length; i++) {
        var begin = end;
        end += transitions[i];
        if (elapsed > begin && elapsed < end) {
          state = i;
          progress = (elapsed - begin) / (end - begin);
          break;
        }
      }

      var chance = 0;
      var gen    = function () { return ' '; }

      switch (state) {
        case 0:                                                                           break; // still
        case 1: chance = progress; gen = function (i) { return s[i % s.length];        }; break; // appear
        case 2: chance = 0.01;     gen = function (i) { return rmr.printable.choice(); }; break; // randomize
        case 3: chance = progress; gen = function (i) { return ' ';                    }; break; // disappear
        default: grid.empty(); return true;                                              break; // done
      }

      for (var i = 0; i < raw.length; i++) {
        if (rmr.maybe(chance)) {
          raw[i].innerHTML = gen(i);
        }
      }

    });
  };

  var gamepad_inverted = false;

  var gamepadCount = 0;
  var gamepad_lock = false;
  var flags = [
    function () { return autopilot           ? 'A' : 'a'; } // autopilot
  , function () { return main.pass('invert') ? 'I' : 'i'; } // inverted
  , function () { return g.rmr.dead          ? 'D' : 'd'; } // dead
  , function () { return gamepad_lock        ? 'L' : 'l'; }
  , function () { return gamepad_inverted    ? 'Z' : 'z'; }
  , function () { return left.hidden()       ? 'X' : 'x'; } // blackout
  , function () { return gamepadCount;                    } // gamepad count
  ];

  $scope.left  = '';
  $scope.right = '';

  var set_mode = function (name, r) {
    var node = instances[name];

    if (!node) {
      rmr.log('set_mode: bad mode name:', name);
      return;
    }

    var camera = r ? right : left;

    var a = name.substring(0, 2);
    if (r) $scope.right = a;
    else   $scope.left  = a;

    camera.scene(node);

    if     (is3D    (node)) { camera.eye(eye);  camera.perspective();                 }
    else if(isAspect(node)) { camera.eye(null); camera.aspect();                      }
    else if(isOrtho (node)) { camera.eye(null); camera.orthographic();                }
    else                    { rmr.die('set_mode: unknown type: ', node.prop('type')); }
  };

  var set_left   = function (name) { set_mode(name, false); };
  var set_right  = function (name) { set_mode(name, true ); };

  var transition = function (n) { 
    /*
    rc.css('opacity', n);
    if (n > 0.99) { rc.show(); lc.hide(); }
    if (n < 0.01) { rc.hide(); lc.show(); }
    else          { rc.show(); lc.show(); }
    */
  };

  set_left (cfg_left);
  set_right(cfg_right);

  var chars = [];
  var ex = false;

  var line   = '';
  var output = false;

  var normal_cmd    = rmr.cmd();
  var ex_cmd        = rmr.cmd();
  var active_cmd    = normal_cmd;
  var start_normal  = function () { active_cmd = normal_cmd; chars.length = 0; update_line(); };
  var start_ex      = function () { active_cmd = ex_cmd;                       update_line(); };
  var ex_active     = function () { return active_cmd === ex_cmd;                           };
  var normal_active = function () { return active_cmd === normal_cmd;                       };


  var get_buckets = function () {
    return (Math.log(ax.fftSize) / Math.LN2) - 1;
  }

  var set_buckets = function (b) {
    var i = b.round().clamp(4, 10);
    ax.fftSize = 1 << (i + 1);
  };

  var gain_up    = function () { gain.gain.value *= 1.1; };
  var gain_down  = function () { gain.gain.value *= 0.9; };
  var gain_reset = function () { gain.gain.value  = 1.0; };

  var stress_pairs = [];

  for (var a in factories) {
    for (var b in factories) {
      if (a === "empty" || b === "empty") continue;
      stress_pairs.push([a, b]);
    }
  }

  rmr.log(stress_pairs.length);

  var temp_pairs = [];
  while(stress_pairs.length > 0) {
    var i = Math.floor(Math.random() * stress_pairs.length);
    temp_pairs.push(stress_pairs[i]);
    stress_pairs.splice(i, 1);
  }

  stress_pairs = temp_pairs;

  var stress_on = false;

  var stress = function () {
    if (!cfg_stress) return;

    stress_on = !stress_on;

    if (!stress_on) return;

    for (var j = 0; j < 4; j++) {
      for (var i in normal_cmd._handlers) {
        var h = normal_cmd._handlers[i];
        if (h === stress) continue;
        h();
      }
    }

    $scope.cheat = false;
    start_normal();

    var index = 0;

    root.chainTick(function () {
      if (!stress_on) return true;
      var a = stress_pairs[index % stress_pairs.length][0];
      var b = stress_pairs[index % stress_pairs.length][1];
      set_left (a, false);
      set_right(b, true );
      transition(Math.random());
      index++;
    });

    //commands.l('sk'); commands.l('field');
    //commands.r('co'); commands.r('colors');
  };

  var value = 0;
  var set_value = function (n) { value = n.clamp(0, 1); }

  var canvas = main.canvas();

  $('.line').toggle();

  normal_cmd
  .on('a',     function () { autopilot = !autopilot;                   })
  .on(':',     function () { start_ex();                               })
  .on('i',     function () { canvas.toggleClass('invert');             })
  .on('z',     function () { gamepad_inverted = !gamepad_inverted;     })
  .on('b',     function () { set_buckets(get_buckets() - 1);           }) // buckets--
  .on('B',     function () { set_buckets(get_buckets() + 1);           }) // bucekts++
  .on('g',     function () { gain_down();                              }) // gain--
  .on('G',     function () { gain_up() ;                               }) // gain++
  .on('alt-g', function () { gain_reset();                             }) // reset gain
  .on('l',     function () { gamepad_lock = !gamepad_lock              }) // toggle gamepad lock
  .on('r',     function () { eye.clearTransform().translate(0, 0, 15); })
  .on('h',     function () { $('.line').toggle();                      })
  .on('m',     function () { next_mode();                              })
  .on('s',     function () { 
    var l = abbreviations[$scope.left];
    var r = abbreviations[$scope.right];
    if (l && r) {
      set_left (r);
      set_right(l);
    }
  })
  .on('x', function () { left.toggle(); right.toggle(); })

  .on('C', function () { $scope.cheat = !$scope.cheat;       })

  /*
  .on('`', '~', function () { set_value(0.0        ); })
  .on('1', '!', function () { set_value(0.1        ); })
  .on('2', '@', function () { set_value(0.2        ); })
  .on('3', '#', function () { set_value(0.3        ); })
  .on('4', '$', function () { set_value(0.4        ); })
  .on('5', '%', function () { set_value(0.5        ); })
  .on('6', '^', function () { set_value(0.6        ); })
  .on('7', '&', function () { set_value(0.7        ); })
  .on('8', '*', function () { set_value(0.8        ); })
  .on('9', '(', function () { set_value(0.9        ); })
  .on('0', ')', function () { set_value(1.0        ); })
  .on('-', '_', function () { set_value(value - 0.1); })
  .on('=', '+', function () { set_value(value + 0.1); })
  */
  .on('space',       function () { window.beat++; })
  .on('shift-space', function () { window.beat--; if (window.beat < 0) window.beat = 0;})
  .on('alt-space',   function () { window.beat = 0; })
  .on('ctrl-t', stress)
  ;

  var commands = {
    l:    function (mode) { set_left  (abbreviations[mode.substring(0, 2)]); }
  , r:    function (mode) { set_right (abbreviations[mode.substring(0, 2)]); }
  , text: function ()     { text      (rmr.arga(arguments).join(' '))       ; }
  };

  ex_cmd
  .on('return', function () {
    var command = chars.join('');
    var args    = command.words();
    var name    = args.shift();

    start_normal();

    rmr.log('command:', name, args);

    var candidate = commands[name];
    if (typeof candidate === 'function') {
      candidate.apply(undefined, args);
    }
  })
  .on('delete', function () { chars.length > 0 ? chars.pop() : start_normal(); update_line(); })
  .on('escape', function () { start_normal();                                                 })
  .on('ctrl-j', function () { start_normal();                                                 })
  .on('space',  function () { chars.push(' '); update_line();                                 })
  ;

  // available instances
  for (var name in factories) {
    $('.cheat').append(name + '<br>');
  };

  // cheat sheet ex commands
  var cheat_commands = Object.keys(commands);
  for (var i = 0; i < cheat_commands.length; i++) {
    var name = cheat_commands[i];
    $('.cheat').append(':' + name + '<br>')
  }

  // cheat sheet normal commands
  for (var name in normal_cmd._commands) {
    var s = normal_cmd._commands[name].toString();
    var body_start = s.indexOf("{");
    var body_end   = s.lastIndexOf("}");
    var body = s.substring(body_start + 1, body_end);
    $('.cheat').append(name.toUpperCase() + ' -> ' + body.substring(0, 50) + '<br>');
  }

  var update_line = function() { line = ex_active() ? (':' + chars.join('') + '█') : ''; };

  var ex_chars = rmr.printable;
  for (var i = 0; i < ex_chars.length; i++) {
    (function () {
      var c = ex_chars[i]; 
      ex_cmd.on(c, function () { chars.push(c); update_line(); });
    })();
  }

  $scope.$on('keydown', function (e, je, c) { active_cmd.event(je); });

  $scope.$on('mousemove', function (e, je) {
    if (rmr.key.mouse_left.down()) {
      delta.x += lastPosition.x - je.pageX;
      delta.y += lastPosition.y - je.pageY;
    }

    lastPosition.x = je.pageX;
    lastPosition.y = je.pageY;

    je.preventDefault();
  });

  $scope.$on('mousedown', function (e, je) {
    je.preventDefault();
  });

  var dx     = 0;
  var dy     = 0;
  var dz     = 0;
  var droll  = 0;
  var dyaw   = 0;
  var dpitch = 0;

  var lastPosition = {x: 0, y: 0};
  var delta        = {x: 0, y: 0};

  /*
  eye.chainTick(function (_, now, dt) {
    if (gamepad_inverted) dt = -dt; // lol arrow of time
    dt *= 1 + window.intensity;
    _.translate(dt * dx, dt * dy, dt * dz);
    _.rotateX(dt * dpitch);
    _.rotateZ(dt * droll);
    _.rotateY(dt * dyaw );
    _.rotateY(-delta.x / 1000);
    _.rotateX(-delta.y / 1000);

    delta.x = delta.y = 0;
  });
  */

  var actions = [];

  var action = function (weight, f) {
    actions.push([weight, f]);
  };

  var mode_index = 0;
  //var change_interval = 45 * 1000;
  var change_interval = 500;
  var next_change = Date.now() + change_interval;
  var next_mode = function () {
    var a = stress_pairs[mode_index % stress_pairs.length][0];
    var b = stress_pairs[mode_index % stress_pairs.length][1];
    set_left (a, false);
    set_right(b, true );
    mode_index++;
    next_change = Date.now() + change_interval;
  };

  action(3.0, function () { window.beat++;                                       }); // beat++
  action(1.0, function () { window.beat--; if (window.beat < 0) window.beat = 0; }); // beat--
  action(0.1, function () { window.beat = 0;                                     }); // beat = 0;
  action(0.01, function () { canvas.toggleClass('invert');                        }); // invert color
  //action(1, function () { gain_up();                                           }); // gain up
  //action(1, function () { gain_down();                                         }); // gain down
  //action(1, function () { gain_reset();                                        }); // gain reset
  //action(1, function () { next_mode();                                        }); // next mode
  action(1, function () { set_buckets(get_buckets() - 1);                      }); // buckets--
  action(1, function () { set_buckets(get_buckets() + 1);                      }); // buckets++
  action(0.1, function () { set_buckets(10);                                     }); // reset buckets
  action(0.1, function () { gamepad_inverted = !gamepad_inverted;                }); // invert movement
  action(0.1, function () { eye.clearTransform().translate(0, 0, 15);            }); // reset position
  action(10, function () { // set joystick
    var ts = 0.01;
    var rs = 0.0001 * rmr.TAU;
    dx     += (rmr.random() - 0.5) * 0.01 * ts;
    dy     += (rmr.random() - 0.5) * 0.01 * ts;
    dz     += (rmr.random() - 0.5) * 0.01 * ts;
    droll  += (rmr.random() - 0.5) * 0.01 * rs;
    dpitch += (rmr.random() - 0.5) * 0.01 * rs;
    dyaw   += (rmr.random() - 0.5) * 0.01 * rs;
  });
  action(0.1, function () { // set joystick
    var ts = 0.01;
    var rs = 0.0001 * rmr.TAU;
    dx     = 0;
    dy     = 0;
    dz     = 0;
    droll  = 0;
    dpitch = 0;
    dyaw   = 0;
  });
  action(0.01, function () { // swap left and right
    var l = abbreviations[$scope.left];
    var r = abbreviations[$scope.right];
    if (l && r) {
      set_left (r);
      set_right(l);
    }
  });

  var weight_sum = 0;
  actions.map(function (x) { weight_sum += x[0]; });
  actions.map(function (x) { x[0] /= weight_sum; });

  $scope.$on('frame', function (e, now, dt, count) {
    $scope.buckets = get_buckets();

    var t = value;
    transition(t);

    /*
    if (!gamepad_lock) dx = dy = dz = droll = dyaw = dpitch = 0;

    $scope.a0 = $scope.a1 = $scope.a2 = 
    $scope.a3 = $scope.a4 = $scope.a5 = 0;

    var gamepads = navigator.getGamepads();
    gamepadCount = 0;
    for (var i = 0; i < gamepads.length; i++) {
      var gamepad = gamepads[i];

      if (!gamepad) continue;
      if (!gamepad.axes.length === 6) {
        rmr.log('got weird gamepad:', gamepad.id);
        continue;
      }
      gamepadCount++;

      var axes = gamepads[i].axes;

      var gx     =  axes[0];
      var gy     = -axes[2];
      var gz     =  axes[1];
      var groll  =  axes[4];
      var gpitch =  axes[3];
      var gyaw   = -axes[5];

      $scope.a0 = gx;
      $scope.a1 = gy;
      $scope.a2 = gz;
      $scope.a3 = groll;
      $scope.a4 = gpitch;
      $scope.a5 = gyaw;

      var ts = 0.01;
      var rs = 0.0001 * rmr.TAU;

      if (!gamepad_lock) {
        dx     = gx     * ts;
        dy     = gy     * ts;
        dz     = gz     * ts;
        droll  = groll  * rs;
        dpitch = gpitch * rs;
        dyaw   = gyaw   * rs;
      }
    }
    */

    $scope.a0 = 0;
    $scope.a1 = 0;
    $scope.a2 = 0;
    $scope.a3 = 0;
    $scope.a4 = 0;
    $scope.a5 = 0;

    // keyboard controls
    /*
    dx     = (rmr.key.f.down() - rmr.key.a        .down()) * 0.001;
    dy     = (rmr.key.d.down() - rmr.key.s        .down()) * 0.001;
    droll  = (rmr.key.j.down() - rmr.key.semicolon.down()) * 0.0001 * rmr.TAU;
    dpitch = (rmr.key.l.down() - rmr.key.k        .down()) * 0.0001 * rmr.TAU;
    */

    $scope.beat = window.beat;

    $scope.time      = now;
    $scope.flags     = flags.map(function (x) { return x() }).join('');
    $scope.line      = line;
    $scope.output    = output

    $scope.framerate = stats.lastFrameTime;

    var p = t;
    p = Math.round(p * 100);
    if (p >= 99) p = 'A0';
    if (p <  10) p = '0' + p;
    $scope.progress  = p;

    var g = gain ? gain.gain.value : 1.0;
    g = g < 0.01 ? '-∞' : Math.round(g.ratioToDb() * 10) / 10;
    if (g >= 0) g = '+' + g;
    $scope.gain = g;

    var something = function () {
      if (!autopilot) return;
      var x = rmr.random();
      for (var i = 0; i < actions.length; i++) {
        var weight = actions[i][0];
        var f      = actions[i][1];
        if (x < weight) {
          f();
          break;
        }
        x -= weight;
      }
      last_something = now;
    };

    if (autopilot) {
      if (now > next_change) { next_mode(); }
      // every frame
      //something(); 
      
      // random chance per frame
      //if (rmr.random() > 0.75) something(); 
      
      // every N MS
      //if (now - last_something > 15 * 1000) something();

      // every X-Y seconds
      if (now > next_something) { something(); next_something = now + 1000 + rmr.random() * 3000; }
    }

    main.tick();
  });

  rmr.globalize({rmr: rmr, main: main, left: left, /*right: right, */root: root});
};

return rte;

});
