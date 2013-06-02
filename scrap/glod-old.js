/*
rmr.glod2.prototype.useProgram = function (name) {
  if (this._activeProgram === name) {
    return;
  }

  if (name === null) {
    this.gl().useProgram(null);
    this._activeProgram = null;
  } else {
    this.gl().useProgram(this.program(name));
    this._activeProgram = name;
  }
  return this;
};

// todo: merge this with uniform
rmr.glod2.prototype.attrib = function (name, x, y, z, w) {
  var l  = arguments.length; 
  var gl = this.gl();
  var loc = this.location(name);

  if (l > 1) {
    if (rmr.arrayish(arguments[1])) {
      var v = arguments[1];
      var vl = v.length;
      if      (vl === 1) gl.vertexAttrib1fv(loc, v);
      else if (vl === 2) gl.vertexAttrib2fv(loc, v);
      else if (vl === 3) gl.vertexAttrib3fv(loc, v);
      else if (vl === 4) gl.vertexAttrib4fv(loc, v);
      else rmr.die('rmr.glod2.attribute: bad value length: ' + vl);
    } else {
      if      (l === 2) gl.vertexAttrib1f(loc, x         );
      else if (l === 3) gl.vertexAttrib2f(loc, x, y      );
      else if (l === 4) gl.vertexAttrib3f(loc, x, y, z   );
      else if (l === 5) gl.vertexAttrib4f(loc, x, y, z, w);
      else rmr.die('rmr.glod2.attribute: bad argument count: ' + l);
    }
  }

  this.attribs[this._activeProgram][name].const = true;

  return this;
};
*/

/*
rmr.glod2.prototype.attrib1 = function (n, v) { this.gl().vertexAttrib1fv(this.location(n), v); return this; };
rmr.glod2.prototype.attrib2 = function (n, v) { this.gl().vertexAttrib2fv(this.location(n), v); return this; };
rmr.glod2.prototype.attrib3 = function (n, v) { this.gl().vertexAttrib3fv(this.location(n), v); return this; };
rmr.glod2.prototype.attrib4 = function (n, v) { this.gl().vertexAttrib4fv(this.location(n), v); return this; };
*/

/*
// make size optional
rmr.glod2.prototype.attribPointer = function (name, opt_size, opt_type, opt_normalized, opt_stride, opt_offset) {
  var gl         = this.gl();
  var size       = arguments.length >= 2 ? opt_size       : this.attribFloats(name);
  var type       = arguments.length >= 3 ? opt_type       : gl.FLOAT               ;
  var normalized = arguments.length >= 4 ? opt_normalized : false                  ;
  var stride     = arguments.length >= 5 ? opt_stride     : 0                      ;
  var offset     = arguments.length >= 6 ? opt_offset     : 0                      ;

  if (_.isString(offset)) {
    offset = this.offsetBytes(offset);
  }

  var loc = this.location(name);
  this.gl().vertexAttribPointer(loc, size, type, normalized, stride, offset);
  return this;
};
*/

// scaler 0
// vector 0
// matrix


/*
rmr.glod2.prototype.uniform = function (name) {
  var gl      = this.gl();

  if (_.isString(name)) {
    var loc = this.location(name);
  } else {
    loc = name;
  }

  // todo: double-check length against length in info

  if (arguments.length === 1) {
    return gl.getUniform(this._activeProgram, loc);
  }

  var isFloat  = this.uniformPrimitive(name) === 'f';
  var isMatrix = this.uniformOrder(name) === 2;

  if (arguments.length == 2 && rmr.arrayish(arguments[1])) {
    var v  = arguments[1];
    var vl = v.length;

    if (isMatrix) {
      if      (vl === 4)  gl.uniformMatrix2fv(loc, false, v);
      else if (vl === 9)  gl.uniformMatrix3fv(loc, false, v);
      else if (vl === 16) gl.uniformMatrix4fv(loc, false, v);
    } else if (isFloat) {
      if      (vl === 1) gl.uniform1fv(loc, v);
      else if (vl === 2) gl.uniform2fv(loc, v);
      else if (vl === 3) gl.uniform3fv(loc, v);
      else if (vl === 4) gl.uniform4fv(loc, v);
      else rmr.die('rmr.glod2.uniform: bad length: ' + vl);
    } else {
      if      (vl === 1) gl.uniform1iv(loc, v);
      else if (vl === 2) gl.uniform2iv(loc, v);
      else if (vl === 3) gl.uniform3iv(loc, v);
      else if (vl === 4) gl.uniform4iv(loc, v);
      else rmr.die('rmr.glod2.uniform: bad length: ' + vl);
    }
  } else {
    var al = arguments.length;
    if (isMatrix) {
      rmr.die('matrix!');
    } else if (isFloat) {
      if      (al === 2) gl.uniform1f(loc, arguments[1]                                          );
      else if (al === 3) gl.uniform2f(loc, arguments[1], arguments[2]                            );
      else if (al === 4) gl.uniform3f(loc, arguments[1], arguments[2], arguments[3]              );
      else if (al === 5) gl.uniform4f(loc, arguments[1], arguments[2], arguments[3], arguments[4]);
      else rmr.die('rmg.lod.uniform: bad argument count: ' + al);
    } else {
      if      (al === 2) gl.uniform1i(loc, arguments[1]                                          );
      else if (al === 3) gl.uniform2i(loc, arguments[1], arguments[2]                            );
      else if (al === 4) gl.uniform3i(loc, arguments[1], arguments[2], arguments[3]              );
      else if (al === 5) gl.uniform4i(loc, arguments[1], arguments[2], arguments[3], arguments[4]);
      else rmr.die('rmg.lod.uniform: bad argument count: ' + al);
    }
  }

  return this;
};
*/

