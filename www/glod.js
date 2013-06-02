'use strict';

// todo:
//   VAOs for saving attribute bindings
//   packing all attributes into a single vbo
//   getting the stride of a vbo
//   easily setting texture parameters
//   allocating textures between texture units and supplying them to uniforms
//   allocating and reusing framebuffers
//   -- specifically make sure that ping/pong/multi-stage renders are efficient
//   push/pop (framebuffer, viewport, scissor)
//   binding samplers to texture units
//   binding framebuffers
//   allow generating anonymous identifiers, basically like gensym

define(function(require) {
var rmr     = require('rmr');
var $       = require('$');
var webgldebug = require('webgldebug');

require('gl');
require('array');

rmr.glod = function () {
  var x = rmr.new(this, rmr.glod);
  if (this !== x) return rmr.glod.apply(x, arguments);

  this._canvas            = null;
  this._gl                = null;
  this._vbos              = {};
  this._fbos              = {};
  this._rbos              = {};
  this._programs          = {};
  this._textures          = {};
  this._extensions        = {};

  this._variables         = {};

  this._mode              = -1;
  this._activeProgram     = null;
  this._contextLost       = false;
  this._onContextLost     = this.onContextLost    .bind(this);
  this._onContextRestored = this.onContextRestored.bind(this);
  this.loseContext        = null;
  this.restoreContext     = null;
  this._initIds           = {};
  this._allocIds          = {};
  this._versionedIds      = {};

  this._optional  = {};
  this._optionalv = {};

  this._state = 0;

  Object.seal(this);

  return this;
};

rmr.glod.preprocessed = {};

rmr.glod.preprocess = function (source) {
  var o = rmr.gl.preprocess(source);
  rmr.glod.preprocessed[o.name] && rmr.die('rmr.glod: duplicate shader name: '+ o.name);
  rmr.glod.preprocessed[o.name] = o;
}

// todo: implement these
rmr.glod.prototype.divisor      = rmr.abstract;
rmr.glod.prototype.status       = rmr.abstract;
rmr.glod.prototype.drawElements = rmr.abstract;
rmr.glod.prototype.indices      = rmr.abstract;

rmr.glod.prototype.isInactive      = function () { return this._state === 0;     };
rmr.glod.prototype.isPreparing     = function () { return this._state === 1;     };
rmr.glod.prototype.isDrawing       = function () { return this._state === 2;     };
rmr.glod.prototype.isProgramActive = function () { return !!this._activeProgram; };

rmr.glod.prototype.startInactive  = function () { this._state = 0; return this; };
rmr.glod.prototype.startPreparing = function () { this._state = 1; return this; };
rmr.glod.prototype.startDrawing   = function () { this._state = 2; return this; };

rmr.glod.prototype.assertInactive      = function () { this.isInactive()      || this.outOfPhase(0); return this; };
rmr.glod.prototype.assertPreparing     = function () { this.isPreparing()     || this.outOfPhase(1); return this; };
rmr.glod.prototype.assertDrawing       = function () { this.isDrawing()       || this.outOfPhase(2); return this; };
rmr.glod.prototype.assertProgramActive = function () { this.isProgramActive() || this.outOfPhase(1); return this; };

rmr.glod.prototype.outOfPhase = function (expected, actual) {
  function s(n) {
    return n === 0 ? 'inactive'  :
           n === 1 ? 'preparing' :
           n === 2 ? 'drawing'   :
                     'unknown (' + n + ')';
  };

  rmr.die('rmr.glod: out of phase: expected to be ' + s(expected) + ' but was ' + s(this._state));
};


// todo: print string names and type instead of [object WebGLProgram]
var throwOnGLError = function(err, funcName, args) {
  throw webgldebug.glEnumToString(err) + " was caused by call to: " + funcName;
};

var validateNoneOfTheArgsAreUndefined = function (functionName, args) {
  for (var ii = 0; ii < args.length; ++ii) {
    if (args[ii] === undefined) {
      console.error("undefined passed to gl." + functionName + "(" +
                    webgldebug.glFunctionArgsToString(functionName, args) + ")");
    }
  }
} 


var logGLCall = function (functionName, args) {   
  console.log("gl." + functionName + "(" + 
      webgldebug.glFunctionArgsToString(functionName, args) + ")");   
} 

var logAndValidate = function(functionName, args) {
  logGLCall(functionName, args);
  validateNoneOfTheArgsAreUndefined (functionName, args);
}

rmr.glod.prototype.expectError = function (expected) {
  var e = this.gl().getError();

  if (e !== expected) {
    rmr.die('rmr.glod.expectError: expecting "' + rmr.gl.enum(expected) +
            '" but got "' + rmr.gl.enum(e) + '"');
  }

  return this;
};

rmr.glod.prototype.initContext = function () {
  var gl = this._gl;

  var supported = gl.getSupportedExtensions();

  for (var i = 0; i < supported.length; i++) {
    var name = supported[i];
    this._extensions[name] = gl.getExtension(name);
  }

  var lc = this.extension('WEBGL_lose_context');

  this.loseContext    = lc.loseContext.bind(lc);
  this.restoreContext = lc.restoreContext.bind(lc);
};

rmr.glod.prototype.gl = function () {
  this._gl || rmr.die('rmr.glod.gl: no gl context');
  return this._gl;
};

rmr.glod.prototype.extension = function() {
  var l = arguments.length;
  for (var i = 0; i < l; i++) {
    var e = this._extensions[arguments[i]];
    if (e) return e;
  }
  rmr.die('rmr.glod.extension: extension not found: ' + arguments);
};

rmr.glod.prototype.canvas = function (canvas, wrap) {
  if (arguments.length === 0) {
    this.hasCanvas() || rmr.die('rmr.glod.canvas: no canvas');
    return this._canvas;
  }

  if (this.hasCanvas()) {
    // todo: get rid of all context resources
    this._canvas.off('webglcontextlost',     this._onContextLost);
    this._canvas.off('webglcontextrestored', this._onContextRestored);
  }

  this._canvas = canvas ? $(canvas) : null;
  
  if (canvas && !this.hasCanvas()) {
    rmr.die('rmr.glod.canvas: bad canvas: ' + canvas);
  }

  if (this.hasCanvas()) {
    this._canvas.on('webglcontextlost',     this._onContextLost);
    this._canvas.on('webglcontextrestored', this._onContextRestored);

    var options = {
      antialias:          false
    , alpha:              true
    , premultipliedAlpha: true
    , depth:              true
    , stencil:            true
    };

    var gl = this._canvas.getContext('webgl', options);
    gl || (gl = this._canvas.getContext('experimental-webgl', options));
    gl || (rmr.die('rmr.glod.canvas: failed to create context'));
    wrap && (gl = webgldebug.makeDebugContext(gl, throwOnGLError, logAndValidate));
    this._gl = gl;
    this.initContext();
  } else {
    this._gl = null;
  }

  return this;
};

rmr.glod.prototype.hasCanvas = function () {
  return !!(this._canvas && this._canvas.length == 1);
};

rmr.glod.prototype.hasVBO     = function (name) { return this._vbos    .hasOwnProperty(name); };
rmr.glod.prototype.hasFBO     = function (name) { return this._fbos    .hasOwnProperty(name); };
rmr.glod.prototype.hasRBO     = function (name) { return this._rbos    .hasOwnProperty(name); };
rmr.glod.prototype.hasTexture = function (name) { return this._textures.hasOwnProperty(name); };
rmr.glod.prototype.hasProgram = function (name) { return this._programs.hasOwnProperty(name); };

rmr.glod.prototype.createVBO = function (name) {
  this.hasVBO(name) && rmr.die('rmr.glod.createVBO: duplicate name: ' + name);
  this._vbos[name] = this.gl().createBuffer();
  return this;
};

rmr.glod.prototype.createFBO = function (name) {
  this.hasFBO(name) && rmr.die('rmr.glod.createFBO: duplicate resource name: ' + name);
  this._fbos[name] = this.gl().createFramebuffer();
  return this;
};

rmr.glod.prototype.createRBO = function (name) {
  this.hasRBO(name) && rmr.die('rmr.glod.createRBO: duplicate resource name: ' + name);
  this._rbos[name] = this.gl().createRenderbuffer();
  return this;
};

rmr.glod.prototype.createTexture = function (name) {
  this.hasTexture(name) && rmr.die('rmr.glod.createTexture: duplicate resource name: ' + name);
  this._textures[name] = this.gl().createTexture();
  return this;
};

rmr.glod.prototype.deleteFBO     = rmr.abstract;
rmr.glod.prototype.deleteRBO     = rmr.abstract;
rmr.glod.prototype.deleteTexture = rmr.abstract;

rmr.glod.prototype.deleteVBO = function (name) {
  var vbo = this.vbo(name);
  this.gl().deleteBuffer(vbo);
  delete this._vbos[name];
  return this;
};

var NRF = function (type, name) {
  rmr.die('rmr.glod.' + type + ': no resource found: ' + name);
};

rmr.glod.prototype.vbo     = function (name) { this.hasVBO(name) || NRF('vbo', name); return this._vbos[name]; };
rmr.glod.prototype.fbo     = function (name) { this.hasFBO(name) || NRF('fbo', name); return this._fbos[name]; };
rmr.glod.prototype.rbo     = function (name) { this.hasRBO(name) || NRF('rbo', name); return this._rbos[name]; };

rmr.glod.prototype.program = function (name) {
  this.hasProgram(name) || NRF('program', name); return this._programs[name]; 
};

rmr.glod.prototype.texture = function (name) {
  this.hasTexture(name) || NRF('texture', name); return this._textures[name];
};

rmr.glod.prototype.onContextLost = function (e) {
  RMR_DEBUG && rmr.log('rmr.glod.contextLost: webglcontextlost');
  e.preventDefault();
  this._contextLost = true;
};

rmr.glod.prototype.onContextRestored = function (e) {
  RMR_DEBUG && rmr.log('rmr.glod.contextLost: webglcontextrestored');
  this._contextLost = false;

  for (var name in this._vbos    ) { delete this._vbos    [name]; this.createVBO    (name); }
  for (var name in this._fbos    ) { delete this._fbos    [name]; this.createFBO    (name); }
  for (var name in this._rbos    ) { delete this._rbos    [name]; this.createRBO    (name); }
  for (var name in this._textures) { delete this._textures[name]; this.createTexture(name); }
  for (var name in this._programs) { delete this._programs[name]; this.createProgram(name); }

  this.initContext();
  this._allocIds     = {};
  this._versionedIds = {};
};

rmr.glod.prototype.createProgram = function (name) {
  name || rmr.die('bad program name: ' + name);

  var o = rmr.glod.preprocessed[name];

  o          || rmr.die('rmr.glod.createProgram: program not preprocessed: ' + name);
  o.name     || rmr.die('rmr.glod.createProgram: no name specified');
  o.vertex   || rmr.die('rmr.glod.createProgram: no vertex source');
  o.fragment || rmr.die('rmr.glod.createProgram: no fragment source');

  var name         = o.name;
  var vertex_src   = o.vertex;
  var fragment_src = o.fragment;

  this.hasProgram(name) && rmr.die('rmr.glod.createProgram: duplicate program name: ' + name);

  var gl = this.gl();
  var program = gl.createProgram();
  this._programs[name] = program;

  function shader(type, source) {
    var s = gl.createShader(type);

    gl.shaderSource(s, source);
    gl.compileShader(s);

    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      rmr.log(gl.getShaderInfoLog(s));
      rmr.die('rmr.glod.createProgram: compilation failed');
    }

    gl.attachShader(program, s);
  }

  shader(gl.VERTEX_SHADER,   vertex_src);
  shader(gl.FRAGMENT_SHADER, fragment_src);

  for (var pass = 0; pass < 2; pass++) {
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      rmr.log(gl.getProgramInfoLog(program));
      rmr.die('rmr.glod.createProgram: linking failed');
    }

    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
      rmr.log(gl.getProgramInfoLog(program));
      rmr.die('rmr.glod.createProgram: validation failed');
    }

    if (pass === 0) {
      var active = [];

      var activeAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
      for (var i = 0; i < activeAttributes; i++) {
        var info = gl.getActiveAttrib(program, i);
        var re = RegExp('^\\s*attribute\\s+([a-z0-9A-Z_]+)\\s+' + info.name + '\\s*;', 'm');
        var sourcePosition = vertex_src.search(re);
        sourcePosition >= 0 || rmr.die('couldn\'t find active attribute "' + info.name + '" in source');
        active.push([info.name, sourcePosition]);
      }

      var layout = active.sort(function (a, b) { return a[1] > b[1]; })
                         .map (function (x   ) { return x[0]       ; });

      for (var i = 0; i < layout.length; i++) {
        gl.bindAttribLocation(program, i, layout[i]);
      }

      continue;
    }

    var variables = this._variables[name] = {};

    var addVariable = function (index, attrib) {

      var info = attrib ? gl.getActiveAttrib (program, i) :
                          gl.getActiveUniform(program, i) ;

      var name = info.name;

      variables[name] && rmr.die('rmr.glod: duplicate variable name: ' + name);

      var location = attrib ? gl.getAttribLocation (program, name) :
                              gl.getUniformLocation(program, name) ;

      var type = info.type;

      var count = type === gl.BYTE             ? 1  :
                  type === gl.UNSIGNED_BYTE    ? 1  :
                  type === gl.SHORT            ? 1  :
                  type === gl.UNSIGNED_SHORT   ? 1  :
                  type === gl.INT              ? 1  :
                  type === gl.UNSIGNED_INT     ? 1  :
                  type === gl.FLOAT            ? 1  :
                  type === gl.BOOL             ? 1  :
                  type === gl.SAMPLER_2D       ? 1  :
                  type === gl.SAMPLER_CUBE     ? 1  :

                  type === gl.  INT_VEC2       ? 2  :
                  type === gl.FLOAT_VEC2       ? 2  :
                  type === gl. BOOL_VEC2       ? 2  :

                  type === gl. INT_VEC3        ? 3  :
                  type === gl.FLOAT_VEC3       ? 3  :
                  type === gl. BOOL_VEC3       ? 3  :

                  type === gl.  INT_VEC4       ? 4  :
                  type === gl.FLOAT_VEC4       ? 4  :
                  type === gl. BOOL_VEC4       ? 4  :

                  type === gl.FLOAT_MAT2       ? 4  :
                  type === gl.FLOAT_MAT3       ? 9  :
                  type === gl.FLOAT_MAT4       ? 16 :
                  rmr.die('rmr.glod: unknown variable type: ' + type);

      var matrix = type === gl.FLOAT_MAT2 || type === gl.FLOAT_MAT3 || type === gl.FLOAT_MAT4;

      var float = type === gl.FLOAT      ||
                  type === gl.FLOAT_VEC2 || type === gl.FLOAT_VEC3 || type === gl.FLOAT_VEC4 ||
                  type === gl.FLOAT_MAT2 || type === gl.FLOAT_MAT3 || type === gl.FLOAT_MAT4;

      variables[name] = {
        location: location,
        info:     info,
        attrib:   attrib,
        count:    count,
        float:    float,
        matrix:   matrix,
        ready:    false
      };
    }

    var activeUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < activeUniforms; i++) addVariable(i, false);
    var activeAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (var i = 0; i < activeAttributes; i++) addVariable(i, true);
  }

  this.expectError(0);

  return this;
};

