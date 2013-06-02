'use strict';

// Inspired by: https://github.com/vsedach/js-canvas-hacks
//
// todo: make setcolor stuff work even if platform doesn't support it

define(function(require) {

var rmr = require('rmr');

var $ = rmr.$;

rmr.ct = function (c) {
  var x = rmr.new(this, rmr.ct);
  if (this !== x) return rmr.ct.apply(x, arguments);

  if (c.getContext) this._ct = c.getContext('2d');
  else              this._ct = c;

  this._canvas = $(this._ct.canvas);

  return this;
}; 

rmr.ct.prototype.clear = function() {
  this._ct.canvas.width  = this._ct.canvas.width;
  this._ct.canvas.height = this._ct.canvas.height;
};

rmr.ct.prototype.toDataURL                = function($args) { return this.canvas().toDataURL.apply(this.canvas(), arguments); };

rmr.ct.prototype.width                    = function() { if (arguments.length === 0) return this.canvas().width;  this.canvas().width  = arguments[0]; return this; };
rmr.ct.prototype.height                   = function() { if (arguments.length === 0) return this.canvas().height; this.canvas().height = arguments[0]; return this; };

rmr.ct.prototype.canvas                   = function(                      ) { return this._ct.canvas;                                     };
rmr.ct.prototype.createLinearGradient     = function(x0, y0, x1, y1        ) { return this._ct.createLinearGradient(x0, y0, x1, y1   ); };
rmr.ct.prototype.createPattern            = function(image, repetition     ) { return this._ct.createPattern       (image, repetition); };
rmr.ct.prototype.createRadialGradient     = function(x0, y0, r0, x1, y1, r1) { return this._ct.createRadialGradient(x0, y0, x1, y1   ); };
rmr.ct.prototype.isPointInPath            = function(x, y                  ) { return this._ct.isPointInPath       (x, y             ); };
rmr.ct.prototype.isPointInStroke          = function(x, y                  ) { return this._ct.isPointInStroke     (x, y             ); };
rmr.ct.prototype.measureText              = function(text                  ) { return this._ct.measureText         (text             ); };

rmr.ct.prototype.lineDash                 = function() { if (arguments.length === 0) return this._ct.getLineDash();                this._ct.setLineDash(arguments[0]);                   return this; };

rmr.ct.prototype.backingStorePixelRatio   = function() { if (arguments.length === 0) return this._ct.webkitBackingStorePixelRatio; this._ct.webkitBackingStorePixelRatio = arguments[0]; return this; };
rmr.ct.prototype.currentPath              = function() { if (arguments.length === 0) return this._ct.currentPath;                  this._ct.currentPath                  = arguments[0]; return this; };
rmr.ct.prototype.fillStyle                = function() { if (arguments.length === 0) return this._ct.fillStyle;                    this._ct.fillStyle                    = arguments[0]; return this; };
rmr.ct.prototype.fillStyle                = function() { if (arguments.length === 0) return this._ct.fillStyle;                    this._ct.fillStyle                    = arguments[0]; return this; };
rmr.ct.prototype.font                     = function() { if (arguments.length === 0) return this._ct.font;                         this._ct.font                         = arguments[0]; return this; };
rmr.ct.prototype.globalAlpha              = function() { if (arguments.length === 0) return this._ct.globalAlpha;                  this._ct.globalAlpha                  = arguments[0]; return this; };
rmr.ct.prototype.globalCompositeOperation = function() { if (arguments.length === 0) return this._ct.globalCompositeOperation;     this._ct.globalCompositeOperation     = arguments[0]; return this; };
rmr.ct.prototype.imageSmoothingEnabled    = function() { if (arguments.length === 0) return this._ct.webkitImageSmoothingEnabled;  this._ct.webkitImageSmoothingEnabled  = arguments[0]; return this; };
rmr.ct.prototype.lineCap                  = function() { if (arguments.length === 0) return this._ct.lineCap;                      this._ct.lineCap                      = arguments[0]; return this; };
rmr.ct.prototype.lineDashOffset           = function() { if (arguments.length === 0) return this._ct.lineDashOffset;               this._ct.lineDashOffset               = arguments[0]; return this; };
rmr.ct.prototype.lineJoin                 = function() { if (arguments.length === 0) return this._ct.lineJoin;                     this._ct.lineJoin                     = arguments[0]; return this; };
rmr.ct.prototype.lineWidth                = function() { if (arguments.length === 0) return this._ct.lineWidth;                    this._ct.lineWidth                    = arguments[0]; return this; };
rmr.ct.prototype.miterLimit               = function() { if (arguments.length === 0) return this._ct.miterLimit;                   this._ct.miterLimit                   = arguments[0]; return this; };
rmr.ct.prototype.shadowBlur               = function() { if (arguments.length === 0) return this._ct.shadowBlur;                   this._ct.shadowBlur                   = arguments[0]; return this; };
rmr.ct.prototype.shadowColor              = function() { if (arguments.length === 0) return this._ct.shadowColor;                  this._ct.shadowColor                  = arguments[0]; return this; };
rmr.ct.prototype.shadowOffsetX            = function() { if (arguments.length === 0) return this._ct.shadowOffsetX;                this._ct.shadowOffsetX                = arguments[0]; return this; };
rmr.ct.prototype.shadowOffsetY            = function() { if (arguments.length === 0) return this._ct.shadowOffsetY;                this._ct.shadowOffsetY                = arguments[0]; return this; };
rmr.ct.prototype.strokeStyle              = function() { if (arguments.length === 0) return this._ct.strokeStyle;                  this._ct.strokeStyle                  = arguments[0]; return this; };
rmr.ct.prototype.textAlign                = function() { if (arguments.length === 0) return this._ct.textAlign;                    this._ct.textAlign                    = arguments[0]; return this; };
rmr.ct.prototype.textBaseline             = function() { if (arguments.length === 0) return this._ct.textBaseline;                 this._ct.textBaseline                 = arguments[0]; return this; };

rmr.ct.prototype.arc                      = function(x, y, radius, startAngle, endAngle, anticlockwise) { this._ct.arc             (x, y, radius, startAngle, endAngle, anticlockwise); return this; };
rmr.ct.prototype.arcTo                    = function(x1, y1, x2, y2, radius                           ) { this._ct.arcTo           (x1, y1, x2, y2, radius                           ); return this; };
rmr.ct.prototype.beginPath                = function(                                                 ) { this._ct.beginPath       (                                                 ); return this; };
rmr.ct.prototype.bezierCurveTo            = function(cp1x, cp1y, cp2x, cp2y, x, y                     ) { this._ct.bezierCurveTo   (cp1x, cp1y, cp2x, cp2y, x, y                     ); return this; };
rmr.ct.prototype.clearRect                = function(x, y, w, h                                       ) { this._ct.clearRect       (x, y, w, h                                       ); return this; };
rmr.ct.prototype.clearShadow              = function(                                                 ) { this._ct.clearShadow     (                                                 ); return this; };
rmr.ct.prototype.clip                     = function(                                                 ) { this._ct.clip            (                                                 ); return this; };
rmr.ct.prototype.closePath                = function(                                                 ) { this._ct.closePath       (                                                 ); return this; };
rmr.ct.prototype.fill                     = function(                                                 ) { this._ct.fill            (                                                 ); return this; };
rmr.ct.prototype.fillRect                 = function(x, y, w, h                                       ) { this._ct.fillRect        (x, y, w, h                                       ); return this; };
rmr.ct.prototype.lineTo                   = function(x, y                                             ) { this._ct.lineTo          (x, y                                             ); return this; };
rmr.ct.prototype.moveTo                   = function(x, y                                             ) { this._ct.moveTo          (x, y                                             ); return this; };
rmr.ct.prototype.quadraticCurveTo         = function(cpx, cpy, x, y                                   ) { this._ct.quadraticCurveTo(cpx, cpy, x, y                                   ); return this; };
rmr.ct.prototype.rect                     = function(x, y, w, h                                       ) { this._ct.rect            (x, y, w, h                                       ); return this; };
rmr.ct.prototype.restore                  = function(                                                 ) { this._ct.restore         (                                                 ); return this; };
rmr.ct.prototype.rotate                   = function(theta                                            ) { this._ct.rotate          (theta                                            ); return this; };
rmr.ct.prototype.save                     = function(                                                 ) { this._ct.save            (                                                 ); return this; };
rmr.ct.prototype.scale                    = function(x, y                                             ) { this._ct.scale           (x, y                                             ); return this; };
rmr.ct.prototype.setTransform             = function(m11, m12, m21, m22, dx, dy                       ) { this._ct.setTransform    (m11, m12, m21, m22, dx, dy                       ); return this; };
rmr.ct.prototype.stroke                   = function(                                                 ) { this._ct.stroke          (                                                 ); return this; };
rmr.ct.prototype.strokeRect               = function(x, y, w, h                                       ) { this._ct.strokeRect      (x, y, w, h                                       ); return this; };
rmr.ct.prototype.transform                = function(m11, m12, m21, m22, dx, dy                       ) { this._ct.transform       (m11, m12, m21, m22, dx, dy                       ); return this; };
rmr.ct.prototype.translate                = function(x, y                                             ) { this._ct.translate       (x, y                                             ); return this; };

rmr.ct.prototype.createImageData          = function($args                  ) { return this._ct.createImageData      .apply(this._ct, arguments); };
rmr.ct.prototype.getImageData             = function($args                  ) { return this._ct.getImageData         .apply(this._ct, arguments); };
rmr.ct.prototype.getImageDataHD           = function($args                  ) { return this._ct.getImageDataHD       .apply(this._ct, arguments); };

rmr.ct.prototype.alpha                    = function(alpha                  ) { this._ct.setAlpha             .apply(this._ct, arguments); return this; };
rmr.ct.prototype.compositeOperation       = function(operation              ) { this._ct.setCompositeOperation.apply(this._ct, arguments); return this; };
rmr.ct.prototype.drawImage                = function($args                  ) { this._ct.drawImage            .apply(this._ct, arguments); return this; };
rmr.ct.prototype.drawImageFromRect        = function($args                  ) { this._ct.drawImageFromRect    .apply(this._ct, arguments); return this; };
rmr.ct.prototype.fillColor                = function(color                  ) { this._ct.setFillColor         .apply(this._ct, arguments); return this; };
rmr.ct.prototype.fillText                 = function(text, x, y, _maxWidth  ) { this._ct.fillText             .apply(this._ct, arguments); return this; };
rmr.ct.prototype.putImageData             = function($args                  ) { this._ct.putImageData         .apply(this._ct, arguments); return this; };
rmr.ct.prototype.putImageDataHD           = function($args                  ) { this._ct.putImageDataHD       .apply(this._ct, arguments); return this; };
rmr.ct.prototype.shadow                   = function(shadow                 ) { this._ct.shadow               .apply(this._ct, arguments); return this; };
rmr.ct.prototype.strokeColor              = function(color                  ) { this._ct.setStrokeColor       .apply(this._ct, arguments); return this; };
rmr.ct.prototype.strokeText               = function(text, x, y, _maxWidth  ) { this._ct.strokeText           .apply(this._ct, arguments); return this; };

return rmr;

});
