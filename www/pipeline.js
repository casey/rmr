'use strict';

define(function(require) {

var rmr = require('rmr');

var pipeline = rmr.pipeline = function () {
  var x = rmr.new(this, pipeline);
  if (this !== x) return pipeline.apply(x, arguments);

  this._data = [];

  this._verbose = false;

  return this;
};

pipeline.prototype.verbose = function (v) {
  if (arguments.length === 0) {
    return this._verbose;
  }
  this._verbose = !!v;
  return this;
};

pipeline.prototype.range = function (n) {
  arguments.length === 1 || rmr.die('pipeline.range: arguments: ', arguments);
  for (var i = 0; i < n; i++) {
    this._data.push(i);
  }

  this.verbose() && this.log();

  return this;
};

pipeline.prototype.smear = function (n) {
  arguments.length === 1 || rmr.die('pipeline.smear: arguments: ', arguments);

  var l = this._data.length;
  var nl = l * n;

  
  var src  = this._data;
  var dest = [];
  dest.length = this._data.length * n;

  for (var i = 0; i < nl; i++) {
    dest[i] = src[Math.floor(i / n)];
  }

  this._data = dest;

  this.verbose() && this.log();
  return this;
};

pipeline.prototype.and = function () {
  var l = this._data.length;
  var argc = arguments.length;
  l % argc === 0 || rmr.die('pipeline.and: argc and data length mismatch: ' + argc + ' / ' + l)

  for (var i = 0; i < l; i++) {
    this._data[i] = this._data[i] & arguments[i % argc];
  }

  this.verbose() && this.log();
  return this;
};

pipeline.prototype.bin = function () {
  for (var i = 0; i < this._data.length; i++) {
    this._data[i] = this._data[i] ? 1.0 : 0.0;
  }
  this.verbose() && this.log();
  return this;
};

pipeline.prototype.sub = function () {
  var l = this._data.length;
  var argc = arguments.length;
  l % argc === 0 || rmr.die('pipeline.sub: argc and data length mismatch: ' + argc + ' / ' + l)

  for (var i = 0; i < l; i++) {
    this._data[i] = this._data[i] - arguments[i % argc];
  }

  this.verbose() && this.log();
  return this;
};

pipeline.prototype.mul = function () {
  var l = this._data.length;
  var argc = arguments.length;
  l % argc === 0 || rmr.die('pipeline.mul: argc and data length mismatch: ' + argc + ' / ' + l)

  for (var i = 0; i < l; i++) {
    this._data[i] = this._data[i] * arguments[i % argc];
  }

  this.verbose() && this.log();
  return this;
};

pipeline.prototype.take = function (by) {
  var dest = [];
  var src  = this._data;
  var argc = arguments.length
  var vecc = argc - 1;
  var l    = this._data.length;

  for (var i = 0; i < vecc; i++) {
    var base = arguments[i + 1];

    for (var j = 0; j < by; j++) {
      dest[i * by + j] = src[base * by + j];
    }
  }

  this._data = dest;

  this.verbose() && this.log();
  return this;
};

pipeline.prototype.log = function () {
  rmr.log(this._data);
  return this;
};

pipeline.prototype.tap = function (f) {
  f(this._data);
  return this;
};

pipeline.prototype.push = function (s) {
  var dest = [];

  for (var i = 0; i < this._data.length; i++) {
    dest.push(this._data[i]);
    if (i % s === s - 1) {
      for (var j = 1; j < arguments.length; j++) {
        dest.push(arguments[j]);
      }
    }
  }

  this._data = dest;

  this.verbose() && this.log();
  return this;
};

pipeline.prototype.pop = function (s, n) {
  var dest = [];

  for (var i = 0; i < this._data.length; i++) {
    if (i % s < (s - n)) {
      dest.push(this._data[i]);
    }
  }

  this._data = dest;

  this.verbose() && this.log();

  return this;
};

pipeline.prototype.map = function (s, f) {
  var dest = [];

  var l = this._data.length;

  l % s === 0 || rmr.die('pipeline.map: uneven');

  var rlen = null;
  for (var i = 0; i < this._data.length; i += s) {
    var result = f(this._data.slice(i, i + s));

    if (rlen === null) {
      rlen = result.length;
    } else {
      result.length !== rlen && rmr.die('pipeline.map: uneven results');
    }

    for (var j = 0; j < result.length; j++) {
      dest.push(result[j]);
    }
  }

  this._data = dest ;

  this.verbose() && this.log();
  
  return this;
};

pipeline.prototype.data = function () {
  return this._data;
};

pipeline.prototype.f32 = function () {
  return new Float32Array(this._data);
};

return rmr;

});
