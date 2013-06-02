rmr.glod.prototype.construct = function () {
  this._ = {};
  this._.allocators   = {};
  this._.initializers = {};
  this._.phase = 0;
};

rmr.glod.prototype.offPhase   = function () { return this._.phase === 0; };
rmr.glod.prototype.setupPhase = function () { return this._.phase === 1; };
rmr.glod.prototype.readyPhase = function () { return this._.phase === 2; };
rmr.glod.prototype.startOff   = function () { this._.phase = 0; return this; };
rmr.glod.prototype.startSetup = function () { this._.phase = 1; return this; };
rmr.glod.prototype.startReady = function () { this._.phase = 2; return this; };

rmr.glod.prototype.alloc = function (f) {
  var s = f.toString();

  if (!this._.allocators.hasOwnProperty(s)) {
    this._.allocators[s] = true;
    f();
  }

  return this;
};

rmr.glod.prototype.initX = function (f) {
  var s = f.toString();

  if (!this._.initializers.hasOwnProperty(s)) {
    // todo: also run on context lost
    this._.initializers[s] = f;
    f();
  }

  return this;
};

// inactive
// setup
// draw
// inactive

rmr.glod.prototype.begin = function (name) {
  this.offPhase() || rmr.die('glod.begin: out of phase');
  this.startSetup();

  this.useProgram(name);

  var variables = this.variables[name];

  for (var name in variables) {
    if (!variables.hasOwnProperty(name)) continue;
    variables[name].ready = false;
  }

  return this;
};

rmr.glod.prototype.end = function () {
  this.readyPhase() || rmr.die('glod.end: out of phase');
  this.startOff();

  this.useProgram(null);
  return this;
};


rmr.glod.prototype.ready = function ()  {
  this.setupPhase() || rmr.die('glod.ready: out of phase');

  var variables = this.variables[this._activeProgram];

  for (var name in variables) {
    if (!variables.hasOwnProperty(name)) continue;
    var variable = variables[name];
    variable.ready || rmr.die('glod.ready: variable not ready: ' + name);
    rmr.log(name);
  }

  // set up the attribute pointers

  this.startReady();

  return this;
};

/*
rmr.glod.prototype.value  = function (variable, value) {
  this.setupPhase() || this.readyPhase() || rmr.die('glod.uniformX: out of phase');

  return this;
};
*/

// mark variables as manual
rmr.glod.prototype.manual = function (variables) {
  this._.begun || rmr.die('glod.manual: was not begun');
  return this;
};

// group attributes into an automatically interleaved vbo
rmr.glod.prototype.group = function () {
  this.setupPhase() || rmr.die('glod.setup: out of phase');
  return this;
};

// print out how things are bound
rmr.glod.prototype.status = function () {
  this.readyPhase() || rmr.die('glod.status: out of phase');
  return this;
};

rmr.glod.prototype.draw = function (mode, first, count) {
  this.readyPhase() || rmr.die('glod.draw: out of phase');
  this.gl().drawArrays(mode, first, count)
  return this;
};
'use strict';

define(function(require) {
  var scratch = {
    path:     '/glod',
    template: '<canvas class="main"></canvas>'
  };

  require('all');

  scratch.controller = function ($scope, $, rmr) {
    var glod = rmr.glod(true);

    glod
    .canvas('.main')
    .alloc(function () {
      rmr.warn('alloc');

      glod
      .createProgram('test')
      .createVBO('quad');
    })
    .initX(function () {
      rmr.warn('init');

      glod
      .uploadQuad('quad')
    })
    .begin('test')
    .group('quad', 'position')
    .ready()
    .draw()
    .end()
  };

  return scratch;
});