/*
rmr.glod2.prototype.uniformMatrix = function (name, value) {
  var gl  = this.gl();
  var loc = this.location(name);
  if      (value.length === 4)  gl.uniformMatrix2fv(loc, value);
  else if (value.length === 9)  gl.uniformMatrix3fv(loc, value);
  else if (value.length === 16) gl.uniformMatrix4fv(loc, value);
  else rmr.die('rmr.glod2.uniformMatrix: bad length: ' + value.length);
  return this;
};
*/

/*
rmr.glod2.prototype.glodUniforms = function () {
  var uniforms = this.uniforms[this._activeProgram];

  for (var name in uniforms) {
    if (name === 'glod_Input') {
      this.uniform(name, 0);
    } else if (name === 'glod_InputDepth') {
      this.uniform(name, 1);
    } 
    // else if (name.indexOf('glod_') === 0) {
      // rmr.die('glod.glodUniforms: unexepected glod uniform: ' + name);
    // }
  }

  return this;
};
*/


/*
rmr.glod2.prototype.init = function (init) {
  if (arguments.length === 0) {
    if (!this._initialized && this._init && this._contextPresent) {
      this._init.call(this);
      this._initialized = true;
    }
  } else {
    this._initialized = false;
    this._init = init;
  }

  return this;
};
*/

/*
rmr.glod2.prototype.start = function (program) {
  this.useProgram(program);

  var attribs = this.attribs[this._activeProgram];
  for (var name in attribs) {
    if (!attribs.hasOwnProperty(name)) {
      continue;
    }
    attribs[name].const  = false;
  }
  return this;
};
*/

/*
// todo: turn this into a declaration of what attributes will not be fixed
rmr.glod2.prototype.fixOffsets = function (vbo) {
  var gl      = this.gl();
  var attribs = this.attribs[this._activeProgram];
  var offset  = 0;
  var layout  = this.layouts[this._activeProgram];

  for (var i = 0; i < layout.length; i++) {
    var name = layout[i];
    if (attribs[name].const) {
      continue;
    }
    attribs[name].offset = offset;
    offset += this.attribBytes(name);
  }
  this.extras[this._activeProgram].stride = offset;

  gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo(vbo));
  var attribs = this.attribs[this._activeProgram];

  for (var key in attribs) {
    if (attribs[key].const) {
      gl.disableVertexAttribArray(attribs[key].location);
    } else {
      gl.enableVertexAttribArray(attribs[key].location);
      this.attribPointer(key, 4, gl.FLOAT, false, this.strideBytes(), key);
    }
  }

  return this;
};
*/

/*
rmr.glod2.prototype.offsetBytes = function (name) {
  var attribs = this.attribs[this._activeProgram];
  attribs.hasOwnProperty(name) || rmr.die('rmr.glod2.offsetBytes: attribute not found:', name);
  var attrib = attribs[name];

  if (attrib.const) {
    rmr.die('glod.offsetBytes: offset of const attrib requested: ' + name);
  }

  return attrib.offset;
};
*/

/*
rmr.glod2.prototype.offsetFloats = function (name) {
  return this.offsetBytes(name) / Float32Array.BYTES_PER_ELEMENT;
};
*/

/*
// number of floats in an attribute
rmr.glod2.prototype.attribFloats = function (name) {
  var info = this.info(name);

  switch(info.type) {
    case rmr.gl.FLOAT     : return 1;
    case rmr.gl.FLOAT_VEC2: return 2;
    case rmr.gl.FLOAT_VEC3: return 3;
    case rmr.gl.FLOAT_VEC4: return 4;
    default: rmr.die('bad attribute type:', info);
  };
};
*/

/*
// number of bytes in an attribute
rmr.glod2.prototype.attribBytes = function (name) {
  return this.attribFloats(name) * Float32Array.BYTES_PER_ELEMENT;
};

rmr.glod2.prototype.strideBytes = function () {
  return this.extras[this._activeProgram].stride;
};

rmr.glod2.prototype.strideFloats = function () {
  return this.strideBytes() / Float32Array.BYTES_PER_ELEMENT;
};
*/
/*
rmr.glod2.prototype.uniformPrimitive = function (name) {
  var info = this.info(name);
  var type = rmr.gl.enum(info.type);
  return /^FLOAT/.exec(type) ? 'f' : 'i';
};
*/

/*
rmr.glod2.prototype.uniformOrder = function (name) {
  var info = this.info(name);
  var type = rmr.gl.enum(info.type);

  if (type.indexOf('_MAT') !== -1) {
    return 2;
  } else if (type.indexOf('_VEC') !== -1) {
    return 1;
  } else {
    return 0;
  }
};
*/