rmr.glod.prototype.variable = function (name) {
  this.assertProgramActive()
  var variable = this._variables[this._activeProgram][name];
  variable || rmr.die('rmr.glod.variable: variable not found: ' + name);
  return variable;
};

rmr.glod.prototype.location = function (name) { return this.variable(name).location; };
rmr.glod.prototype.info     = function (name) { return this.variable(name).info;     };
rmr.glod.prototype.isAttrib = function (name) { return this.variable(name).attrib;   };

rmr.glod.prototype.uploadCCWQuad = function() {
  var positions = new Float32Array([1, -1, 0, 1, 1, 1, 0, 1, -1, 1, 0, 1, -1, 1, 0, 1, -1, -1, 0, 1, 1, -1, 0, 1]);

  return function (name) {
    var gl = this.gl();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo(name));
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    return this;
  };
}();

rmr.glod.prototype.uploadPlaceholderTexture = function() {
  var rgba = new Uint8Array([255, 255, 255, 255, 0, 255, 255, 255, 255, 0, 255, 255, 255, 255, 0, 255]);
  
  return function (name) {
    var gl  = this.gl();
    var tex = this.texture(name);
    
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);

    return this;
  };
}();

rmr.glod.prototype.bindFramebuffer = function (name) {
  var fbo = name === null ? null : this.fbo(name);
  var gl = this.gl();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  return this;
};


