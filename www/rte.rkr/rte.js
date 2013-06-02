'use strict';

define(function(require) {

var rmr = require('all');
var $   = rmr.$;

var rte = {
  path:     '/rkr'
, template: require('text!./template.html')
, style:    require('text!./style.css')
, stats:    true
, garbage:  true
};

function load_sound(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url, true);
  xhr.responseType = 'arraybuffer';
  xhr.onload = function(e) {
    callback(this.response);
  };
  xhr.send();
}

var width  = 80;
var height = 45;

rte.controller = function ($scope, $routeParams) {
  var hash = window.location.hash;
  var canvas = $('canvas.main');
  var ct = rmr.ct(canvas);

  var byteFrequencyData  = rmr.u8();
  var byteTimeDomainData = rmr.u8();

  rmr.log('rkr.controller');

  $scope.status = "loading audio...";

  var ac   = new AudioContext();
  var ax   = ac.createAnalyser();
  var gain = ac.createGain();

  gain.connect(ax);
  gain.connect(ac.destination);

  function ok(stream) {
    ac.createMediaStreamSource(stream).connect(gain);
  }

  if (hash === "#um") {
    navigator.getUserMedia({audio:true}, ok, rmr.bad);
  } else {
    load_sound('http://rodarmor.com/etc/grown_up.mp3', function (buffer) {
        ac.decodeAudioData(buffer, function (buffer) {
          rmr.log("audio loaded");
          $scope.status = "ok  ";

          var source = ac.createBufferSource();
          rmr.log(source);
          source.buffer = buffer;
          source.loop = true;
          source.connect(gain);
          source.start(0); // Play immediately.
        }, rmr.bad);
    });
  }

  var ffts = ax.fftSize = 256;
  var bins = ax.frequencyBinCount;

  byteTimeDomainData.length === ffts || (byteTimeDomainData = rmr.u8 (ffts));
  byteFrequencyData.length  === bins || (byteFrequencyData  = rmr.u8 (bins));

  var frames = rmr.g.frames = [];

  $scope.$on('drop', function (e, je) {
    var files = je.dataTransfer.files;

    // process all File objects
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      var reader = new FileReader();

      reader.onload = function (e) {
        var url = e.target.result;
        var img = new Image();

        img.onload = function () {
          var icv = $('<canvas>');
          var ict = rmr.ct(icv);
          icv.width(img.width);
          icv.height(img.height);
          ict.drawImage(img, 0, 0, img.width, img.height);

          var data = ict.getImageData(0, 0, width, height);
          //rmr.log("loaded", e.target.result.substring(0, 100));
          //rmr.log(data);

          frames.push(data);
        };

        img.src = url;
      };
      
      reader.readAsDataURL(file);
    }
  });

  $scope.$on('frame', function (e, now, dt, count) {
    $scope.frames = frames.length;
    canvas.scale();
    ct.fillStyle('black').fillRect(0, 0, ct.width(), ct.height());

    ax.getByteTimeDomainData(byteTimeDomainData);
    ax.getByteFrequencyData (byteFrequencyData );
    var intensity = (byteFrequencyData.mean() / 255) * 2;
    //var intensity = Math.sin((Date.now() / 1000) % rmr.TAU) * 0.5 + 0.5;
    $scope.intensity = intensity;

    var frame = frames[((frames.length - 1) * intensity.clamp(0, 1)).floor()]; // is this biased?
    
    if (frame) {
      for (var row = 0; row < height; row++) {
        for (var col = 0; col < width; col++) {
          var r = frame.data[(row * width + col) * 4 + 0] / 255.0;
          var g = frame.data[(row * width + col) * 4 + 1] / 255.0;
          var b = frame.data[(row * width + col) * 4 + 2] / 255.0;
          var a = 1.0;

          //rmr.log(r, g, b, a);

          ct.fillColor(r, g, b, a).fillRect(col * 12 + 4, row * 12 + 4, 4, 4);
        }
      }
    } else {
      ct.fillStyle('white');
      for (var row = 0; row < height; row++) {
        for (var col = 0; col < width; col++) {
          ct.fillRect(col * 12 + 4, row * 12 + 4, 4, 4);
        }
      }
    }

  });
};

return rte;

});
