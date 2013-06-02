'use strict';

define(function(require) {
  var rmr = require('all');

  require('ct');

  var rte = {
    path:       '/splat'
  , template:   require('text!./template.html')
  , style:      require('text!./style.css')
  , stats:      false
  };

  function rgb(r, g, b, a) {
    (r >= 0 && r <= 255) || rmr.die('r');
    (g >= 0 && g <= 255) || rmr.die('g');
    (b >= 0 && b <= 255) || rmr.die('b');
    (a >= 0 && a <= 255) || rmr.die('a');
    return 'rgb(' + r + ', ' + g + ', ' + b + ', ' + a / 255 + ')';
  };

  rte.controller = function ($scope) {
    var canvas     = $('canvas.main');
    var ct         = rmr.ct(canvas);
    var imageStart = null;
    var data       = new Array(10);
    var images     = new Array(10);
    var index      = 0;
    var period     = 15 * 1000;

    var load = function(i) {
      if (images[i]) return;

      var img = images[i]=  new Image();
      img.onload = function () {
        var canvas = $('<canvas>');
        canvas.attr('width', img.width)
              .attr('height', img.height);

        var ct = rmr.ct(canvas);
        ct.drawImage(img, 0, 0, img.width, img.height);
        data[i] = ct.getImageData(0, 0, canvas.attr('width'), canvas.attr('height'));
        rmr.log('loaded', img.src);
      };

      img.src = 'srv/splat/' + i + '.jpg';
    }

    $scope.$on('frame', function () {
      load(index);

      if (!window.xyz) {
        window.xyz = true;
        canvas.scale();
      }
      //ct.fillRect(25, 25, 50, 50);

      var d = data[index];
      if (!d) return;

      imageStart = imageStart || rmr.now();
      var imageAspect  = d.width / d.height;
      var targetArea   = canvas.height() * (canvas.height() * imageAspect); //todo: wtf height x height?
      var drawn        = 0;
      var imageElapsed = rmr.now() - imageStart;

      rmr.globalize({d: d});

      while (drawn < targetArea) {
        var x = ~~(Math.random() * d.width);
        var y = ~~(Math.random() * d.height);

        var offset = (x + y * d.width) * 4;

        var r = d.data[offset + 0];
        var g = d.data[offset + 1];
        var b = d.data[offset + 2];
        var a = d.data[offset + 3];

        var ty = canvas.height() * (y / d.height);
        var tw = canvas.height() * imageAspect;
        var tx = (x / d.width) * tw + canvas.width() / 2 - tw / 2;

        if (imageElapsed < period) {
          var progress = imageElapsed / period;
          var s = 100 * (-Math.log(progress));
        } else {
          var progress = 1 - ((imageElapsed - period) / (period / 2));
          var s = 100 * (-Math.log(progress));

          /*
          if (imageElapsed > (period * 1.5) && !loading) {
            nextImage();
          }
          */
        }

        if (!(s < 10000)) {
          s = 10000;
        }

        if (!(s > 4)) {
          s = 4;
        }

        ct.fillColor(r / 255, g / 255, b / 255, 1)
          .fillRect(tx - s / 2, ty - s / 2, s, s);

        drawn += s * s;
      }
    });

    rmr.globalize({data: data, ct: ct});
  };

  return rte;
});
