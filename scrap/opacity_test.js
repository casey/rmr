
  var a = $('.a');
  var b = $('.b');
  var c = $('.c');
  var d = $('.d');

  var ag = rmr.glod().canvas('.a');
  var bg = rmr.glod().canvas('.b');
  var cg = rmr.glod().canvas('.c');
  var dg = rmr.glod().canvas('.d');

  var root = rmr.node('root').basic();
  var eye  = root.spawn('eye').translateZ(6).chainDriver();

  root.spawn('axes').triangles().axes();

  var cam = rmr.camera('root').canvas('canvas.b').eye(eye).scene(root).perspective();

  rmr.globalize({cam: cam, root: root});

  var start = rmr.now();

  $scope.$on('frame', function () { 
    var t = (rmr.now() - start) / 5000;

    b.css('opacity', (t * 2).clamp(0.0, 1.0));
    c.css('opacity', (t * 2 - 1).clamp(0.0, 1.0));
    b.css('opacity', 1 - (t * 2 - 1).clamp(0.0, 1.0));

    /*
    if (rmr.key.a.pressed()) a.toggle();
    if (rmr.key.s.pressed()) b.toggle();
    if (rmr.key.d.pressed()) c.toggle();
    if (rmr.key.f.pressed()) d.toggle();
    */

    ag.clearColor(0, 0, 0, 1).clear(true, true, true);
    bg.clearColor(0, 0, 0, 1).clear(true, true, true);
    cg.clearColor(0, 0, 0, 1).clear(true, true, true);
    //dg.clearColor(0, 1, 0, 0).clear(true, true, true);

    cam.tick();
  });
};

return rte;
});
