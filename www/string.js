'use strict';

define(function(require) {
var rmr = require('rmr');

var extensions = Object.create(null);

extensions.IS_STRING = true;

extensions.choice     = function ()    { return this[rmr.randomIndex(this.length)]; };
extensions.startswith = function (str) { return this.indexOf(str) === 0;            };

extensions.words = (function () {
  var whitespace = /\s+/;
  return function () {
    return this.trim().split(whitespace);
  };
}());

var victim = "".__proto__;
for (var name in extensions) {
  if (victim[name] !== undefined) {
      rmr.die('rmr.string: adding duplicate property: ' + name, i);
  }
  Object.defineProperty(victim, name, {value: extensions[name]});
}

return rmr;
});