// todo:
//   use the vbo's type to determine which target to bind it to
//   support stream and dynamic draw
//   support passing a normal JS array
rmr.glod.prototype.bufferDataStatic = function (targetName) {
  var al  = arguments.length;
  var gl  = this.gl();
  var vbo = this.vbo(targetName);

  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

  if (al === 2) {
    var a = arguments[1];
    rmr.array.EMPTY.__proto__.isPrototypeOf(a) && (a = new Float32Array(a));
    gl.bufferData(gl.ARRAY_BUFFER, a, gl.STATIC_DRAW);
  } else if (al === 3) {
    var a = arguments[1];
    rmr.array.EMPTY.__proto__.isPrototypeOf(a) && (a = new Float32Array(a));
    gl.bufferSubData(gl.ARRAY_BUFFER, a, arguments[2]);
  } else {
    rmr.die('rmr.glod.bufferData: bad argument count: ' + al);
  }

  return this;
};

// todo:
//   support aperture base and opening
//   support scale factor
rmr.glod.prototype.viewport = function () {
  var gl = this.gl();
  var x, y, w, h;

  var al = arguments.length;
  if (al === 4) {
    x = arguments[0];
    y = arguments[1];
    w = arguments[2];
    h = arguments[3];

    gl.viewport(x, y, w, h);
    gl.scissor(x, y, w, h);

    return this;
  } else if (al === 0) {
    var canvas = this.canvas();

    canvas.scale();

    var x = 0;
    var y = 0;
    var w = canvas.width();
    var h = canvas.height();
  } else {
    rmr.die('rmr.glod.viewport: bad argument count: ' + al);
  }

  gl.viewport(x, y, w, h);
  gl.scissor(x, y, w, h);

  return this;
};

