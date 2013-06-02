'use strict';

define(function(require) {
var _   = require('_'  );
var rmr = require('rmr');

require('ct');

var template = require('text!./stats.html'  );

rmr.stats = function() {
  var x = rmr.new(this, rmr.stats);
  if (this !== x) return rmr.stats.apply(x, arguments);

  this.element = $(template);

  this.element.css('color',            'white'    );
  this.element.css('background-color', 'black'    );
  this.element.css('font-family',      'monospace');
  this.element.css('font-size',        'small'    );
  this.element.css('padding',          '10px'     );

  this.width  = 50;
  this.height = 30;

  this.canvas = this.element.find('canvas');
  this.canvas.css('width',  this.width  + 'px');
  this.canvas.css('height', this.height + 'px');

  this.ct = rmr.ct(this.canvas[0].getContext('2d'))
               .width(this.canvas.width())
               .height(this.canvas.height());

  this.frameTimes = rmr.ring(new Float32Array(this.width));
  this.frameStart = Date.now();
  this.heapSize   = window.console.memory.usedJSHeapSize;

  this.fa = this.element.find('.frame-average')[0];
  this.hd = this.element.find('.heap-delta'   )[0];
  this.sm = this.element.find('.sigma'        )[0];

  this.heapDeltas = rmr.ring(new Float32Array(this.width));

  this.frameCount = 0;

  this.lastFrameTime = 0;
  this.lastHeapDelta = 0;

  this.sigma = 0;

  this.hidden = false;

  return this;
};

rmr.stats.prototype.hide = function () { this.element.hide(); this.hidden = true;  return this; };
rmr.stats.prototype.show = function () { this.element.show(); this.hidden = false; return this; };
rmr.stats.prototype.toggle = function () {
  this.hidden ? this.show() : this.hide();
  return this;
};

rmr.stats.prototype.frame = function() {
  var now = Date.now();

  var heapSize  = window.console.memory.usedJSHeapSize;
  var heapDelta = heapSize - this.heapSize;
  this.heapSize = heapSize;
  if (this.heapDeltas.full()) {
    this.heapDeltas.drop();
  }

  if (heapDelta > 0) {
    this.heapDeltas.write(heapDelta);
    var mean = ~~this.heapDeltas.mean();
    if (mean !== this.lastHeapDelta) {
      this.hd.textContent = rmr.formatBytes(mean);
      this.lastHeapDelta = mean;
    }
  }

  var frameTime = now - this.frameStart;
  this.frameStart = now;
  if (this.frameTimes.full()) {
    this.frameTimes.drop();
  }
  this.frameTimes.write(frameTime);

  var mean = ~~this.frameTimes.mean();
  if (mean !== this.lastFrameTime) {
    this.lastFrameTime = mean;
    this.fa.textContent = Math.round(mean);
  }


  var c = this.frameTimes.count();

  if (c > 0) {
    var sum = 0;
    var m = this.frameTimes.mean();

    for (var i = 0; i < c; i++) {
      var sample = this.frameTimes.get(i);
      var v = sample - m;
      sum += v * v;
    }
    
    this.sigma = Math.sqrt(sum / c)
    this.sm.textContent = Math.round(this.sigma);
  }

  if (!this.hidden) {
    this.ct.clear();

    var start     = this.width - this.frameTimes.count();
    var lastColor = null;
    for (var i = start; i < this.width; i++) {
      var t = this.frameTimes.get(i - start);

      var color = t <= (1000 / 200) ? 'blue'   :
                  t <= (1000 / 120) ? 'green'  :
                  t <= (1000 /  60) ? 'yellow' :
                                    'red'    ;

      if (lastColor !== color) {
        this.ct.fillStyle(color)
        lastColor = color;
      }

      var w = 1;
      var h = t;

      var x = i;
      var y = this.height - h;

      this.ct.fillRect(x, y, w, h)
    }
  }

  this.frameCount++;
};

return rmr;
});
