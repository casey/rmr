'use strict';

// todo:
//   abort if zero dimension
//   separate model, view, and projection matrix

define(function(require) {
var rmr     = require('rmr');
var _       = require('_');
var $       = require('$');
var goog    = require('goog');
var angular = require('angular');

require('color');
require('glod');

window.beat = 0;
window.intensity = 0;

rmr.glod.preprocess(require('text!pass.copy.glsl'  ));
rmr.glod.preprocess(require('text!pass.invert.glsl'));
rmr.glod.preprocess(require('text!pass.gray.glsl'  ));
rmr.glod.preprocess(require('text!pass.fxaa.glsl'  ));
rmr.glod.preprocess(require('text!pass.glow.glsl'  ));
rmr.glod.preprocess(require('text!pass.ssaa.glsl'  ));

var DS_FORMAT          = null;
var floatFrequencyData = rmr.f32();
var byteFrequencyData  = rmr.u8();
var byteTimeDomainData = window.btdd = rmr.u8();
var mergedAudioData    = rmr.u8();
var startTime          = rmr.now();

var diaImage = null;
!function () {
  var img = new Image();
  img.onload = function () { diaImage = img; };
  img.src = 'srv/dia/big.png';
}();

var bayImage = null;
!function () {
  var img = new Image();
  img.onload = function () { bayImage = img; };
  img.src = 'srv/bay.png';
}();

var camera = rmr.camera = function Camera(opt_name) {
  var x = rmr.new(this, camera);
  if (this !== x) return camera.apply(x, arguments);

  this._name          = arguments.length > 0 ? opt_name : null;
  this._frame         = 0;
  this._children      = [];
  this._parent        = null;
  this._scope         = camera.scope();
  this._hidden        = false;
  this._projection    = rmr.mat4();

  this._width  = null;
  this._height = null;
  this._left   = null;
  this._bottom = null;
  this._aspect = null;

  this._id            = rmr.id();

  this._projection.set(rmr.mat4.IDENTITY);

  Object.seal(this);

  return this;
};

var PassData = function (name, ratio, def) {
  return {
    name:    name
  , active:  false
  , ratio:   ratio
  , def:     def
  , scale:   null
  };
}

var passData = [
  PassData('clear' , 0, true )
, PassData('node'  , 0, true )
, PassData('ssaa'  , 2, false)
, PassData('gray'  , 1, false)
, PassData('invert', 1, false)
, PassData('glow'  , 1, false)
, PassData('copy'  , 1, false)
, PassData('fxaa'  , 1, false)
];

camera.prototype.tempTransform = rmr.mat4();

// todo: create an orthographic projection which uses the same coordinates as a canvas
camera.prototype.pixel = rmr.abstract;

camera.scope = function () {
  var x = rmr.new(this, camera.scope);
  if (this !== x) return camera.scope.apply(x, arguments);
  return this;
};

camera.scoped = function (name, opt_default, opt_coerce) {
  return function scoped (opt_value) {
    if (arguments.length === 0) {
      var x = this._scope[name];

      if (x === undefined) {
        if (opt_default === undefined) {
          rmr.die('camera.scoped: requested undefined property with no default value: ' + name);
        } else {
          return opt_default;
        }
      } else {
        return x;
      }

    } else if (arguments.length === 1) {
      if (opt_value === undefined) {
        delete this._scope[name]
      } else {
        this._scope[name] = opt_coerce ? opt_coerce(opt_value) : opt_value;
        return this;
      }
    } else {
      rmr.die('camera.scoped: bad arguments:', arguments);
    }
  };
};

camera.prototype.id = function() {
  return this._id;
};

camera.prototype.project = function() {
  var canvas = this.canvas();

  var opening = this.opening() || canvas[0];
  var base    = this.base()    || canvas[0];

  var bh = base.offsetHeight;
  var bt = base.offsetTop;
  var bl = base.offsetLeft;

  var ow = opening.offsetWidth;
  var oh = opening.offsetHeight;
  var ot = opening.offsetTop;
  var ol = opening.offsetLeft;

  this._width  = ow;
  this._height = oh;
  this._bottom = (bt + bh) - (ot + oh);
  this._left   = ol - bl;
  this._aspect = this._width / this._height;

  this._projector().call(this);
  return this;
};

// TODO: add "has" functions that force check for existence

var convertToElement = function (x) {
  if (x === null) return null;

  if (typeof x === "string") {
    var e = $(x)[0];
    if (!e) rmr.log('convertToElement: bad selector:', x);
    return e;
  } else if (x.jquery) {
    x.length === 1 || rmr.die('convertToElement: empty jquery object:', x);
    return x[0];
  }

  return x;
};

camera.prototype.scene       = camera.scoped('scene'   , null );
camera.prototype.eye         = camera.scoped('eye'     , null );
camera.prototype.opening     = camera.scoped('opening' , null, convertToElement);
camera.prototype.base        = camera.scoped('base'    , null, convertToElement);
camera.prototype.analyser    = camera.scoped('analyser', null );
camera.prototype.cull        = camera.scoped('cull'    , false);
camera.prototype._glod       = camera.scoped('glod');
camera.prototype._clearColor = camera.scoped('clearColor', rmr.color(0, 0, 0, 1));
camera.prototype._projector  = camera.scoped('projector', function () { this._projection.set(rmr.mat4.IDENTITY); });

camera.prototype.pass = function () {
  var passMutators = {};

  for (var i = 0; i < passData.length; i++ ) {
    var name = passData[i].name;
    passMutators[name] = camera.scoped('pass_' + name, passData[i].def);
  }

  return function pass (name, opt_state) {
    var m = passMutators[name];
    return arguments.length === 1 ? m.call(this) : (m.call(this, opt_state), this);
  };
}();

camera.prototype.togglePass = function () {
  var al = arguments.length;
  for (var i = 0; i < al; i++) {
    var name = arguments[i];
    this.pass(name, !this.pass(name));
  }
  return this;
};

camera.prototype.passOn = function () {
  var al = arguments.length;
  for (var i = 0; i < al; i++) {
    var name = arguments[i];
    this.pass(name, true);
  }
  return this;
};

camera.prototype.passOff = function () {
  var al = arguments.length;
  for (var i = 0; i < al; i++) {
    var name = arguments[i];
    this.pass(name, false);
  }
  return this;
};

camera.prototype.clearColor = function(color) {
  if (arguments.length > 0) {
    this._clearColor(color ? rmr.color.apply(rmr.color, arguments) : color);
    return this;
  }

  return this._clearColor();
};

camera.prototype.root = function() {
  var current = this;

  for(;;) {
    var parent = current.parent();
    if (!parent) break;
    current = parent;
  }

  return current;
};

camera.prototype.parent = function (parent) {
  if (arguments.length === 0) {
    return this._parent;
  } 

  if (this._parent) this.orphan();
  if (parent)       parent.adopt(this);
  else              this._parent = null;

  return this;
};

camera.prototype.adopt = function (child) {
  child.parent() && child.orphan();
  child._parent = this;
  child._scope.__proto__ = this._scope;
  this.children().push(child);
};

camera.prototype.orphan = function (c) {
  this._parent = null;
  this._scope.__proto__ = camera.scope.prototype;
};

camera.prototype.spawn = function () {
  var child = camera.apply(camera, arguments);
  this.adopt(child);
  return child;
};

camera.prototype.tree = function(indent) {
  indent = indent || 0;
  rmr.log(new Array(indent + 1).join(' ') + this.name());
  this.forEachChild(function () { this.tree(indent + 3); });
  return this;
};

camera.prototype.forEachChild = function(f) {
  for (var i = 0; i < this.childCount(); i++) {
    f.call(this.child(i), this.child(i));
  }
  return this;
};

camera.prototype.name = function(opt_name) {
  if (arguments.length === 0) {
    return this._name;
  }

  this._name = opt_name;
  return this;
};

camera.prototype.frame = function() { return this._frame;       };
camera.prototype.first = function() { return this._frame === 0; };

camera.prototype.find = function(name) {
  if (this.name() === name) {
    return this;
  }

  for (var i = 0; i < this.childCount(); i++) {
    var found = this.child(i).find(name);
    if (found) return found;
  }

  return null;
};

camera.prototype.child = function(i, opt_replacement) {
  var children = this.children();
  (i < children.length && i >= 0) || rmr.die('camera.child: bad index: ' + i);
  if (opt_replacement) {
    children[i] = opt_replacement;
    return this;
  } else {
    return children[i];
  }
};

camera.prototype.children = function (opt_replacements) {
  if (arguments.length === 0) {
    return this._children;
  }

  while(this.childCount() > 0) {
    this.child(0).orphan();
  }

  for (var i = 0; i < opt_replacements.length; i++) {
    this.adopt(opt_replacements[i]);
  }

  return this;
};

camera.prototype.childCount = function() {
  return this._children.length;
};


camera.prototype.canvas = function() {
  var cache = rmr.dict();

  return function canvas (canvas, wrap) {
    if (arguments.length === 0) {
      return this._glod().canvas();
    }

    if (canvas === undefined) {
      this._glod(undefined);
      return this;
    }

    canvas = $(canvas);
    var element = canvas[0];

    (canvas && element) || rmr.die('camera.canvas: bad canvas');

    if (!cache.has(element)) {
      var glod = rmr.glod();

      glod.canvas       (canvas, wrap)
          .createVBO    ('quad'      )
          .createFBO    ('0'         )
          .createTexture('0'         )
          .createTexture('0_depth'   )
          .createFBO    ('1'         )
          .createTexture('1'         )
          .createTexture('1_depth'   )
          .createTexture('dia'       )
          .createTexture('bay'       )
          .createTexture('audio'     )
          .createTexture('wave'      )
          .createTexture('freq'      )
          .createProgram('copy'      )
          .createProgram('glow'      )
          .createProgram('fxaa'      )
          .createProgram('invert'    )
          .createProgram('ssaa'      )
          .createProgram('gray'      )

      cache.set(element, glod);
    }

    this._glod(cache.get(element));

    DS_FORMAT = this._glod().extension('WEBKIT_WEBGL_depth_texture').UNSIGNED_INT_24_8_WEBGL;

    return this;
  };
}();

camera.prototype.hidden = function (hidden) {
  if (arguments.length > 0) {
    this._hidden = !!hidden;
    return this;
  }

  return this._hidden;
};

camera.prototype.hide   = function () { return this.hidden(true);           };
camera.prototype.show   = function () { return this.hidden(false);          };

camera.prototype.toggle= function () { return this.hidden(!this.hidden()) };

camera.prototype.tick = function() {
  var lists = [[this]];
  var now = rmr.now();

  var i = 0;
  while (i < lists.length) {
    var cams = lists[i++];

    for (var k = 0; k < cams.length; k++) {
      var cam = cams[k];

      if (cam.hidden()) continue;

      // TODO: FIX THIS
      if (cam._scope['glod']) {
        var canvas = cam.canvas()[0];
        var ow = canvas.offsetWidth;
        var oh = canvas.offsetHeight;
        if (canvas.width  !== ow) canvas.width  = ow;
        if (canvas.height !== oh) canvas.height = oh;

        var scene = cam.scene();

        if (scene) {
          var root = scene.root();
          if (root._lastTickTime !== now) root.tickTree(now);
        }

        cam.project();
        cam.render();
      }

      lists.push(cam._children);
    }
  }

  return this;
};

camera.prototype.projection = function(projection) {
  if (arguments.length === 0) {
    return this._projection;
  }

  this._projection.set(projection);

  return this;
};

camera.prototype.perspective = function(opt_fovy, opt_aspect, opt_near, opt_far) {
  this._projector(function () {
    var canvas = this.canvas();

    canvas || rmr.die('camera.perspective: no canvas');

    var fovy   = arguments.length >= 1 ? opt_fovy   : rmr.TAU / 8;
    var aspect = arguments.length >= 2 ? opt_aspect : this._aspect;
    var near   = arguments.length >= 3 ? opt_near   : 0.01 ;
    var far    = arguments.length >= 4 ? opt_far    : 20000;

    this._projection.perspective(fovy, aspect, near, far);

    return this;
  });

  return this;
};

camera.prototype.orthographic = function(opt_left, opt_right, opt_bottom, opt_top, opt_near, opt_far) {
  this._projector(function () {
    var left =   opt_left   === undefined ? -1 : opt_left;
    var right =  opt_right  === undefined ?  1 : opt_right;
    var bottom = opt_bottom === undefined ? -1 : opt_bottom;
    var top =    opt_top    === undefined ?  1 : opt_top;
    var near =   opt_near   === undefined ? -1 : opt_near;
    var far =    opt_far    === undefined ?  1 : opt_far;

    rmr.assert(
      !(left - right == 0 || bottom - top == 0 || near - far == 0),
      "camera.orthographic: coplanar clipping planes: ", left, right, bottom, top, near, far);

    this._projection.orthographic(left, right, bottom, top, near, far);

    return this;
  });

  return this;
};

camera.prototype.fixedWidth = function (opt_w) {
  var w = opt_w || 1;

  this._projector(function () {
    var aspect = this._aspect;
    var right = w / 2;
    var top   = w / aspect / 2;
    this._projection.orthographic(-right, right, -top, top, -1, 1);
    return this;
  });

  return this;
};

camera.prototype.fixedHeight = function (opt_h) {
  var h = opt_h || 1;

  this._projector(function () {
    var aspect = this._aspect;
    var top   = h / 2;
    var right = h * aspect / 2;
    this._projection.orthographic(-right, right, -top, top, -1, 1);
    return this;
  });

  return this;
};

camera.prototype.pixel = function () {
  this._projector(function () {
    var right = this._width  / 2;
    var top   = this._height / 2;
    this._projection.orthographic(-right, right, -top, top, -1, 1);
    return this;
  });
  return this;
};

camera.prototype.aspect = function (opt_aspect) {
  var target = opt_aspect || 1;
  this._projector(function () {
    var aspect = this._aspect;
    if (aspect > target) { // aspect is wider than target, height is h, width is as allowed
      var top   = 1 / 2;
      var right = aspect / 2;
      this._projection.orthographic(-right, right, -top, top, -1, 1);
    } else { // aspect is taller than target, width is w, height is as allowed
      var right = target / 2;
      var top   = target / aspect / 2;
      this._projection.orthographic(-right, right, -top, top, -1, 1);
    }

    return this;
  });
  return this;
};

camera.prototype.matrix = function (matrix) {
  this._projector(function () {
    this._projection.set(matrix);
    return this;
  });
  return this;
};

camera.prototype.render = function() {
  var glod = this._glod();
  var gl   = glod.gl();

  glod.alloc(this.id(), function () {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

    gl.bindTexture(gl.TEXTURE_2D, glod.texture('0'));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.bindTexture(gl.TEXTURE_2D, glod.texture('1'));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.bindTexture(gl.TEXTURE_2D, glod.texture('0_depth'));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.bindTexture(gl.TEXTURE_2D, glod.texture('1_depth'));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.bindTexture(gl.TEXTURE_2D, glod.texture('audio'));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.bindTexture(gl.TEXTURE_2D, glod.texture('wave'));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.bindTexture(gl.TEXTURE_2D, glod.texture('freq'));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.bindTexture(gl.TEXTURE_2D, glod.texture('dia'));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.bindTexture(gl.TEXTURE_2D, glod.texture('bay'));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);

    gl.enable(gl.SCISSOR_TEST);
    // todo: figure out how to make blending less crazy;

    /*
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ZERO);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    */

    gl.colorMask(true, true, true, true);

    glod.uploadCCWQuad('quad')
  });

  if (this.cull()) {
    gl.enable(gl.CULL_FACE);
    gl.frontFace(gl.CCW);
    gl.cullFace(gl.BACK);
  }

  var direct = 0;

  for (var i = 0; i < passData.length; i++) {
    var data = passData[i];
    data.active = this.pass(data.name);
    data.scale  = 1;

    if (data.active && data.ratio > 0) {
      direct = i;
    }
  }

  if (this._width === 0 || this._height === 0) return;

  var input          = null;
  var output         = 0;
  var previousOutput = null;

  gl.activeTexture(gl.TEXTURE12);
  glod.bindTexture2D('bay');
  if (bayImage) {
    glod.alloc('bay', function () {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bayImage);
    });
  } else {
    glod.alloc('bay-empty', function () {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    });
  }
  glod.optional('cam_bay', 12);

  gl.activeTexture(gl.TEXTURE13);
  glod.bindTexture2D('dia');
  if (diaImage) {
    glod.alloc('dia', function () {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, diaImage);
    });
  } else {
    glod.alloc('dia-empty', function () {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    });
  }
  glod.optional('cam_dia', 13);

  glod.optional('cam_aspect', this._aspect);

  var analyser = this.analyser();
  if (analyser) {
    var ffts = analyser.fftSize;
    var bins = analyser.frequencyBinCount;

    byteTimeDomainData.length === ffts || (window.btdd = byteTimeDomainData = rmr.u8 (ffts));
     byteFrequencyData.length === bins || (byteFrequencyData  = rmr.u8 (bins));

    analyser.getByteTimeDomainData(byteTimeDomainData);
    analyser.getByteFrequencyData ( byteFrequencyData);

    gl.activeTexture(gl.TEXTURE14);
    glod.bindTexture2D('wave');
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, ffts, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, byteTimeDomainData);

    gl.activeTexture(gl.TEXTURE15);
    glod.bindTexture2D('freq');
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, bins, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, byteFrequencyData);
  } else {
    gl.activeTexture(gl.TEXTURE14);
    glod.bindTexture2D('wave');
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 256, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, null);

    gl.activeTexture(gl.TEXTURE15);
    glod.bindTexture2D('freq');
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 256, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, null);
  }
  glod.optional('cam_wave', 14);
  glod.optional('cam_freq', 15);
  window.intensity = byteFrequencyData.mean() / 255;
  glod.optional('cam_intensity', window.intensity);

  glod.optional('cam_beat', window.beat);

  var now = rmr.now();

  glod.optional('cam_now',     now / 1000);
  glod.optional('cam_elapsed', (now - startTime) / 1000)

  for (var i = 0; i < passData.length; i++) {
    var data = passData[i];
    if (!data.active) continue;

    for (var j = passData.length - 1; j > i; j--) {
      var later = passData[j];
      if (later.active && later.ratio > 0) {
        data.scale *= later.ratio;
      }
    }

    if (data.ratio > 0) {
      input   = output;
      output  = (output + 1) % 2;
    }

    if (i >= direct) {
      output = null;
    }

    var name  = data.name;
    var scale = data.scale;

    // todo: improve performance of SSAA
    if (output === null) {
      glod.bindFramebuffer(null);
    } else {
      var colorTexture = glod.texture(output);
      var depthTexture  = glod.texture(output + '_depth');

      if (output !== previousOutput) {
        glod.bindFramebuffer(output);
        var w = this._width  * scale;
        var h = this._height * scale;

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, colorTexture);
        w <= 4096 || rmr.log('width too large: ' + w);
        h <= 4096 || rmr.log('height too large: ' + h);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, depthTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_STENCIL, w, h, 0, gl.DEPTH_STENCIL, DS_FORMAT, null);
      }

      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);
    }

    if (input !== null) {
      var inputColor = glod.texture(input);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, inputColor);
      glod.optional('pass_input', 0);

      // var inputDepth = glod.texture(input + '_depth');
      // gl.activeTexture(gl.TEXTURE1);
      // gl.bindTexture(gl.TEXTURE_2D, inputDepth);
    }

    if (output === null) {
      var canvas = this.canvas()[0];
      var wr = canvas.width  / canvas.offsetWidth;
      var hr = canvas.height / canvas.offsetHeight;

      gl.viewport(this._left * wr, this._bottom * hr, this._width * scale * wr, this._height * scale * hr);
      gl.scissor (this._left * wr, this._bottom * hr, this._width * scale * wr, this._height * scale * hr);
    } else {
      gl.viewport(0, 0, this._width * scale, this._height * scale);
      gl.scissor (0, 0, this._width * scale, this._height * scale);
    }

    glod.optional('pass_resolution', this._width * scale, this._height * scale);

    switch (name) {
      case 'clear':
        var color = this.clearColor();
        if (color) {
          glod.clearColorv(color).clear(true, true, true);
        }
        break;

      case 'node':
        var scene     = this.scene();
        var eye       = this.eye();
        var transform = this.tempTransform;
        
        if (scene) {
          eye ? eye.basisChangeTo(scene, transform) : transform.identity();

          // todo: split matrix into projection, model, and view
          this._projection || rmr.die('camera.scenePass: no projection');
          this._projection.mult(transform, transform);
          scene.updateMatrix(transform);

          var groups = {};
          var lists = [[scene]];
          var j = 0;
          while (j < lists.length) {
            var list = lists[j++];
            for (var k = 0; k < list.length; k++) {
              var node = list[k];
              if (node._hidden) continue;
              var ilk = node._ilk._name;
              if (!(ilk in groups)) {
                groups[ilk] = [];
              }
              groups[ilk].push(node);
              lists.push(node.children());
            }
          }

          // todo: let ilks specify dependency ordering
          var ilks = Object.keys(groups);
          ilks.sort();
          for (var j = 0; j < ilks.length; j++) {
            var name = ilks[j];
            var group = groups[name];
            var ilk = group[0].ilk();
            ilk.render(glod, group);
          }
        }
        break;

      case 'fxaa':
      case 'ssaa':
      case 'copy':
      case 'glow':
      case 'invert':
      case 'gray':
        glod
        .begin(name)
        .pack('quad', 'position')
        .ready()
        .triangles()
        .drawArrays(0, 6)
        .end();
        break;

      default:
        rmr.die('rmr.camera.render: unknown pass: ' + name);
    }

    previousOutput = output;
  }

  this.first() && glod.expectError(0);
  this._frame++;

  return this;
};

rmr.unenumerate(camera.prototype);

Object.freeze(camera);
Object.freeze(camera.prototype);

return rmr;
});