rmr.glod.prototype.begin = function (programName) {
  this.assertInactive().startPreparing();

  this.gl().useProgram(this.program(programName));

  this._activeProgram = programName;
  this._mode = -1;

  var variables = this._variables[programName];

  for (var name in variables) {
    variables[name].ready = false;
  }

  return this;
};

rmr.glod.prototype.ready = function () {
  this.assertPreparing().startDrawing();

  var variables = this._variables[this._activeProgram];

  for (var name in variables) {
    var ov = this._optional[name];
    if (!variables[name].ready && ov) {
      switch(ov.length) {
        case 4: this.value(name, ov[0], ov[1], ov[2], ov[3]); break;
        case 3: this.value(name, ov[0], ov[1], ov[2]       ); break;
        case 2: this.value(name, ov[0], ov[1]              ); break;
        case 1: this.value(name, ov[0]                     ); break;
      }
    }

    variables[name].ready || rmr.die('rmr.glod.ready: variable not ready: ' + name);
  }

  return this;
};

rmr.glod.prototype.end = function () {
  this.assertDrawing().startInactive();
  this._activeProgram = null;
  return this;
};

rmr.glod.prototype.manual = function () {
  this.assertProgramActive();
  for (var i = 0; i < arguments.length; i++) {
    this.variable(arguments[i]).ready = true;
  }
  return this;
};

