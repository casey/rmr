'use strict';

define(function(require) {
var rmr = require('rmr');

require('ilk');

var blk = rmr.ilk('btc_blk');

return;
});
//!name tx

precision highp float;

varying vec4 v_color;
varying vec4 v_normal;
varying vec4 v_position;

//!vertex

//uniform mat4 transform;

attribute vec4 position;
attribute vec4 normal;

attribute vec4 tc0;
attribute vec4 tc1;
attribute vec4 tc2;
attribute vec4 tc3;

//attribute vec4 color;

// add point size support

void main() {
  //v_color = color;
  v_normal = normal;
  v_position = position;

  // v = vec3(gl_ModelViewMatrix * gl_Vertex);       
  // N = normalize(gl_NormalMatrix * gl_Normal);
  // gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;  
  // vNormal = normalize( normalMatrix * normal );

  //gl_Position = transform * position;
  gl_Position = tc0 * position.x
              + tc1 * position.y
              + tc2 * position.z
              + tc3;
}

//!fragment

void main() {
  //gl_FragColor = v_color + vec4((v_normal.xyz + 1.0) * 0.5, 0.0);
  bool x = abs(v_position.x) > 0.9;
  bool y = abs(v_position.y) > 0.9;
  bool z = abs(v_position.z) > 0.9;
 
  gl_FragColor = vec4(0.0, 0.5 * normalize(v_normal.yz) + 0.5, 1.0);

  if ((x && y) || (y && z) || (z && x)) {
    //gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    gl_FragColor += vec4(0.1);
  }

  //gl_FragColor = v_color;
}
'use strict';

define(function(require) {
var rmr = require('rmr');

require('ilk');
require('pipeline');
require('vec');

var tx = rmr.ilk('btc_tx');

var data = rmr.pipeline()
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
//.push(8, 0, 1, 1, 1)
.f32()

tx.init = function() {
  this._ = {};
  this._.hash = null;
};

tx.render = function (camera, nodes) {
  var glod = camera.glod();
  var gl   = camera.gl();

  if (!glod.hasVBO('tx')) {
    glod.createVBO('tx');
    gl.bindBuffer(gl.ARRAY_BUFFER, glod.vbo('tx'));
    gl.bufferData(gl.ARRAY_BUFFER, data.buffer, gl.STATIC_DRAW);
  }

  if (!glod.hasProgram('tx')) {
    glod.hasProgram('tx') || glod.createProgram('tx');
  }
  
  //gl.bindBuffer(gl.ARRAY_BUFFER, glod.vbo('tx'));

  //glod.start('tx')/*.attrib('color')*/.fixOffsets('tx');
  glod.start('tx')/*.attrib('color')*/.attrib('tc0').attrib('tc1').attrib('tc2').attrib('tc3').fixOffsets('tx');

  var count = data.length / glod.strideFloats();

  var ext = glod.extensions.ANGLE_instanced_arrays;

  var transforms = rmr.stack.main.alloc(Float32Array, nodes.length * 16);

  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    var m = node.matrix();

    for (var j = 0; j < 16; j++) {
      transforms[i * 16 + j] = m[j];
    }
  };

  if (!glod.hasVBO('bulk')) {
    glod.createVBO('bulk');
  };

  var bulk = glod.vbo('bulk');

  gl.bindBuffer(gl.ARRAY_BUFFER, bulk);
  gl.bufferData(gl.ARRAY_BUFFER, transforms.buffer, gl.STATIC_DRAW);

  ['tc0', 'tc1', 'tc2', 'tc3'].forEach(function (name, i) {
    var loc = glod.location(name);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 16 * 4, 16 * i);
    ext.vertexAttribDivisorANGLE(loc, 1);
  });

  ext.drawArraysInstancedANGLE(gl.TRIANGLES, 0, count, nodes.length);
  
  rmr.stack.main.free(transforms);

  return;

  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];

    var m = node.matrix();

    glod.attrib('tc0', m[0 ], m[1], m[2], m[3]);
    glod.attrib('tc1', m[4 ], m[5], m[6], m[7]);
    glod.attrib('tc2', m[8 ], m[9], m[10], m[11]);
    glod.attrib('tc3', m[12], m[13], m[14], m[15]);
        
        //node.matrix())
    //glod.attrib('color',      node.color())

    ext.drawArraysInstancedANGLE(gl.TRIANGLES, 0, count, 1);
  }
};

var colors = {};

tx.node.color = function () {
  rmr.allowGarbage();
  colors[this.hash()] || (colors[this.hash()] = rmr.color('random'));
  rmr.disallowGarbage();
  colors[this.hash()][3] = 1;
  return colors[this.hash()];
};

tx.node.hash = function (hash) {
  if (arguments.length === 0) {
    return this._.hash;
  };

  this._.hash = hash;

  return this;
};

rmr.ilk.extend('none', 'tx', function () {
  return this.ilk('btc_tx');
});

return;
});
