'use strict';

// todo:
//   color shader
//   position feedback
//   previous position feedback
//   two system mixing
//
// gross:
//   ilk system
//     managing which "type" your scene graph nodes are is kind of weird
//     the whole prototype mutation thing is unsettling, probably for no good reason
//     could constrain geometry to leaf nodes
//     could make subtrees homogeneous
//   global shader cache
//
// could define a protocol and then do a runtime check that the given ilk conforms to the protocol

define(function(require) {

var rmr = require('all');
var $   = rmr.$;
var _   = rmr._;

rmr.glod.preprocess(require('text!./debug.glsl'));
rmr.glod.preprocess(require('text!./draw.glsl'  ));
rmr.glod.preprocess(require('text!./step.glsl'  ));

var rte = {
  path:     '/system',
  template: '<canvas class="main"></canvas>'
};

rte.controller = function ($scope) {
  rmr.info('system.controller');

  var side = 1 << 10;
  var count = side * side;

  var indices = _.range(count);

  var glod = rmr.glod()

  var projection = rmr.mat4().identity().perspective(rmr.TAU / 8, 1, 0.1, 20000);
  var view = rmr.mat4().identity();
  var mvp  = rmr.mat4().identity();

  glod
  .canvas('.main')
  .clearColor(0.0, 0.0, 0.0, 1.0)
  .createProgram('debug')
  .createProgram('draw')
  .createProgram('step')
  .createVBO('index')
  .createTexture('position')
  .createVBO('quad')
  .uploadCCWQuad('quad')
  .createFBO('particles')
  .bufferDataStatic('index', indices)

  var gl = glod.gl();

  glod.bindTexture2D('position');
  gl.activeTexture(gl.TEXTURE0);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, side, side, 0, gl.RGBA, gl.FLOAT, null);

  glod.bindFramebuffer('particles');
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, glod.texture('position'), 0);

  var start = rmr.now();

  $scope.$on('frame', function (e, now, dt) {
    var elapsed = now - start;

    //rmr.log(elapsed);

    //rmr.log(dt);

    // bind a framebuffer
    // set the viewport and scissor
    // set up some data
    // provide some values
    // render a quad
    //
    // re-bind the old framebuffer
    // re-set the old viewport and scissor
    // draw the points to the old framebuffer

    // glod
    // .pushFramebuffer('particles')
    // .popFramebuffer()


    glod
    .bindFramebuffer('particles')
    .viewport(0, 0, side, side)
    .begin('step')
    .value('side', side)
    .value('elapsed', elapsed / 1000)
    .pack('quad', 'position')
    .ready()
    .clear(true, true, true)
    .triangles()
    .drawArrays(0, 6)
    .end();

    // debug draw
    glod
    .bindFramebuffer(null)
    .viewport()
    .begin('debug')
    .pack('quad', 'position')
    .value('texture', 0)
    .ready()
    .clear(true, true, true)
    .triangles()
    .drawArrays(0, 6)
    .end();

    var aspect = glod.canvas().width() / glod.canvas().height();

    projection.perspective(rmr.TAU / 8, aspect, 0.1, 20000);
    view.identity().translate(0, 0, -5).rotateY(rmr.TAU * elapsed * 0.00001);
    projection.mult(view, mvp);

    // draw as individual points
    glod
    .bindFramebuffer(null)
    .viewport()
    .begin('draw')
    .pack('index', 'index')
    .value('side', side)
    .value('position', 0)
    .valuev('transform', mvp)
    .ready()
    .clear(true, true, true)
    .points()
    .drawArrays(0, count)
    .end();
  });

  rmr.globalize({glod: glod});
};

return rte;

});