rmr.glod.prototype.value = function (name, a, b, c, d) {
  var v  = this.variable(name);
  var gl = this.gl();
  var l  = arguments.length - 1;
  var loc = v.location;

  if (v.attrib) {
    l === 1 ? gl.vertexAttrib1f(loc, a         ) :
    l === 2 ? gl.vertexAttrib2f(loc, a, b      ) :
    l === 3 ? gl.vertexAttrib3f(loc, a, b, c   ) :
    l === 4 ? gl.vertexAttrib4f(loc, a, b, c, d) :
              rmr.die('rmr.glod.value: bad length: ' + l);
  } else {
    var type = v.info.type;
    l === 1 ? (v.float ? gl.uniform1f(loc, a         ) : gl.uniform1i(loc, a         )) :
    l === 2 ? (v.float ? gl.uniform2f(loc, a, b      ) : gl.uniform2i(loc, a, b      )) :
    l === 3 ? (v.float ? gl.uniform3f(loc, a, b, c   ) : gl.uniform3i(loc, a, b, c   )) :
    l === 4 ? (v.float ? gl.uniform4f(loc, a, b, c, d) : gl.uniform4i(loc, a, b, c, d)) :
               rmr.die('rmr.glod.value: bad length: ' + l);
  }
  v.ready = true;
  return this;
};

