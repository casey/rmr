  require('dsp');

  var factor  = 0;

  function process_audio(e) {
    // Copy input arrays to output arrays to play sound
    var input_l  = e.inputBuffer.getChannelData(0);
    var input_r  = e.inputBuffer.getChannelData(1);
    var output_l = e.outputBuffer.getChannelData(0);
    var output_r = e.outputBuffer.getChannelData(1);

    var l = input_l.length;
    for (var i = 0; i < l; ++i) {
      output_l[i] = input_l[i];
      output_r[i] = input_r[i];
      signal[i] = (input_l[i] + input_r[i]) / 2;
    }

    fft.forward(signal);

    factor = rmr.sum(fft.spectrum);
    window.factor = factor;
  }

  var spectrum = [];

  var signal = new Float32Array(Math.pow(2,12));
  var fft    = new FFT(signal.length, 44100);

  var context = new webkitAudioContext();
  var source = context.createBufferSource();

  var jsProcessor = context.createJavaScriptNode(1024);
  jsProcessor.onaudioprocess = process_audio;
  source.connect(jsProcessor);
  jsProcessor.connect(context.destination);

  // Load the sample buffer for the audio source
  var request = new XMLHttpRequest();
  request.open("GET", "dat/wheel.m4a", true);
  request.responseType = "arraybuffer";

  request.onload = function() { 
    return;
    source.buffer = context.createBuffer(request.response, false);
    source.loop = false;
    source.noteOn(0);
  }

  request.send();

  var scene   = $('.scene'   );
  var ap      = $('.aperture');
  var canvas  = scene[0];

  var root    = rmr.node('root');

  var eye     = root.spawn('eye')
                    .translate(0, 0, 10)
                    .chainTick(updateEye); // lol hoisting
  var lastPosition = {x: 0, y: 0};
  var delta        = {x: 0, y: 0};

  var stats = rmr.stats();
  stats.element.appendTo(document.body);

  $(document).mousemove(function(e) {
    if (rmr.key.mouse_left.down()) {
      delta.x += lastPosition.x - e.pageX;
      delta.y += lastPosition.y - e.pageY;
    }

    lastPosition.x = e.pageX;
    lastPosition.y = e.pageY;

    e.preventDefault();
  });

  $(document).mousedown(function(e) {
    e.preventDefault();
  });

  var resized = true;
  $(window).resize(function (e) { resized = true; });

  function updateEye(eye, now, dt) {
    var speedFactor = dt * 0.01 * (rmr.key.shift.down() ? 10 : 1);

    var rotationSpeed = 0.005 * speedFactor;
    var movementSpeed = 1 * speedFactor;

    if (rmr.key.w.down()) eye.translate(0, 0, -movementSpeed);
    if (rmr.key.s.down()) eye.translate(0, 0, movementSpeed);
    if (rmr.key.a.down()) eye.translate(-movementSpeed, 0, 0);
    if (rmr.key.d.down()) eye.translate(movementSpeed, 0, 0);
    if (rmr.key.c.down()) eye.translate(0, -movementSpeed, 0);
    if (rmr.key.e.down()) eye.translate(0, movementSpeed, 0);

    if (rmr.key.up   .down()) eye.rotateX(rotationSpeed);
    if (rmr.key.down .down()) eye.rotateX(-rotationSpeed);
    if (rmr.key.left .down()) eye.rotateY(rotationSpeed);
    if (rmr.key.right.down()) eye.rotateY(-rotationSpeed);

    eye.rotateY(-delta.x / 1000);
    eye.rotateX(-delta.y / 1000);

    delta.x = delta.y = 0;
    rmr.key.clear();
  }

  var v = rmr.vec3();

  root.triangles();

  /*
  root.iterate(100, function () {
    return this.cycleCardinality().spawn('circle').polygon(100).translate(0, 0, -1).color('random');
  });


  root.iterate(1000, function () {
    this.spawn('cuboid')
        .cuboid(v.randomize().scale(0.1))
        .color('random')
        //.rotateZXZ(v.randomize(rmr.TAU))
        .translate(v.randomize(-1, 1).scale(2.5))
        //.mergeUp();
  });
  */

  /*

     static typing
     explicit memory management
      stack
      heap
      gc heap
     strict functions:
      args must match params
      must match types

     dynamic typing
     garbage collection
     lenient functions:
      any number of args is possible
      or just match number of arguments
     lenient objects:
      any object can have members added to it at runtime
      any member access will succeed, but might return undefined
  */

  // end of line marker
  // beginning of line marker
  // line separator

  /*
  var sides = 3;
  root.iterate(100, function () {
    this.spawn('circle')
        .polygon(sides++)
        .color('random')
        .translate(v.randomize(-10, 10))
        .rotateZXZ(v.randomize(rmr.TAU))
    ;
  });
  */

  var sides = 3;
  root
  .spawn('outer').iterate(500, function () {
    this.spawn()
        .cube()
        .color('random_alpha')
        .rotateZXZ(v.randomize(rmr.TAU))
        .scale(10)
        .translate(v.randomize(-3, 3).add(4))
    ;
  })
    .spawn('cubes').iterate(100, function () {
    this.spawn()
        .cube()
        .color('random_alpha')
        .rotateZXZ(v.randomize(rmr.TAU))
        .scale(1)
        .translate(v.randomize(-2, 2))
    ;
  })
  ;



  var cam = rmr.camera('root')
               .canvas(canvas)
               .eye(eye)
               .scene(root)
               .clearColor('black');

  cam.active(false);
  var cam0 = cam.spawn('0').viewport('.q0');
  var cam1 = cam.spawn('1').viewport('.q1');
  var cam2 = cam.spawn('2').viewport('.q2');
  var cam3 = cam.spawn('3').viewport('.q3');

  function updateRoot(root, now, dt) {
    root.rotateY(dt * rmr.TAU * 0.00001)
        .rotateZ(dt * rmr.TAU * 0.00001);

    var f = Math.log(factor);
    var cubes = root.find('cubes');

    return;

    for (var i =0; i < cubes._children.length; i++) {
      cubes._children[i].color()[3] = f;
    }

    var outer = root.find('outer');

    for (var i =0; i < outer._children.length; i++) {
      outer._children[i].color()[3] = f;
    }
  };


  root.chainTick(updateRoot);

  /*
  root.spawn('points').pointSize(10).cardinality(1).iterate(10000, function () {
    this.pushVertex(v.randomize(-1, 1));
  });
  */


  //root.spawn('sprite').setSprite('img/dia/0.png').scale(4);

  //stats.hide();

  var period = 1000;
  var start  = Date.now();
  var t      = start;
  var m = 0;

  function frame() {
    if (rmr.dead) return;

    try {
      var now     = Date.now();
      var dt      = now - t;
      var elapsed = now - start;
      
      var x = (elapsed % period) / period;

      m = (Math.sin(x * Math.PI * 2) + 1) / 2;

      //rmr.log(m);

      //root.clearTransform().scale(m);


      if (resized) {
        var sa = scene.aperture();
        canvas.width  = sa.width;
        canvas.height = sa.height;
        //canvas.width = 100;
        //canvas.height = 50;
        resized = false;
        cam .perspective();
        cam0.perspective();
        cam1.perspective();
        cam2.perspective();
        cam3.perspective();
      }

      //root.verifyTree();
      root.tickTree();
      cam.renderTree();
      stats.frame();
    } catch (e) {
      rmr.dead = true;
      throw e;
    }
  };

  var glod = cam.glod();
  var gl   = cam.gl();
  rmr.globalize('rmr $ _ root cam glod gl spectrum', eval(rmr.evaler));
  rmr.removeSBI();
  rmr.disallowGarbage();
  setInterval(frame, 0);
