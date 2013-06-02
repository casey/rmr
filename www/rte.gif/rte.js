'use strict';

define(function(require) {

var rmr = require('all');
var $   = rmr.$;

var gif = {
  path:     '/gif'
, template: require('text!./template.html')
, style:    require('text!./style.css')
, stats: false
};

// preload all the gifs
// play the first image 10 times
// change the amount of tiling

/*
for (var i = 0; i < count; i++) {

  var url = 'img/' + backgrounds[i].replace(/ +/, '') + '.jpg';
  var div = $('<div>');
  div.css('display', 'none');
  div.addClass('portrait');
  div.appendTo('.portraits');
  }
}
*/

function url(n) {
  return '/srv/dat/gif/' + n + '.gif';
}

gif.controller = function ($scope) {
  var count = 4;
  var i     = 0;

  $scope.$on('frame', function () {
    if (rmr.key.space.pressed()) {
      var u = url(i);
      rmr.log(u);

      //"url('/srv/dat/gif/1.gif') no-repeat center center fixed");
      $('.gifs').css('background', 'url(' + u + ')');
      i = (i + 1) % count;
    }

  });
  /*
  var images = [];

  var div = $('<div>');
  var url = '/srv/dat/gif/0.gif';
  // do this with a class + style
  div.css('background', 'url(' + url + ') no-repeat center center fixed');
  div.css('background-size', 'cover');
  div.appendTo('.gifs');
  */
};


return gif;

});
