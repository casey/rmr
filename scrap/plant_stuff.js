  var waveData = new Uint8Array(buckets);
  var freqData = new Uint8Array(buckets);



  var min     = Infinity;
  var max     = -Infinity;
  var current = 0;

  var scale = 0;
  var state = 0;

  root.chainTick(function (_, now, dt) {
    return;
      ax.getByteTimeDomainData(waveData);
      ax.getByteFrequencyData(freqData);

      if (rmr.key.space.pressed()) {
        state++;
      }

      if (state % 3 == 1) {
        scale += dt * 0.0005;
      }

      if (state % 3 == 2) {
        scale -= dt * 0.0005;
      }

      scale = Math.min(Math.max(scale, 0), 1);
  });