rmr.glod.prototype.valuev = function (name, s, transpose) {
  var v = this.variable(name);

  var l = v.count;
  s || rmr.die('rmr.glod.valuev: bad vector: ' + s);

  var gl = this.gl();
  var loc = v.location;

  if (v.attrib) {
    l === s.length || rmr.die('rmr.glod.valuev: bad vector length: ' + s.length);
    gl.disableVertexAttribArray(loc);
    l === 1 ? gl.vertexAttrib1fv(loc, s) :
    l === 2 ? gl.vertexAttrib2fv(loc, s) :
    l === 3 ? gl.vertexAttrib3fv(loc, s) :
    l === 4 ? gl.vertexAttrib4fv(loc, s) :
              rmr.die('rmr.glod.valuev: bad length: ' + l);
  } else {
    if (v.matrix) {
      l === 4  ? gl.uniformMatrix2fv(loc, !!transpose, s) :
      l === 9  ? gl.uniformMatrix3fv(loc, !!transpose, s) :
      l === 16 ? gl.uniformMatrix4fv(loc, !!transpose, s) :
                 rmr.die('rmr.glod.valuev: bad length: ' + l);
    } else {
      l === 1 ? (v.float ? gl.uniform1fv(loc, s) : gl.uniform1iv(loc, s)) :
      l === 2 ? (v.float ? gl.uniform2fv(loc, s) : gl.uniform2iv(loc, s)) :
      l === 3 ? (v.float ? gl.uniform3fv(loc, s) : gl.uniform3iv(loc, s)) :
      l === 4 ? (v.float ? gl.uniform4fv(loc, s) : gl.uniform4iv(loc, s)) :
                rmr.die('rmr.glod.valuev: bad length: ' + l);
    }
  }

  v.ready = true;

  return this;
};

rmr.glod.prototype.optional = function (name, a, b, c, d) {
  var l = arguments.length - 1;

  if (l === 1 && a === undefined) {
    delete this._optional[name];
    return this;
  }

  var v = this._optional[name] || [];
  this._optional[name] = v;
  v.length = l;

  switch (l) {
    case 4: v[3] = d;
    case 3: v[2] = c;
    case 2: v[1] = b;
    case 1: v[0] = a;
  }

  return this;
};

rmr.glod.prototype.optionalv = function (name, s, transpose) {
  rmr.abstract();
  if (arguments.length === 2 && s == undefined) {
    delete this._optionalv[name];
    return this;
  }

  var v = this._optionalv[name] || [];
  var l = s.length;
  this._optionalv[name] = v;
  v.length = s.length;
  v.TRANSPOSE = !!transpose;
  for (var i = 0; i < l; i++) {
    v[i] = s[i];
  }

  return this;
};

