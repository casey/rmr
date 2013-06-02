'use strict';

// particle system
// mix time + frequency data
// triangle sphere pulse
//
// fix everything, add cullFace option
//
// display ~10 sine waves, adjust amplitudes in real time
// banded eq display with intensity
//
// http://webaudiodemos.appspot.com/input/index.html

define(function(require) {
  var rmr = require('all');

  var eq = {
    path:     '/eq',
    template: require('text!./template.html'),
    style:    require('text!./style.css'),
    stats:    true
  };

  require('audiocontext');

  eq.controller = function ($scope, $timeout) {
    rmr.info('eq.controller: instantiation');

    var canvas = $('.base > canvas');
    var root = rmr.node('root').ilk('basic').color('white').pointSize(3);
    var cam = rmr.camera('root').canvas(canvas).clearColor('black');

    rmr.g.root = root;
    rmr.g.cam  = cam;

    var ac = new AudioContext();
    var ax = ac.createAnalyser();
    var buckets = 1 << 10;
    ax.fftSize = buckets * 2;
    ax.smoothingTimeConstant = 0.0;

    var wave = root.spawn('wave').pointCube(buckets);
    var freq = root.spawn('freq').pointCube(buckets);

    var waveData = new Uint8Array(buckets);
    var freqData = new Uint8Array(buckets);

    var scene = root.spawn('scene').triangles();

    var circles = 100;

    // 0, -100

    scene.iterate(circles, function (node, n, i) {
      this.spawn('circle').translate(0, 0, -100 + i).spawn().polygon(100).color('random');
    });

    var c = scene.findAll('circle');

    var eye = scene.spawn('eye').translate(0, 0, 6)

    eye.chainDriver();

    cam.spawn('wave' ).scene(wave ).opening('.q0');
    cam.spawn('freq' ).scene(freq ).opening('.q1');
    cam.spawn('scene').scene(scene).eye(eye).opening('.bottom').perspective();

    $scope.$on('frame', function () {
      ax.getByteTimeDomainData(waveData);
      for (var i = 0; i < waveData.length; i++) {
        var x = (i / waveData.length) * 2 - 1;
        var z = 0;
        var y = ((waveData[i] / 255) * 2 - 1);

        wave.setVertex(i, x, y, z);
      }

      for (var i = 0; i < circles; i++) {
        var sum = 0;
        var w = Math.floor((waveData.length / circles));
        for (var j = 0; j < w; j++) {
          sum += Math.abs(waveData[i * w + j]);
        }
        var mean = (sum / w) / 255;
        mean *= 4;

        mean >= 0 || rmr.die("we're fucked!", mean);

        c[i].child(0).clearTransform().scale(mean > 0 ? mean : 2);
      }

      ax.getByteFrequencyData(freqData);
      for (var i = 0; i < freqData.length; i++) {
        var x = (i / freqData.length) * 2 - 1;
        var z = 0;
        var y = ((freqData[i] / 255) * 2 - 1);

        freq.setVertex(i, x, y, z);
      }
    

      cam.tick();
    });

    function ok(stream) {
      var input = ac.createMediaStreamSource(stream);
      input.connect(ax);
    }

    navigator.getUserMedia({audio:true}, ok, rmr.bad);
  };

  return eq;
});
