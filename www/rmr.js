'use strict';

define(function(require) {

// SECTION: PREAMBLE

var _ = require('_');
var $ = require('$');
var angular = require('angular');

require('shim');

var rmr = {};

rmr.$ = $;
rmr._ = _;

window.g = rmr.g = {};

rmr.evaler = '(function (s) { return eval(s); })';

rmr.globalize = function(o) {
  for (var key in  o) {
    rmr.g[key] = o[key];
  }
};

rmr.globalize({rmr: rmr});

// SECTION: BASE

rmr.unenumerate = function(o) {
  for (var key in o) {
    if(!o.hasOwnProperty(key)) {
      continue;
    }

    Object.defineProperty(o, key, { enumerable:   false, });
  }
};

rmr._garbageAllowed = true;

rmr.garbageAllowed = function() {
  if (arguments.length > 0) {
    rmr._garbageAllowed = !!arguments[0];
  } else {
    return rmr._garbageAllowed;
  }
};

rmr.allowGarbage    = rmr.garbageAllowed.bind(rmr, true);
rmr.disallowGarbage = rmr.garbageAllowed.bind(rmr, false);

// todo: add the ability to speed up and slow down time
rmr.now = Date.now;

// SECTION: MATH

rmr.PI    = Math.PI;
rmr.TAU   = Math.PI * 2;
rmr.KB    = 1 << 10;
rmr.MB    = 1 << 20;
rmr.GB    = 1 << 30;

rmr.lerp = function (start, end, t) {
  return (1 - t) * start + t * end;
};

rmr.random = function () { 
  if (arguments.length == 0) {
    return Math.random();
  } else if (arguments.length === 1) {
    return Math.random() * arguments[0];
  }

  var min = arguments[0];
  var max = arguments[1];
  return Math.random() * (max - min) + min;
};

rmr.randomBool  = function ()      { return Math.random() >= 0.5;    };
rmr.randomTheta = function ()      { return Math.random() * rmr.TAU; };
rmr.randomIndex = function (count) { return _.random(count - 1);     };

rmr.randomInt = function () {
  if (arguments.length === 0) {
    rmr.die('rmr.randomInt: hurrrrrrrr durrrrrrrr');
  } else if (arguments.length === 1) {
    var max = arguments[0];
    return _.random(max);
  } else if (arguments.length === 2) {
    var min = arguments[0];
    var max = arguments[1];
    return Math.floor(Math.random() * (max - min + 1)) + min;
  } else {
    rmr.die('rmr.randomInt: bad argument count: ' + arguments.length);
  }

};

rmr.t = function (start, end, x) {
  return x <= start ? 0                               :
         x >= end   ? 1                               :
                      1 - ((end - x) / (end - start)) ;
};

rmr.mod = function (a, b) {
  return (a % b + b) % b;
};

rmr.new = function(that, constructor) {
  rmr.garbageAllowed() || (rmr.once() && rmr.die('rmr.new: garbage disallowed'));

  return constructor.prototype.isPrototypeOf(that) ?
         that                                      : 
         Object.create(constructor.prototype)      ;
};

rmr.init = function(that, constructor, args) {
  return constructor.apply(that, args);
};

rmr.once = function(f) {
  var onced = rmr.onced = rmr.onced || rmr.set();

  function getErrorObject() {
        try { throw Error() } catch(err) { return err; }
  }

  var err = getErrorObject();
  var caller_line = err.stack.split("\n")[4];
  //var index = caller_line.indexOf("at ");
  //var clean = caller_line.slice(index+2, caller_line.length);

  if (!onced.contains(caller_line)) {
    onced.add(caller_line);
    if (f) {
      f();
    }
    return true;
  }

  return false;
};

rmr.maybe = function (opt_probability, opt_f) {
  var probability = arguments.length > 0 ? opt_probability : 0.5;

  if (Math.random() < probability) {
    opt_f && opt_f();
    return true;
  };

  return false;
};

rmr.arrayish = function(a) { return a && _.isNumber(a.length);    };
rmr.abstract = function( ) { rmr.die('abstract function called'); };
rmr.void     = function( ) {                                      };
rmr.identity = function(x) { return x;                            };

rmr.arga     = function(args) { 
  return Array.prototype.slice.call(args);
};

rmr.dead = false;
rmr.deadReason = '';

rmr.die = function () {
  rmr.dead = true;

  var error;

  var message = Array.prototype.slice.call(arguments).join(' ');

  if (!message) {
    message = 'rmr.die';
  }

  rmr.deadReason = message;

  try {
    throw Error(message);
  } catch(e) {
    error = e;
  }

  var line   = error.stack.split("\n")[3];
  var at     = line.indexOf("at ");
  var origin = line.slice(at + 3, line.length);

  error.name = 'at ' + origin;
  throw error;
};

rmr.banana = function() {
  rmr.die('bananaphone: ring ring ring ring ring ring ring');
};

if (!console       ) { console        = {}      ; }
if (!console.log   ) { console.log    = rmr.void; }
if (!console.warn  ) { console.warn   = rmr.void; }
if (!console.error ) { console.error  = rmr.void; }
if (!console.assert) { console.assert = rmr.void; }
if (!console.dir   ) { console.dir    = rmr.void; }

rmr.assert = console.assert.bind(console);
rmr.dir    = console.dir   .bind(console);

// todo: logger improvements
// - write to a global log ring that is accessible after the fact
// - display time
// - display log level
rmr.loglevels = ['error', 'warn', 'log', 'info', 'hint'];

rmr.loggers = {
  'error': console.error.bind(console),
  'warn' : console.warn .bind(console),
  'log'  : console.log  .bind(console),
  'info' : console.log  .bind(console),
  'hint' : console.log  .bind(console)
};

rmr.loglevel = function (s) {
  var level = rmr.loglevels.indexOf(s);

  if (level === -1) {
    rmr.die('rmr.loglevel: bad log level: ' + s);
    return;
  }

  for (var i = 0; i < rmr.loglevels.length; i++) {
    var name = rmr.loglevels[i];
    var logger = i <= level ? rmr.loggers[name] : rmr.void;
    logger || console.log('rmr.loglevel: no logger:', name);
    rmr[name] = logger;
  }
};

rmr.loglevel('log');

rmr.logback = function () {
  var outer = rmr.arga(arguments);
  return function () {
    var inner = rmr.arga(arguments)
    rmr.log.apply(undefined, outer.concat(inner));
  };
};

rmr.bad  = rmr.logback('rmr.bad: ');
rmr.good = rmr.logback('rmr.good:');

rmr.hi = function () {
  rmr.log('hi');
};

rmr.byteUnits = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y'];

rmr.formatBytes = function (bytes) {
  var i = 0;
  while (bytes >= 1024) {
    bytes /= 1024;
    i++;
  }

  var s = bytes === ~~bytes ? bytes             :
          bytes >= 10       ? Math.round(bytes) :
                              bytes.toFixed(1)  ;

  return s + ' ' + rmr.byteUnits[i] + 'B';
};

rmr.removeSBI = function() {
  $('#sbi_camera_button').remove();
};

// SECTION: CHARACTERS

rmr.digits       = '0123456789';
rmr.lowercase    = 'abcdefghijklmnopqrstuvwxyz';
rmr.uppercase    = rmr.lowercase.toUpperCase();
rmr.letters      = rmr.lowercase + rmr.uppercase;
rmr.hexlowercase = rmr.lowercase.substring(0, 6);
rmr.hexdigits    = rmr.digits + rmr.hexlowercase + rmr.hexlowercase.toUpperCase();
rmr.octdigits    = rmr.digits.substring(0, 8);
rmr.gray70       = "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\|()1{}[]?-_+~<>i!lI;:,\"^`'. ";
rmr.gray10       = " .:-=+*#%@";
rmr.gray         = rmr.gray10;
rmr.printable    = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';


// SECTION: UIDS

rmr.nextId = 0;

rmr.id = function() {
  return rmr.nextId++;
};

rmr.uuid = function() {
  var source = rmr.lowercase + rmr.digits;
  var count  = source.length;
  var a      = new Array(64);

  return function () {
    for (var i = 0; i < a.length; i++) {
      a[i] = rmr.choice(source);
    }
    return a.join('');
  };
}();


// SECTION: STACKS

rmr.stack = function Stack(size) {
  rmr.garbageAllowed() || (rmr.once() && rmr.die('rmr.stack: garbage disallowed'));

  var x = rmr.new(this, rmr.stack);
  if (this !== x) return rmr.stack.apply(x, arguments);

  this._buffer = new ArrayBuffer(size);
  this._free   = 0;

  return this;
};

rmr.stack.prototype.alloc = function (type, size) {
  var bytes = type.BYTES_PER_ELEMENT * size;
  var remaining = this._buffer.byteLength - this._free;
  (bytes < remaining) || rmr.die('rmr.stack.alloc: stack is full!');
  var a = new type(this._buffer, this._free, size);
  this._free += bytes;
  return a;
};

rmr.stack.prototype.zalloc = function (type, size) {
  var a = this.alloc(type, size);
  for (var i = 0; i < size; i++) {
    a[i] = 0;
  }
  return a;
};

rmr.stack.prototype.free = function(x) {
  this._free -= x.byteLength;
  (this._free === x.byteOffset) || rmr.die('rmr.stack.free: bad free!');
};

rmr.stack.prototype.freeFrame = function() {
  for (var i = 0; i < arguments.length; i++) {
    this.free(arguments[i]);
  }
};

rmr.f32b = function (n) { return n * Float32Array.BYTES_PER_ELEMENT; };
rmr.bf32 = function (n) { return n / Float32Array.BYTES_PER_ELEMENT; };

rmr.stack.main = rmr.stack(5 * rmr.MB);

// SECTION: DICTS

// TODO: TEST

rmr.set = function Set() {
  var x = rmr.new(this, rmr.set);
  if (this !== x) return rmr.set.apply(x, arguments);

  this._array= [];

  return this;
};

rmr.set.prototype.add = function(x) {
  if (!this.contains(x)) {
    this._array.push(x);
  }

  return this;
};

rmr.set.prototype.remove = function (x) {
  if (!this.contains(x)) {
    rmr.die('rmr.set.remove: does not contain', x);
  }

  var i = this._array.indexOf(x);
  this._array.splice(i, 1);
  return this;
};

rmr.set.prototype.contains = function(x) {
  return this._array.indexOf(x) !== -1;
};

rmr.set.prototype.count = function() {
  return this._array.length;
};

rmr.set.prototype.empty = function() {
  return this.count() === 0;
};

rmr.set.prototype.clear = function() {
  this._array.length = 0;
  return this;
};

rmr.onced = rmr.set();

// TOOD: TEST

rmr.dict = function Dict() {
  var o = rmr.new(this, rmr.dict);

  o._keys = [];
  o._vals = [];

  Object.seal(o);

  return o;
}

rmr.dict.prototype.index = function(key) {
  return this._keys.indexOf(key);
};

rmr.dict.prototype.get = function(key, opt_x) {
  var i = this.index(key);

  if (i >= 0) {
    return this._vals[i];
  } else if (arguments.length === 2) {
    return opt_x;
  } else {
    rmr.die('rmr.dict.get: missing key: ' + key);
  }
};

rmr.dict.prototype.set = function(key, val) {
  var i = this.index(key);

  if (i === -1) {
    i = this._keys.length;
    this._keys.push(key);
  }

  this._vals[i] = val;

  return this;
};

rmr.dict.prototype.has = function(key) {
  return this.index(key) >= 0;
};


rmr.dict.prototype.setdefault = function(key, val) {
  if (!this.has(key)) {
    this.set(key, val);
  }

  return this.get(key);
};

rmr.dict.prototype.setlazy = function(key, f) {
  if (!this.has(key)) {
    this.set(key, f());
  }

  return this.get(key);
};

rmr.unenumerate(rmr.dict.prototype);


// SECTION: ARGS

//    arg      // required
//    _arg     // optional argument
//    arg$a$b  // options with only keys a and b
//    arg$a$b$ // options with at least keys a and b
//    $arg     // splat
//
//    pass multiple strings
//    pass multiple sources, dispatch to correct one
//    pass default values:
//      args = rmr.arger(f, arguments, defaults);

rmr.argmap = function ArgMap() {
  return rmr.new(this, rmr.argmap);
};

rmr.argmap.prototype.$has = function(key) {
  return this.hasOwnProperty(key);
};

rmr.argmap.prototype.$setDefault = function(key, x) {
  if (arguments.length !== 2) {
    rmr.die('rmr.argmap.$setDefault: bad argument count : ' + arguments.length);
  }

  return this[key] = this.$get(key, x);
};

rmr.argmap.prototype.$setDefaults = function(o) {
  for (var key in o) {
    if (!o.hasOwnProperty(key)) {
      continue;
    }

    this.$setDefault(key, o[key]);
  }

  return this;
};

rmr.argmap.prototype.$get = function(key, x) {
  if (arguments.length !== 2) {
    rmr.die('rmr.argmap.$get: bad argument count : ' + arguments.length);
  }

  if (this.$has(key)) {
    return this[key];
  } else {
    return x;
  }
};

rmr.argparser = function(def, args) {
  var req       = def.required;
  var opt       = def.optional;
  var splat     = def.splat;
  var options   = def.options;
  var name      = def.name || 'rmr.argparser';

  var min = req.length;

  if (args.length < min) {
    rmr.die(name + ': too few arguments: ' + args.length + ' < ' + min);
  }

  var max = splat ? Infinity : (req.length + opt.length);

  if (args.length > max) {
    rmr.die(name + ': too many arguments: ' + args.length + ' > ' + max);
  }

  var req_end = req.length;
  var opt_end = req.length + opt.length;

  if (splat) {
    opt_end--;
  }

  var o = rmr.argmap();
  var i = 0;

  function verifyOptionObject(key, value) {
    if (!options.hasOwnProperty(key)) {
      return;
    }

    var def = options[key];
    var req = def.required;
    var opt = def.optional;
    var strict = def.strict;
    
    var missing = [];

    for (var i = 0; i < req.length; i++) {
      var name = req[i];
      if (!(name in value)) {
        missing.push(name);
      }
    }

    if (missing.length === 1) {
      rmr.die('rmr.argparser: missing required key in options object: ' + key + '.' + missing);;
    } else if (missing.length > 1) {
      rmr.die('rmr.argparser: missing required keys in options object: ' + key + ': ' + missing);
    }

    if (strict) {
      for (var name in value) {
        if (req.indexOf(name) >= 0 || opt.indexOf(name) >= 0) {
          continue;
        }

        rmr.die('rmr.argparser: extra key in options object: ' + key + '.' + name + ': ' + value[name])
      }
    }
  }

  for (; i < req_end; i++) {
    var key = req[i];
    var val = args[i];
    verifyOptionObject(key, val);
    o[key] = args[i];
  }

  for (; i < opt_end; i++) {
    var key = opt[i - req_end];
    var val = args[i];
    verifyOptionObject(key, val);
    o[key] = args[i];
  }

  if (splat) {
    o[opt[i - req_end]] = Array.prototype.slice.call(args, opt_end);
  }
  
  return o;
};

rmr.argdef = function(x) {
  var parms;

  if (_.isFunction(x)) {
    var s = x.toString();
    var parameter_re = /function[^(]+[(](.*?)[)]/;
    var match = parameter_re.exec(s);
    match || rmr.die('rmr.argdef: bad function definition: ' + s);
    parms = match[1].replace(/,|\s/g, ' ').split(/\s+/);
  } else {
    var s = x.toString();
    parms = s.replace(/,|\s/g, ' ').split(/\s+/);
  }
  
  var def = {
    required: [],
    optional: [],
    splat:    false,
    options:  {},
    name:     x.name
  };

  for (var i = 0; i < parms.length; i++) {
    var parm = parms[i];

    def.splat && rmr.die('rmr.argdef: splat must be last parameter');

    var sigil    = parm[0];
    var parmname = parm.replace(/^[$_]/, '');

    if (sigil !== '$' && parmname.indexOf('$') !== -1) {
      var parts = parmname.split('$');
      var strict = _.last(parmname) !== '$';
      parmname = parts.shift();

      var opt_def = def.options[parmname] = {
        required: [],
        optional: [],
        strict:   strict
      };

      for (var j = 0; j < parts.length; j++) {
        var optional = parts[j][0] === '_';
        var name = parts[j].replace(/^_/, '');
        if (!name) {
          continue;
        }
        (optional ? opt_def.optional : opt_def.required).push(name);
      }
    }

    rmr.log(parmname);

    def.required.indexOf(parmname) === -1 || rmr.die('rmr.argdef: duplicate argument: ' + parmname);
    def.optional.indexOf(parmname) === -1 || rmr.die('rmr.argdef: duplicate argument: ' + parmname);

    if (sigil === '$') {
      def.splat = true;
    }

    if (sigil === '_' || sigil === '$') {
      def.optional.push(parmname);
    } else {
      def.optional.length === 0 || rmr.die("rmr.argdef: required parameters can't appear after optional parameters");
      def.required.push(parmname);
    }
  }

  return def;
};

rmr.arger = function(f, args) {
  var cache = rmr.argdef_cache = rmr.argdef_cache || rmr.dict();

  if (!cache.has(f)) {
    cache.set(f, rmr.argdef(f));
  }

  return rmr.argparser(cache.get(f), args);
};

// SECTION: RING BUFFERS

rmr.ring = function Ring(buffer_or_size) {
  var x = rmr.new(this, rmr.ring);
  if (this !== x) return rmr.ring.apply(x, arguments);

  this._buffer  = rmr.arrayish(buffer_or_size) ? buffer_or_size : new Array(buffer_or_size || 100);
  this._written = 0;
  this._dropped = 0;

  return this;
};

rmr.ring.prototype.count = function () {
  return Math.min(this._written - this._dropped, this._buffer.length);
};

rmr.ring.prototype.capacity = function() {
  return this._buffer.length;
};

rmr.ring.prototype.full = function() {
  return this.count() === this.capacity();
};

rmr.ring.prototype.fill = function(x) {
  while (this.count() < this.capacity()) {
    this.write(x);
  }
  return this;
};

rmr.ring.prototype.get = function (i) {
  i < this.count() || rmr.die('bad index');
  var index = rmr.mod(i + this._dropped, this._buffer.length);
  return this._buffer[index];
}

rmr.ring.prototype.write = function (x) {
  var i = rmr.mod(this._written, this._buffer.length);
  this._buffer[i] = x;
  this._written++;
  return this;
};

rmr.ring.prototype.drop = function () {
  this.count() > 0 || rmr.die('rmr.ring.drop: drop called on empty ring buffer');
  var i = rmr.mod(this._dropped, this._buffer.length);
  var x = this._buffer[i];
  this._dropped++;
  return x;
};

rmr.ring.prototype.sum = function () {
  var sum = 0;
  var count = this.count();
  for (var i = 0; i < count; i++) {
    sum += this.get(i);
  }
  return sum;
};

rmr.ring.prototype.mean = function() {
  return this.sum() / this.count();
};

// SECTION: APERTURE

rmr.aperture = function(base, opening) {
  rmr.garbageAllowed() || rmr.die('rmr.aperture: garbage disallowed');

  if (typeof base === "string")    rmr.die('base is selector');
  if (typeof opening === "string") rmr.die('opening is selector');

  base    = base.jquery    ? base[0]    : base;
  opening = opening.jquery ? opening[0] : opening;

  base    || rmr.die('rmr.aperture: no base:',    base);
  opening || rmr.die('rmr.aperture: no opening:', opening);

  var bw = base.offsetWidth;
  var bh = base.offsetHeight;
  var bt = base.offsetTop;
  var bl = base.offsetLeft;

  var ow = opening.offsetWidth;
  var oh = opening.offsetHeight;
  var ot = opening.offsetTop;
  var ol = opening.offsetLeft;

  return {
    width:  ow,
    height: oh,

    top:    ot - bt,
    bottom: (bt + bh) - (ot + oh),
    left:   ol - bl,
    right:  (bl + bh) - (ol + oh),
  };
};

$.fn.aperture = rmr.aperture.fn = function(child) {
  this.length > 0 || rmr.die('rmr.aperture.fn: called on empty node');
  return rmr.aperture(this, $(child) || this);
};

$.fn.scale = function (opt_ratio) {
  var ratio = opt_ratio || 1;

  var l = this.length;
  for (var i = 0; i < l; i++) {
    var e = this[i];
    e.width  = e.offsetWidth  / ratio;
    e.height = e.offsetHeight / ratio;
  }

  /*

  var a = this.aperture();
  this.prop('width',  a.width / ratio);
  this.prop('height', a.height / ratio);
  */
};

$.fn.getContext = function () {
  return this[0].getContext.apply(this[0], arguments);
};

rmr.empty = function (o) {
  for (var key in o) {
    if (o.hasOwnProperty(key)) {
      delete o[key];
    }
  }
  return o;
}

// SECTION: DEPENDENCY INJECTION

var FN_ARGS        = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
var FN_ARG_SPLIT   = /,/;
var FN_ARG         = /^\s*(_?)(\S+?)\1\s*$/;
var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
rmr.parameters = function (f) {
  typeof f === "function" || rmr.die('rmr.parameters: non-function argument: ' + f);
  var parms = [];
  var text  = f.toString().replace(STRIP_COMMENTS, '');
  var decl  = text.match(FN_ARGS);
  var split = decl[1].split(FN_ARG_SPLIT);
  for (var i = 0; i < split.length; i++) {
    var arg = split[i];
    arg.replace(FN_ARG, function(all, underscore, name){
      parms.push(name);
    });
  }

  parms.length === f.length ||
    rmr.die('rmr.parameters: parameter length mismatch: ' + parms.length);

  return parms;
};

rmr.object = ({}).__proto__;

rmr.raf = (window.requestAnimationFrame).bind(window);

rmr.dataURI = function (payload, mime, b64) {
  payload = payload || '';
  mime    = mime    || '';
  b64     = b64 ? ';base64' : '';

  return 'data:' + mime + b64 + ',' + payload;
};

// SECTION: KEYS

(function() {
  // generate the table
  var table = [];

  function lookup(i, lower, upper) {
    !(i >= 0 && i < lower.length) && rmr.die('charForKeydown: bad index:', i);
    (lower.length === upper.length) || rmr.die('charForKeydown: upper and lower not same length');
    return [lower[i], upper[i]];
  }

  for (var i = 0; i < 1024; i++) {
    table[i] = i >= 48 && i <= 57 ? lookup(i - 48, rmr.digits, ')!@#$%^&*(') :
               i >= 65 && i <= 90 ? lookup(i - 65, rmr.lowercase, rmr.uppercase) :
               i ===   9 ? '\t'  :
               i ===  13 ? '\n'  :
               i ===  32 ? ' '   :
               i === 187 ? '=+'  :
               i === 186 ? ';:'  :
               i === 188 ? ',<'  :
               i === 189 ? '-_'  :
               i === 190 ? '.>'  :
               i === 191 ? '/?'  :
               i === 192 ? '`~'  :
               i === 219 ? '[{'  :
               i === 220 ? '\\|' :
               i === 221 ? ']}'  :
               i === 222 ? '\'"' :
                           undefined;

    if (table[i] && table[i].length === 2) table[i] = [table[i][0], table[i][1]];
  }

  rmr.codeToChar = function (which, shift) {
    var t = table[which];
    return t ? (!!shift ? t[1] : t[0]) : '';
  };

  var inverse = {};

  for (var i = 0; i < 1024; i++) {
    var entry = table[i];
    if (!entry) continue;

    for (var j = 0; j < 2; j++) {
      var c = entry[j];
      if (typeof c !== "string") continue;
      c in inverse && rmr.die('duplicate character:', c);
      inverse[c] = i;
    }
  }

  rmr.charToCode = function (c) {
    inverse.hasOwnProperty(c) || rmr.die('rmr.charToCode: unknown character:', c);
    return inverse[c];
  };

  rmr.charToShift = function (c) {
    return rmr.uppercase.indexOf(c) >= 0
    || '~!@#$%^&*()_+{}|:"<>?'.indexOf(c) >= 0;
  };
})();

// SECTION: MAGIC

// object -> original prototype
// object -> extension -> originalprototype

rmr.extend = function (obj, ext, op) {
  if (ext.__proto__ !== rmr.object && ext.__proto__ !== op) {
    rmr.die('rmr.extend: extension reused');
  }

  ext.__proto__ = op;
  obj.__proto__ = ext;

  return obj;
};

// SECTION: ILK

rmr.ilk = function Ilk(name) {
  rmr.ilk.closed && rmr.die('rmr.ilk: instantiated after close');

  var x = rmr.new(this, Ilk);
  if (this !== x) return Ilk.apply(x, arguments);

  rmr.ilk[name] === undefined || rmr.die('rmr.ilk: duplicate property: ' + name);
  rmr.ilk[name] = this;

  this._name = name;

  this.node = Object.create(rmr.ilk.nodePrototype);
  this.node._ilk = this;

  this.node.void = function () {
    this.ilk('none');
  };

  return this;
};

rmr.ilk.nodePrototype = {};

rmr.ilk.closed = false;

rmr.ilk.close = function (node) {
  rmr.ilk.closed && rmr.die('rmr.ilk.close: called twice');
  rmr.ilk.closed = true;
  node.prototype = rmr.ilk.nodePrototype;
};

rmr.ilk.prototype.name = function () {
  return this._name;
};

rmr.ilk.prototype.init    = rmr.void;
rmr.ilk.prototype.spawn   = rmr.void;
rmr.ilk.prototype.clone   = rmr.void;
rmr.ilk.prototype.verify  = rmr.void;
rmr.ilk.prototype.render  = rmr.void;
rmr.ilk.prototype.destroy = rmr.void;


rmr.emptyBuffer  = new ArrayBuffer(0);
rmr.emptyFloat32 = new Float32Array(rmr.emptyBuffer);

return rmr;
});
