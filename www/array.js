'use strict';

define(function(require) {
var rmr = require('rmr');

var goog = require('goog');

function construct(length, args) {
  rmr.garbageAllowed() || rmr.die('rmr.construct: garbage disallowed');

  var a = rmr.f32(length);
  var l = args.length;

  if (l === 0) return a; // already initialized

  var src = l === 1 ? args[0] : args;

  length === src.length || rmr.die('array.construct: length mismatch:', length, '/', src.length);

  switch(length) {
    default: for (var i = 0; i < length; i++) a[i] = src[i]; break;
    case  4: a[3] = src[3];
    case  3: a[2] = src[2];
    case  2: a[1] = src[1];
    case  1: a[0] = src[0];
  }

  return a;
}

rmr.array  = function () {
  var l = arguments.length;
  switch (l) {
    case 0:
      return [];
    case 1:
      var x = arguments[0];
      if (typeof x === "number") {
        return new Array(x);
      }
      if (x && x.IS_ARRAY) {
        var a = new Array(x.length);
        for (var i = 0; i < x.length; i++) {
          a[i] = x[i];
        }
        return a;
      }
    default:
      var a = new Array(arguments.length);
      for (var i = 0; i < arguments.length; i++) {
        a[i] = arguments[i];
      }
      return a;
  }
};

rmr.buffer = function (x) { return new ArrayBuffer      (x); };
rmr.i8     = function (x) { return new Int8Array        (x); };
rmr.u8     = function (x) { return new Uint8Array       (x); };
rmr.u8c    = function (x) { return new Uint8ClampedArray(x); };
rmr.i16    = function (x) { return new Int16Array       (x); };
rmr.u16    = function (x) { return new Uint16Array      (x); };
rmr.i32    = function (x) { return new Int32Array       (x); };
rmr.u32    = function (x) { return new Uint32Array      (x); };
rmr.f32    = function (x) { return new Float32Array     (x); };
rmr.f64    = function (x) { return new Float64Array     (x); };

rmr.vec2 = function () { return construct(2,  arguments); };
rmr.vec3 = function () { return construct(3,  arguments); };
rmr.vec4 = function () { return construct(4,  arguments); };
rmr.mat3 = function () { return construct(9,  arguments); };
rmr.mat4 = function () { return construct(16, arguments); };
rmr.quat = function () { return construct(4,  arguments); };

var extensions = Object.create(null);

extensions.IS_ARRAY = true;

extensions.isVec2 = function () { return this.length === 2;  };
extensions.isVec3 = function () { return this.length === 3;  };
extensions.isVec4 = function () { return this.length === 4;  };
extensions.isQuat = function () { return this.length === 4;  };
extensions.isMat2 = function () { return this.length === 4;  };
extensions.isMat3 = function () { return this.length === 9;  };
extensions.isMat4 = function () { return this.length === 16; };

extensions.assertVec2 = function () { this.isVec2() || rmr.die('assertVec2: bad length: ' + this.length); };
extensions.assertVec3 = function () { this.isVec3() || rmr.die('assertVec3: bad length: ' + this.length); };
extensions.assertVec4 = function () { this.isVec4() || rmr.die('assertVec4: bad length: ' + this.length); };
extensions.assertQuat = function () { this.isQuat() || rmr.die('assertQuat: bad length: ' + this.length); };
extensions.assertMat2 = function () { this.isMat2() || rmr.die('assertMat2: bad length: ' + this.length); };
extensions.assertMat3 = function () { this.isMat3() || rmr.die('assertMat3: bad length: ' + this.length); };
extensions.assertMat4 = function () { this.isMat4() || rmr.die('assertMat4: bad length: ' + this.length); };

extensions.quatFromAngleAxis = function (angle, axis) {
  this.assertQuat();
  return goog.vec.Quaternion.fromAngleAxis(angle, axis, this);
};

extensions.quatFromRotationMatrix = function (matrix) {
  this.assertQuat();
  return goog.vec.Quaternion.fromRotationMatrix4(matrix, this);
};

extensions.quatToRotationMatrix = function (opt_dest) {
  this.assertQuat();
  return goog.vec.Quaternion.toRotationMatrix4(this, opt_dest || rmr.mat4());
};

extensions.quatRandomRotation = function () {
  this.assertQuat();

  var u1 = Math.random();
  var u2 = Math.random();
  var u3 = Math.random();

  this[0] = Math.sqrt(1 - u1) * Math.sin(rmr.TAU * u2);
  this[1] = Math.sqrt(1 - u1) * Math.cos(rmr.TAU * u2);
  this[2] = Math.sqrt(    u1) * Math.sin(rmr.TAU * u3);
  this[3] = Math.sqrt(    u1) * Math.cos(rmr.TAU * u3);

  return this;
};

rmr.arr = function () {
  var a0 = arguments[0];
  var l  = arguments.length;

  if (l === 1 && typeof a0 === "number") {
    return new Array(a0);
  }

  var a = new Array(l);

  for (var i = 0; i < l; i++) {
    a[i] = arguments[i];
  }

  return a;
};

extensions.randomize = function (opt_a, opt_b) {
  var l = this.length;

  switch(l) {
    case 4:
      if (arguments.length === 0)        { // [0, 1)
        this[3] = Math.random();
      } else if (arguments.length === 1) { // [0, opt_a]
        this[3] = Math.random() * opt_a;
      } else                             { // [opt_a, opt_b)
        this[3] = Math.random() * (opt_b - opt_a) + opt_a;
      }
    case 3:
      if (arguments.length === 0)        { // [0, 1)
        this[0] = Math.random();
        this[1] = Math.random();
        this[2] = Math.random();
      } else if (arguments.length === 1) { // [0, opt_a]
        this[0] = Math.random() * opt_a;
        this[1] = Math.random() * opt_a;
        this[2] = Math.random() * opt_a;
      } else                             { // [opt_a, opt_b)
        this[0] = Math.random() * (opt_b - opt_a) + opt_a;
        this[1] = Math.random() * (opt_b - opt_a) + opt_a;
        this[2] = Math.random() * (opt_b - opt_a) + opt_a;
      }
      break;
    default:
      for (var i = 0; i < l; i++) {
        if (arguments.length === 0)        { // [0, 1)
          this[i] = Math.random();
        } else if (arguments.length === 1) { // [0, opt_a]
          this[i] = Math.random() * opt_a;
        } else                             { // [opt_a, opt_b)
          this[i] = Math.random() * (opt_b - opt_a) + opt_a;
        }
      }
  }

  return this;
};

extensions.identity = function() {
  var l = this.length;
  switch(l) {
    case 16: goog.vec.Mat4.makeIdentity(this);                     break; // mat4
    case 4:  this[0] = 1.0; this[1] = 0; this[2] = 0; this[3] = 0; break; // quat
    default:
      rmr.die('array.identity: unsupported length:' + l);
  }
  return this;
};

extensions.add = function (x, opt_dest) {
  var d = opt_dest || this;
  var l = this.length;

  switch(l) {
    case  4: d[3] = this[3] + x[3];
    case  3: d[2] = this[2] + x[2];
    case  2: d[1] = this[1] + x[1];
             d[0] = this[0] + x[0];
      break;

    default:
      for (var i = 0; i < l; i++) {
        d[i] = this[i] + x[i];
      }
  }

  return d;
};

extensions.subtract = function (x, opt_dest) {
  var d = opt_dest || this;
  var l = this.length;

  switch(l) {
    case  4: d[3] = this[3] - x[3];
    case  3: d[2] = this[2] - x[2];
    case  2: d[1] = this[1] - x[1];
             d[0] = this[0] - x[0];
      break;

    default:
      for (var i = 0; i < l; i++) {
        d[i] = this[i] - x[i];
      }
  }

  return d;
};

extensions.clone = function () {
  rmr.garbageAllowed() || rmr.die('rmr.vec3: garbage disallowed');
  return this.constructor(this);
};

extensions.load = function() {
  var al = arguments.length;

  for (var i = 0; i < al; i++) {
    this[i] = arguments[i];
  }

  return this;
}

extensions.array = function () {
  var a = new Array(this.length);
  for (var i = 0; i < this.length; i++) {
    a[i] = this[i];
  }
  return a;
};

extensions.lerp = function(v, f, opt_dest) {
  if (this.length === 3) {
    return goog.vec.Vec3.lerp(this, v, f, opt_dest || this);
  } else if (this.length === 4) {
    return goog.vec.Vec4.lerp(this, v, f, opt_dest || this);
  } else {
    rmr.log(this.length);
    rmr.abstract();
  }
};

extensions.slerp = function (q, t, opt_dest) {
  return goog.vec.Quaternion.slerp(this, q, t, opt_dest || this);
};

extensions.nlerp = extensions.lerp;
extensions.sub = extensions.subtract;

extensions.get0 = function() { if(arguments.length === 0) return this[0]; this[0] = arguments[0]; return this; };
extensions.get1 = function() { if(arguments.length === 0) return this[1]; this[1] = arguments[0]; return this; };
extensions.get2 = function() { if(arguments.length === 0) return this[2]; this[2] = arguments[0]; return this; };
extensions.get3 = function() { if(arguments.length === 0) return this[3]; this[3] = arguments[0]; return this; };

extensions.x = extensions.get0;
extensions.y = extensions.get1;
extensions.z = extensions.get2;
extensions.w = extensions.get3;

extensions.r = extensions.get0;
extensions.g = extensions.get1;
extensions.b = extensions.get2;
extensions.a = extensions.get3;

extensions.u = extensions.get0;
extensions.v = extensions.get1;

extensions.s = extensions.get0;
extensions.t = extensions.get1;
extensions.p = extensions.get2;
extensions.q = extensions.get3;

extensions.sum     = function() { var sum = 0; for (var i = 0; i < this.length; i++) sum += this[i]; return sum; };
extensions.mean    = function() { return this.sum() / this.length; };
extensions.max     = function() { return Math.max.apply(Math, this); };
extensions.min     = function() { return Math.min.apply(Math, this); };
extensions.product = function() { var p = 1; for (var i = 0; i < this.length; i++) p *= this[i]; return p; }; 
extensions.all     = function() { for (var i = 0; i < this.length; i++) if (!this[i]) return false; return true; };
extensions.any     = function() { for (var i = 0; i < this.length; i++) if (!!this[i]) return true; return false; };
extensions.none    = function () { return !this.any(); };

extensions.get     = function (i) {
  if (i < 0) {
    this.length + 1 > -i || rmr.die('rmr.get: index too large:', i);
    return this[this.length + i];
  };

  this.length > i || rmr.die('rmr.get: index too large: ', i);
  return this[i];
};

extensions.last = function () { return this[this.length - 1]; };
extensions.choice = function() { return this[rmr.randomIndex(this.length)]; };


extensions.floor  = function()  { for (var i = 0; i < this.length; i++) this[i] = Math.floor(this[i]); return this; };

extensions.roll      = rmr.abstract;
extensions.round     = rmr.abstract;
extensions.ceil      = rmr.abstract;
extensions.clamp     = rmr.abstract;
extensions.clip      = rmr.abstract;

extensions.zero = function () {
  var l = this.length;
  for (var i = 0; i < l; i++ ) this[i] = 0;
  return this; 
};

extensions.negate = function (opt_dest) {
  var d = opt_dest || this;
  var l = this.length;
  for (var i = 0; i < l; i++) {
    d[i] = -this[i];
  }
  return d;
};

extensions.dot = function (v) {
  var l = this.length;
  var r = 0;
  for (var i = 0; i < l; i++) {
    r += this[i] * v[i];
  }
  return r;
};

extensions.magnitudeSquared = function () {
  var l = this.length;
  var s = 0;
  for (var i = 0; i < l; i++) {
    var x = this[i];
    s += x * x;
  }
  return s;
};

extensions.magnitude = function () {
  return Math.sqrt(this.magnitudeSquared());
};

extensions.distanceSquared = function (a) {
  var l = this.length;
  var s = 0;
  for (var i = 0; i < l; i++) {
    var x = this[i] - a[i];
    s += x * x;
  }
  return s;
};

extensions.distance = function (a) {
  return Math.sqrt(this.distanceSquared(a));
};

extensions.normalize = function (opt_dest) {
  var l = this.length;
  var d = opt_dest || this;
  var imag = 1 / this.magnitude();
  for (var i = 0; i < l; i++) {
    d[i] = this[i] * imag;
  }
  return d;
};

extensions.equals = function (v) {
  var l = this.length;
  for (var i = 0; i < l; i++) {
    if (this[i] !== v[i]) {
      return false;
    }
  }
  return true;
};

extensions.cross = function (v, opt_dest) {
  this.length === 3 || rmr.die('rmr.array.cross: casey is too lazy to generalize to other dimensions');
  return goog.vec.Vec3.cross(this, v, opt_dest || this);
};

extensions.scale = function (s, opt_dest) {
  var d = opt_dest || this;
  var l = this.length;
  for (var i = 0; i < l; i++) {
    d[i] = this[i] * s;
  }
  return d;
};

extensions.rotateX = function (angle) { this.assertMat4(); return goog.vec.Mat4.rotateX(this, angle); };
extensions.rotateY = function (angle) { this.assertMat4(); return goog.vec.Mat4.rotateY(this, angle); };
extensions.rotateZ = function (angle) { this.assertMat4(); return goog.vec.Mat4.rotateZ(this, angle); };

extensions.orthographic = function(left, right, bottom, top, near, far) {
  this.assertMat4();
  goog.vec.Mat4.makeOrtho(this, left, right, bottom, top, near, far);
  return this;
};

extensions.perspective = function(fovy, aspect, near, far) {
  this.assertMat4();

  var angle = fovy / 2;
  var dz = far - near;
  var sinAngle = Math.sin(angle);

  if (dz == 0 || sinAngle == 0 || aspect == 0) {
    return this;
  }

  var cot = Math.cos(angle) / sinAngle;

  this[ 0] = cot/aspect; this[ 1] =   0; this[ 2] =                      0; this[ 3] =  0;
  this[ 4] =          0; this[ 5] = cot; this[ 6] =                      0; this[ 7] =  0;
  this[ 8] =          0; this[ 9] =   0; this[10] =     -(far + near) / dz; this[11] = -1;
  this[12] =          0; this[13] =   0; this[14] = -(2 * near * far) / dz; this[15] =  0;

  return this;
};

extensions.lookAt = function (eye, target, up) {
  this.assertMat4();
  return goog.vec.Mat4.makeLookAt(this, eye, target, up);
};

extensions.eulerZXZ = function(zTheta, xTheta, zThetaPrime) {
  this.assertMat4();
  return goog.vec.Mat4.makeEulerZXZ(this, zTheta, xTheta, zThetaPrime)
};

extensions.eulerZXZv = function (v) {
  this.assertMat4(); v.assertVec3();
  return this.eulerZXZ(v[0], v[1], v[2]);
};

extensions.rotateZXZ = function () {
  var t = rmr.mat4();

  return function(a, b, c, d) {
    this.assertMat4();
    var z, y, zp, dest;

    if        (arguments.length === 1 || arguments.length === 2) {
      z  = a[0];
      y  = a[0];
      zp = a[0];
      dest = arguments.length === 2 ? b : this;
    } else if (arguments.length === 3 || arguments.length === 4) {
      z = a;
      y = b;
      zp = c;
      dest = arguments.length === 4 ? d : this;
    } else {
      rmr.die('rmr.mat4.rotateZXZ: bad argument count: ' + arguments.length);
    }

    t.eulerZXZ(z, y, zp);
    this.mult(t, dest);
    return dest;
  };
}();

extensions.mult = function(x, opt_dest) { 
  this.assertMat4();
  if (x.length === 16) { return goog.vec.Mat4.multMat   (this, x, opt_dest || this); }
  if (x.length === 4 ) { return goog.vec.Mat4.multVec4  (this, x, opt_dest || x   ); }
  if (x.length === 3 ) { return goog.vec.Mat4.multVec3  (this, x, opt_dest || x   ); }
  /* scalar         */   return goog.vec.Mat4.multScalar(this, x, opt_dest || this);
};

extensions.scaleMat = function (x, y, z) {
  this.assertMat4();
  goog.vec.Mat4.scale(this, x, y, z);
  return this;
};

extensions.scaleMatv = function (v) {
  return this.scaleMat(v[0], v[1], v[2]);
};

extensions.translate = function (x, y, z) {
  this.assertMat4();
  return goog.vec.Mat4.translate(this, x, y, z);
};

extensions.translatev = function (v) {
  return this.translatev(v[0], v[1], v[2]);
};

extensions.setTranslation = function(x, y, z) {
  this.assertMat4();
  goog.vec.Mat4.setColumnValues(this, 3, x, y, z, 1);
  return this;
};

extensions.setTranslationv = function (v) {
  return this.setTranslation(v[0], v[1], v[2]);
};

extensions.getTranslation = function (opt_dest) {
  return goog.vec.Mat4.getTranslation(this, opt_dest || rmr.vec3());
};

extensions.rotate = function (theta, x, y, z) {
  this.assertMat4();
  arguments.length !== 4 && rmr.die('rmr.mat4.rotate: bad argument count');
  goog.vec.Mat4.rotate(this, theta, x, y, z);
  return this;
};

extensions.invert = function (opt_dest) {
  this.assertMat4();
  goog.vec.Mat4.invert(this, opt_dest || this);
  return this;
};

extensions.pushv = function (v) {
  this.push.apply(this, v);
  return this;
};

extensions.each = function (f, opt_this) {
  for (var i = 0; i < this.length; i++) {
    f.call(opt_this || this, this[i], i, this);
  }
  return this;
};

var victims = [
  rmr.arr(0).__proto__
, rmr.i8 (0).__proto__
, rmr.u8 (0).__proto__
, rmr.i16(0).__proto__
, rmr.u16(0).__proto__
, rmr.i32(0).__proto__
, rmr.u32(0).__proto__
, rmr.f32(0).__proto__
, rmr.f64(0).__proto__
];

for (var i = 0; i < victims.length; i++) {
  var victim = victims[i];
  for (var name in extensions) {
    if (victim[name] !== undefined) {
      rmr.die('rmr.vec: adding duplicate property: ' + name, victim, i);
    }
    Object.defineProperty(victim, name, {value: extensions[name]});
  }
}

rmr.quat  .IDENTITY = rmr.quat().identity();
rmr.mat4  .IDENTITY = rmr.mat4().identity();
rmr.buffer.EMPTY    = rmr.buffer();
rmr.i8    .EMPTY    = rmr.i8();
rmr.u8    .EMPTY    = rmr.u8();
rmr.u8c   .EMPTY    = rmr.u8c();
rmr.i16   .EMPTY    = rmr.i16();
rmr.u16   .EMPTY    = rmr.u16();
rmr.i32   .EMPTY    = rmr.i32();
rmr.u32   .EMPTY    = rmr.u32();
rmr.f32   .EMPTY    = rmr.f32();
rmr.f64   .EMPTY    = rmr.f64();
rmr.array .EMPTY    = rmr.array();

return rmr;
});
