// SECTION: PROXIES

var proxy = knot.proxy = function ClumpProxy(clump, knot) {
  proxy.prototype.isPrototypeOf(clump) && rmr.die('proxy: trying to proxy proxy');

  var o = rmr.new(this, proxy);
  o._clump = clump;
  o._knot  = knot;
  return Object.freeze(o);
};

proxy.prototype.knot = function() {
  return this._knot;
};

function proxyMethod(name) {
  return function() {
    var ret = this._clump.__proto__[name].apply(this._clump, arguments);
    return ret === this._clump ? this : ret;
  };
};

function defaultClumpProxyMethod(name) {
  return function() {
    var c = this.clump(); // get the default clump
    var ret = c.__proto__[name].apply(c, arguments);
    return ret === c ? this : ret;
  };
}

rmr.unenumerate(proxy.prototype);
Object.freeze(proxy);
Object.freeze(proxy.prototype);