rmr.glod.prototype.pack = function (vboName) {
  var vbo = this.vbo(vboName);
  var gl  = this.gl();

  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

  arguments.length < 2 && rmr.die('rmr.glod.pack: no attribute provided');

  var stride = 0;
  var counts = [];
  var vars = [];
  for (var i = 1; i < arguments.length; i++) {
    var name = arguments[i];
    var v = this.variable(name);
    v.attrib || rmr.die('rmr.glod.pack: tried to pack uniform: ' + name);
    v.ready  && rmr.die('rmr.glod.pack: variable already ready: ' + name);
    var count = v.count;
    stride += count;
    counts.push(count);
    vars.push(v);
  }

  var offset = 0;
  for (var i = 1; i < arguments.length; i++) {
    var name = arguments[i];
    var v = vars[i - 1];
    var loc = v.location;
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, v.count, gl.FLOAT, false, stride * 4, offset * 4);
    offset += v.count;
    v.ready = true;
  }

  return this;
};

rmr.glod.prototype.primitive = function (mode) {
  (mode >= 0 && mode <= 6) || rmr.die('rmr.glod.mode: bad mode: ' + mode);
  this._mode = mode 
  return this;
};

rmr.glod.prototype.points        = function () { this._mode = this._gl.POINTS;         return this; };
rmr.glod.prototype.lines         = function () { this._mode = this._gl.LINES;          return this; };
rmr.glod.prototype.lineLoop      = function () { this._mode = this._gl.LINE_LOOP;      return this; };
rmr.glod.prototype.lineStrip     = function () { this._mode = this._gl.LINE_STRIP;     return this; };
rmr.glod.prototype.triangles     = function () { this._mode = this._gl.TRIANGLES;      return this; };
rmr.glod.prototype.triangleStrip = function () { this._mode = this._gl.TRIANGLE_STRIP; return this; };
rmr.glod.prototype.triangleFan   = function () { this._mode = this._gl.TRIANGLE_FAN;   return this; };

rmr.glod.prototype.drawArrays = function (first, count) {
  var mode = this._mode;
  (mode >= 0 && mode <= 6) || rmr.die('rmr.glod.drawArrays: mode not set');
  var gl = this.gl();
  gl.drawArrays(mode, first, count);
  return this;
};

rmr.glod.prototype.clearColor   = function (r, g, b, a) { this.gl().clearColor  (r, g, b, a); return this; };
rmr.glod.prototype.clearDepth   = function (d         ) { this.gl().clearDepth  (d         ); return this; };
rmr.glod.prototype.clearStencil = function (s         ) { this.gl().clearStencil(s         ); return this; };

rmr.glod.prototype.clearColorv = function (s) {
  return this.clearColor(s[0], s[1], s[2], s[3]);
};

rmr.glod.prototype.clear = function (color, depth, stencil) {
  var gl = this.gl();
  
  var clearBits = 0;
  color   && (clearBits |= gl.  COLOR_BUFFER_BIT);
  depth   && (clearBits |= gl.  DEPTH_BUFFER_BIT);
  stencil && (clearBits |= gl.STENCIL_BUFFER_BIT);

  clearBits && gl.clear(clearBits);
  return this;
};

rmr.glod.prototype.bindArrayBuffer = function (name) {
  var gl = this._gl;
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo(name));
  return this;
};

rmr.glod.prototype.bindElementBuffer = function (name) {
  var gl = this._gl;
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vbo(name));
  return this;
};

rmr.glod.prototype.bindTexture2D = function (name) {
  var gl = this._gl;
  gl.bindTexture(gl.TEXTURE_2D, this.texture(name));
  return this;
}

rmr.glod.prototype.init = function (id, f) {
  this._initIds[id] || f();
  this._initIds[id] = true;
  return this;
};

rmr.glod.prototype.alloc = function (id, f) {
  this._allocIds[id] || f();
  this._allocIds[id] = true;
  return this;
};

rmr.glod.prototype.allocv = function (id, v, f) {
  if (this._versionedIds[id] !== v) {
    this._versionedIds[id] = v;
    f();
  }
  return this;
};

return rmr;
});
