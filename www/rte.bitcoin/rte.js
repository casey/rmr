'use strict';

define(function(require) {
  var rmr = require('all');

  require('pipeline');
  require('camera');

  var btc = {
    path:     '/bitcoin'
  , template: require('text!./template.html')
  , style:    require('text!./style.css')
  , stats:    false
  };

  var cubeVertices = rmr.node().basic().triangles().cube().vertices();

  var colors = [];

  for (var i = 0; i < 2048; i++) {
    colors.push(rmr.color('random'));
  }

  var depth = 0.1;

  var tquat  = rmr.quat();
  var trot   = rmr.mat4();
  var ttrans = rmr.vec3();

  function sizebonus(kb) {
    // lol magic numbers
    var size_min = 158;
    var size_max = 89905;

    kb = Math.max(size_min, kb);
    kb = Math.min(size_max, kb);

    return (1 - depth) * ((kb - size_min) / (size_max - size_min));
  }

  btc.controller = function ($scope, $timeout) {
    rmr.info('btc.controller: instantiation');

    var live = false;

    $scope.live = function () {
      live = true;
      $scope.replay = false;
      while (blockroot.children().length > 0) blockroot.child(0).orphan().void();
      while (txroot.children().length > 0)   txroot.child(0).orphan();
    };

    var ws = null;

    var onmessage = function (e) {
      try {
        var o  = JSON.parse(e.data);
      } catch (err) {
        rmr.log(e.data);
        return;
      }
      var op = o.op;
      var x  = o.x;

      //rmr.log(x);

      switch (op) {
        case 'utx':
          tx(x.tx_index, x.size);
          break;
        case 'block':
          block(x.txIndexes);
          break;
        default:
          rmr.die('bad message op: ' + op);
      }
    };

    function connect() {
      if (ws !== null) return;

      ws = new WebSocket('ws://ws.blockchain.info/inv');

      $scope.status = "opening";

      ws.onclose = function () { 
        $scope.status = "closed";
        ws = null; 
      };

      ws.onerror = function () {
        $scope.status = "error";
        ws = null; 
      };

      ws.onopen = function () {
        $scope.status = "open";
        ws.send('{"op":"unconfirmed_sub"}');
        ws.send('{"op":"blocks_sub"}'     );
      };

      ws.onmessage = onmessage;
    }

    var root = rmr.node('root').basic().triangles();

    var blockroot  = root.spawn('blockroot');
    var eye        = root.spawn('eye').translate(0, 4, 6).rotateX(-rmr.TAU / 12).chainDriver();
    var free       = [];

    var txrotation = 0;
    var txroot = root.spawn('txroot').chainTick(function (_, now, dt) { 
      txrotation += 0.0001 * dt;
      _.transform().identity().rotate(txrotation, 0, 1, 0);
    });

    var canvas = $('.base > canvas');
    var cam = rmr.camera('root').canvas(canvas, false).clearColor('black')
                 .scene(root).eye(eye).perspective().passOn('glow');

    var unconfirmed = {};

    var v = rmr.vec3();

    function tx(hash, size) {
      if (unconfirmed[hash]) {
        return;
      }

      var start = Date.now();
      var end   = start + 500;

      var n = txroot.spawn('tx');

      unconfirmed[hash] = n;

      var rz  = rmr.randomTheta();
      var rx  = rmr.randomTheta();
      var rzp = rmr.randomTheta();

      v[0] = (Math.random() > 0.5 ? -1 : 1) * (Math.random() * 20 + 1);
      v[1] = (Math.random() > 0.5 ? -1 : 1) * (Math.random() * 20 + 1);
      v[2] = (Math.random() > 0.5 ? -1 : 1) * (Math.random() * 20 + 1);

      var rotation = rmr.quat().quatRandomRotation();
      var rmat = rotation.quatToRotationMatrix()

      n
        .triangles()
        //.cube()
        .color(colors[hash % colors.length])
        .applyTransform(rmat)
        .prop('rquat', rotation)
        .translatev(v)
        .scale(depth + sizebonus(size))
        .prop('hash', hash)
        .prop('size', size)
        .chainTick(function (_, now, dt) {
          var t = rmr.t(start, end, now);
          this.color().a(t);
          if (t >= 1.0) return true;
        });

      // this is a gross, dangerous hack
      n._.vertices = cubeVertices;
    };

    function block(hashes) {
      hashes.sort();
      var count = hashes.length;
      var side  = Math.ceil(Math.sqrt(count));

      var m = rmr.mat4();
      m.set(txroot.transform());

      var old = blockroot.children().slice();
      var blk = blockroot.spawn('block').prop('sinkers', []);

      var done = 0;

      var txs = [];
      for (var i = 0; i < hashes.length; i++) {
        var hash = hashes[i];
        tx(hash, 158 + Math.random() * 90000);

        var n = unconfirmed[hash];
        delete unconfirmed[hash];
        txs.push(n);

        blk.adopt(n);
        m.mult(n.transform(), n.transform());

        (function () {
          var start = rmr.now();
          var end   = start + 4000;

          var x = i % side;
          var z = (i - x) / side;

          var startt = n.getTranslation();
          var endt   = rmr.vec3();

          var rquat = n.prop('rquat');

          endt.x(x / side + 0.5 / side - 0.5);
          endt.z(z / side + 0.5 / side - 0.5);

          n.chainTick(function (_, now, dt) {
            var t = rmr.t(start, end, now);
  
            startt.lerp(endt, t, ttrans);

            var bonus = sizebonus(_.prop('size'));

            var lscale = rmr.lerp(depth + bonus, 1 / side, t);
            var oscale = rmr.lerp(depth + bonus, depth   , t);

            rquat.slerp(rmr.quat.IDENTITY, t, tquat).quatToRotationMatrix(trot);

            _.clearTransform()
             .applyTransform(trot)
             .setTranslationv(ttrans)
             .scale(lscale, oscale, lscale);

            if (t >= 1.0) {
              _.color().a(1.0);
              done++;
              return true;
            }
          });
        })();
      }

      old.forEach(function (_) {
        var start    = rmr.now();
        var duration = 1000;
        var end      = start + duration;

        var sinkers = _.prop('sinkers');

        var i = sinkers.push(0) - 1;

        _.chainTick(function (_, now, dt) {
          var t = rmr.t(start, end, now);
          sinkers[i] = t;
          if (t >= 1.0) {
            return true;
          }
        });
      });

      blk.chainTick(function (_, now, dt) {
        var sinkers = _.prop('sinkers');
        var sum = sinkers.sum();
        _.clearTransform().translate(0, -sum * depth * 2, 0);
      });

      blk.chainTick(function (_, now, dt) {
        if (done === count) {
          blk.flatten();
          return true;
        }
      });
    }

    function mkblock() {
      var hashes = [];
      var count = rmr.randomInt(1, 1000);
      for (var i = 0; i < count; i++) {
        hashes.push(rmr.id());
      }

      block(hashes);
    };

    root.chainTick(function () {
      rmr.allowGarbage();
      if (rmr.key.t.pressed()) tx(rmr.id());
      if (rmr.key.b.pressed()) mkblock();
      rmr.disallowGarbage();
    });

    var msgs;

    var first_timestamp = 1378220117 * 1000;
    var last_timestamp  = 1378327441 * 1000;
    $scope.loading = true;

    require(['text!/srv/dump.json'], function (dump) {
      msgs = dump.split('\n');
      msgs.length--;
      $scope.loading = false;
    });

    var mi   = 0;
    var rate = 100;
    var ms   = rmr.now();

    $scope.$on('frame', function () { 
      if (live) connect();
      cam.tick(); 

      while (blockroot.children().length > 150) blockroot.child(0).orphan().void();
      while (txroot.children().length > 2000)   txroot.child(0).orphan();

      if (live || !msgs) return;
      var elapsed = rmr.now() - ms;
      var target = first_timestamp + elapsed * rate;
      $scope.replay = target;
      for (;;) {
        var msg = msgs[mi];

        if (!msg) {
          $scope.replay = last_timestamp;
          break;
        }

        var o  = JSON.parse(msg);
        var t = parseInt(o.x.time || 0) * 1000;

        if (t < target) {
          $scope.current = t;
          rmr.allowGarbage();
          var e = {};
          e.data = msg;
          onmessage(e);
          mi++;
          rmr.disallowGarbage();
        } else {
          break;
        }
      }
    });
    rmr.globalize({root: root, cam: cam});
  };

  return btc;
});
