'use strict';

define(function(require) {

var rmr = require('rmr');

rmr.cmd = function CMD() {
  var x = rmr.new(this, CMD);
  if (this !== x) return CMD.apply(x, arguments);
  this._handlers = [];
  this._commands = {};
  return this;
};

var SHIFT_BIT = 1 << 10;
var  META_BIT = 1 << 11;
var  CTRL_BIT = 1 << 12;
var   ALT_BIT = 1 << 13;

rmr.cmd.prototype.on = function () {
  var l = arguments.length;
  var s = [];
  var f = [];
  var i;

  for (i = 0; i < l; i++) {
    var a = arguments[i];
    if (typeof a !== "string") break;
    s.push(a);
  }

  s.length > 0 || rmr.die('rmr.cmd.on: no triggers provided');

  for (; i < l; i++) {
    var a = arguments[i];
    typeof a === "function" || rmr.die('rmr.cmd.on: bad argument: ', a);
    f.push(a);
  }

  f.length === 1 || rmr.die('rmr.cmd.on: bad function count:', f);

  var handler = f[0];

  for (i = 0; i < s.length; i++) {
    var parts = s[i].split(' ');
    parts.length === 1 || rmr.die('rmr.cmd.on: spaces reserved for future use:', s[i]);
    var str = parts[0];
    var modifiers = {shift: false, meta: false, ctrl: false, alt: false};

    var found;
    for (;;) {
      found = false;
      for (var name in modifiers) {
        var prefix = name + '-';
        if (str.startswith(prefix)) {
          modifiers[name] = true;
          str = str.substring(prefix.length);
          found = true;
        }
      }
      if (!found) break;
    }

    var code;
    if (str.length === 1) {
      code = rmr.charToCode(str);
      modifiers.shift |= rmr.charToShift(str);
    } else {
      switch(str) {
        case 'delete': code =  8; break;
        case 'return': code = 13; break;
        case 'escape': code = 27; break;
        case 'space' : code = 32; break;
        default:
          rmr.die('rmr.cmd.on: unrecognized string:', str);
      }
    }

    this._commands[str] = handler;

    this.register(code, modifiers.shift, modifiers.meta, modifiers.ctrl, modifiers.alt, handler);
  }

  return this;
};

rmr.cmd.prototype.index = function (which, shift, meta, ctrl, alt) {
  return which
  | (shift ? SHIFT_BIT : 0)
  | (meta  ?  META_BIT : 0)
  | (ctrl  ?  CTRL_BIT : 0)
  | (alt   ?   ALT_BIT : 0);
};

rmr.cmd.prototype.register = function (which, shift, meta, ctrl, alt, handler) {
  var index = this.index(which, shift, meta, ctrl, alt);
  this._handlers[index] && rmr.die('rmr.cmd.register: re-registering handler');
  this._handlers[index] = handler;
};

rmr.cmd.prototype.event = function (e) {
  var t = e.type;
  t === 'keydown' || rmr.die('rmr.cmd.event: unrecognized event type:', t);

  var which = e.which;
  var shift = e.shiftKey;
  var meta  = e. metaKey;
  var ctrl  = e. ctrlKey;
  var alt   = e.  altKey;

  var index = this.index(which, shift, meta, ctrl, alt);

  var h = this._handlers[index];
  h && h();

  return this;
};

return rmr;
});
