
'use strict';

define(function(require) {
var rmr = require('rmr');

var extensions = Object.create(null);

extensions.IS_NUMBER = true;

extensions.clamp = function (opt_min, opt_max) {
  var min = opt_min === undefined ? -Infinity : opt_min;
  var max = opt_max === undefined ?  Infinity : opt_max;
  return Math.min(Math.max(this.nan() ? 0 : this, min), max);
};

extensions.nan = function () { return isNaN(this); };

extensions.hex       = function () { return this.toString(16);               };
extensions.HEX       = function () { return this.hex().toUpperCase();        };
extensions.ratioToDb = function () { return 10 * Math.log(this) / Math.LN10; };

extensions.abs   = function () { return Math.abs  (this); };
extensions.acos  = function () { return Math.acos (this); };
extensions.asin  = function () { return Math.asin (this); };
extensions.atan  = function () { return Math.atan (this); };
extensions.ceil  = function () { return Math.ceil (this); };
extensions.cos   = function () { return Math.cos  (this); };
extensions.exp   = function () { return Math.exp  (this); };
extensions.floor = function () { return Math.floor(this); };
extensions.log   = function () { return Math.log  (this); };
extensions.round = function () { return Math.round(this); };
extensions.sin   = function () { return Math.sin  (this); };
extensions.sqrt  = function () { return Math.sqrt (this); };
extensions.tan   = function () { return Math.tan  (this); };

extensions.even = function () { return this % 2 === 0; };
extensions.odd  = function () { return this % 2 === 1; };

// todo: add glsl functions

var victim = (0).__proto__;
for (var name in extensions) {
  if (victim[name] !== undefined) {
      rmr.die('rmr.number: adding duplicate property: ' + name, i);
  }
  Object.defineProperty(victim, name, {value: extensions[name]});
}

return rmr;
});
