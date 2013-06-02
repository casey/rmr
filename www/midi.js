'use strict';

define(function(require) {
  var rmr      = require('rmr'     );
  var jmb      = require('jmb'     );

  // todo:
  //   throw a good error if the midi plugin isn't present
  //   log of all midi events


  var midi = rmr.midi = {};

  /*
  jmb.init(function (ma) {
    rmr.log('midi ready');
    var ins = ma.enumerateInputs();
    rmr.log('found ' + ins.length + ' midi inputs');
    var op1 = null;
    for (var i = 0; i < ins.length; i++) {
      var name = ins[i].deviceName;
      rmr.log(name);
      if (name === "OP-1 Midi Device") {
        rmr.log('op1 bus input found at ' + i);
        op1 = ma.getInput(i);
        break;
      }
    }

    window.op1 = op1;
    op1 === null && rmr.die('op1 bus not found!');

    op1.addEventListener("midimessage", function (msg) {
      rmr.log('got message: ' + msg)
    });
  });
  */

  return rmr;
});
