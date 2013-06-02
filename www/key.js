'use strict';

define(function(require) {

var $   = require('$');
var rmr = require('rmr');
var _   = require('_');

rmr.key = {};

rmr.key.codes = {control: 17, right: 39, left_bracket: 219, left_super: 91, period: 190, backtick: 192, up: 38, down: 40, capslock: 20, colon: 59, right_super: 93, tab: 9, escape: 27, alt: 18, shift: 16, numlock: 144, space: 32, equal: 61, comma: 188, 1: 49, 0: 48, 3: 51, 2: 50, 5: 53, 4: 52, 7: 55, 6: 54, 9: 57, 8: 56, slash: 191, enter: 13, right_bracket: 221, backslash: 220, backspace: 8, apostrophe: 222, a: 65, c: 67, b: 66, e: 69, d: 68, g: 71, f: 70, i: 73, h: 72, k: 75, j: 74, m: 77, l: 76, o: 79, n: 78, q: 81, p: 80, s: 83, r: 82, u: 85, t: 84, w: 87, v: 86, y: 89, x: 88, z: 90, minus: 189, equals: 187, left: 37, semicolon: 186};

var mouse_start = 256;
rmr.key.codes.mouse_left   = mouse_start + 0;
rmr.key.codes.mouse_middle = mouse_start + 1;
rmr.key.codes.mouse_right  = mouse_start + 2;

rmr.key.names = _.invert(rmr.key.codes);

rmr.key.state    = {};
rmr.key.pressed  = {};
rmr.key.released = {};

rmr.key.clear = function() {
  for (var name in rmr.key.pressed ) rmr.key.pressed [name] = false;
  for (var name in rmr.key.released) rmr.key.released[name] = false;
};

function keyup  (code) {
  rmr.key.released[code] = true;
  rmr.key.state   [code] = false; 
}

function keydown(code) {
  if (rmr.key.state[code]) {
    return;
  }

  rmr.key.pressed[code] = true;
  rmr.key.state  [code] = true;
}

$(document).keyup    (function(e) { keyup  (e.keyCode             ); });
$(document).keydown  (function(e) { keydown(e.keyCode             ); });
$(document).mouseup  (function(e) { keyup  (mouse_start + e.button); });
$(document).mousedown(function(e) { keydown(mouse_start + e.button); });

// might want these later:
// $(window).blur (function(){ rmr.log('window blur' ); });
// $(window).focus(function(){ rmr.log('window focus'); });

var key = function Key (code) {
  var x = rmr.new(this, Key);
  if (this !== x) return Key.apply(x, arguments);
  this._code = code;
  return this;
};

key.prototype.code     = function () { return this._code;                     };
key.prototype.name     = function () { return   rmr.key.names   [this._code]; };
key.prototype.down     = function () { return !!rmr.key.state   [this._code]; };
key.prototype.pressed  = function () { return !!rmr.key.pressed [this._code]; };
key.prototype.released = function () { return !!rmr.key.released[this._code]; };
key.prototype.up       = function () { return !this.down();                   };

for (var name in rmr.key.codes) {
  var code = rmr.key.codes[name];
  if (name in rmr.key) {
    rmr.die('rmr.key: extant property "' + name + '"');
    continue;
  }
  rmr.key[name] = key(code);
};

return rmr;
});
