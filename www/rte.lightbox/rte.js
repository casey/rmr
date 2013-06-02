'use strict';

// trackball driver

define(function(require) {

var rmr = require('all');
var $   = rmr.$;

require('pipeline');

/*

       2 -+- ________________ ++- 3
           /|               /|
          / |              / |
         /  |             /  |
   6 -++/________________/+++| 7
        |   |            |   |
        |   |            |   |
        |   |            |   |
        |   | --- 0      |   |
        |   |___________ |___| +-- 1
        |   /            |   /
        |  /             |  /
        | /              | /
   4 --+|________________|/+-+ 5
     
*/


var cube = rmr.pipeline()
.range(8)
.smear(3)
.and(1, 2, 4)
.bin()
.sub(0.5)
.mul(2)
.take(3, 0, 2, 1, // back
         1, 2, 3,

         4, 5, 7, // front
         7, 6, 4,

         1, 3, 7, // right
         7, 5, 1,

         0, 4, 6, // left
         6, 2, 0,
        
         2, 6, 7, // top
         7, 3, 2,

         0, 1, 5, // bottom
         5, 4, 0)
.push(3, 1)
.map(12, function (a) {
  var v0 = rmr.vec3(a[0], a[1], a[2 ]);
  var v1 = rmr.vec3(a[4], a[5], a[6 ]);
  var v2 = rmr.vec3(a[8], a[9], a[10]);

  var s0 = rmr.vec3(); v1.sub(v0, s0);
  var s1 = rmr.vec3(); v2.sub(v1, s1);

  var r = s0.cross(s1);

  r.normalize();

  return [a[0], a[1], a[2],  a[3],  r[0], r[1], r[2], 0, 
          a[4], a[5], a[6],  a[7],  r[0], r[1], r[2], 0,
          a[8], a[9], a[10], a[11], r[0], r[1], r[2], 0];
})
//.push(4, 0, 0, 0, 0)
//.pop(8, 4)
.push(8, 0, 1, 1, 1)
.data()

var lightbox = {
  path:     '/lightbox',
  template: require('text!./template.html')
};

lightbox.controller = function ($scope) {
  rmr.info('lightbox.controller');

  var root = rmr.node('root');
  var eye  = root.spawn('eye').translateZ(6).chainDriver();

  root.spawn('axes').basic().triangles().axes()//.find('origin').color('black').parent().flatten()

  root.spawn('cube').flat().vertices(cube).primitive(rmr.gl.TRIANGLES).program('flat.tx');

  var cam = rmr.camera('root').canvas('canvas.main').eye(eye).scene(root).perspective();

  rmr.globalize({cam: cam, root: root});

  $scope.$on('frame', function () { cam.tick(); });
};

return lightbox;

});
