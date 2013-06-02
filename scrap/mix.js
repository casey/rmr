  rmr.mix = function(opt_name) {
    var mixins = rmr.arga(arguments);

    if (_.isString(opt_name)) {
      var name = mixins.shift();
    } else {
      var names = mixins.map(function (arg) { return arg.name || ''; });
      var name = _.classify(names.join(' '));
    }
    
    rmr.log('creating mixin', name + '...');

    var constructor;

    var inner = function(o) {
      for (var i = 0; i < mixins.length; i++) {
        mixins[i].apply(o);
      }
      return o;
    };

    eval('constructor = function ' + name + '() { return inner(this) };');
    var prototype = constructor.prototype = Object.create(rmr.prototype);

    var seen = [];

    for (var i = 0; i < mixins.length; i++) {
      var mixin = mixins[i];

      mixin.prototype.__proto__ === Object.prototype || rmr.die('mix: bad prototype');

      var keys = _.keys(mixin.prototype);

      for (var j = 0; j < keys.length; j++) {
        var key = keys[j];

        seen.indexOf(key) === -1 || rmr.die('mix: duplicate property: ' + key);
        seen.push(key);

        if (key[0] === '_') {
          continue;
        }

        var value = mixin.prototype[key];

        var options = {
          enumerable: false,
          writable:   false,
          value:      value
        };

        Object.defineProperty(prototype, key, options);
      }
    }

    return function() { return new constructor(); };
  };
